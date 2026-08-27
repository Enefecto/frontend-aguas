#!/usr/bin/env python3
"""
Genera src/constants/coordenadasFueraDeCuenca.js.

Por qué existe
--------------
El mapa necesita distinguir una coordenada real de una mal georreferenciada.
La versión anterior aproximaba la costa de Chile con siete escalones rectos de
longitud fija, y el escalón del Maule (-72,5) cortaba tierra adentro: escondía
las obras de Dunas de Chanco y de Pelluhue, que están al oeste de esa línea
pero perfectamente en tierra.

La máscara correcta son las cuencas hidrográficas BNA de la DGA, que cubren
todo Chile continental. Pero la geometría completa pesa 6,8 MB y cualquier
simplificación que la achique lo suficiente para embarcarla vuelve a cambiar
veredictos en la costa, que es justo el error que se está corrigiendo.

Por eso la máscara se evalúa acá, fuera de línea y a resolución completa, y al
navegador solo viaja el resultado: la lista de coordenadas que quedan fuera.
Hoy son siete de 6.098.

Cuándo re-correrlo
------------------
Cada vez que el DW cargue datos nuevos. Un punto que entre después de la última
corrida no está evaluado y el mapa lo va a dibujar: el default es dejar pasar,
porque mostrar un punto dudoso es preferible a esconder una obra real.

Uso
---
    uv run --with pyshp --with shapely --with requests \\
        python scripts/generar_mascara_cuencas.py

    # contra un backend distinto
    API_URL=http://localhost:8000 uv run ... python scripts/generar_mascara_cuencas.py

Requiere `node` en el PATH: la conversión UTM → lat/lon se hace llamando al
mismo módulo que usa la aplicación, para que no haya dos implementaciones que
puedan divergir.
"""

import json
import os
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path
from urllib.request import urlopen

RAIZ = Path(__file__).resolve().parent.parent

API_URL = os.environ.get(
    "API_URL",
    "https://aguatrasparenteapi-h2d4gvbcfvcjfycr.eastus2-01.azurewebsites.net",
)

# Mapoteca digital de la DGA → Cuencas → "Cuencas BNA" (shapefile, 2000).
# https://dga.mop.gob.cl/mapoteca-digital/
CUENCAS_URL = "https://dga.mop.gob.cl/uploads/sites/13/2024/07/Cuencas_BNA-1.zip"

SALIDA = RAIZ / "src" / "constants" / "coordenadasFueraDeCuenca.js"

# Convierte con el módulo real de la app en vez de reimplementar la proyección.
CONVERSOR_JS = """
import { convertPuntoUTMtoLatLon } from '__UTILS__';
import { readFileSync, writeFileSync } from 'fs';
const puntos = JSON.parse(readFileSync(process.argv[2], 'utf8'));
writeFileSync(process.argv[3], JSON.stringify(puntos.map(p => {
  const c = convertPuntoUTMtoLatLon(p);
  return { utm_norte: p.utm_norte, utm_este: p.utm_este,
           lat: c.lat, lon: c.lon, sector_sha: p.sector_sha };
})));
"""


def descargar_cuencas(destino: Path) -> Path:
    zip_path = destino / "Cuencas_BNA.zip"
    if not zip_path.exists():
        print(f"  bajando {CUENCAS_URL}")
        with urlopen(CUENCAS_URL, timeout=300) as r:
            zip_path.write_bytes(r.read())
    with zipfile.ZipFile(zip_path) as z:
        z.extractall(destino)
    shps = list(destino.rglob("*.shp"))
    if not shps:
        sys.exit("No se encontró ningún .shp dentro del zip de Cuencas BNA")
    return shps[0]


def traer_puntos() -> list:
    url = f"{API_URL}/api/puntos?limit=10000"
    print(f"  consultando {url}")
    with urlopen(url, timeout=300) as r:
        return json.loads(r.read())


def convertir(puntos: list, tmp: Path) -> list:
    """Proyecta con el mismo código que la app, vía node."""
    utils = (RAIZ / "src" / "utils" / "utmConverter.js").as_posix()
    js = tmp / "conv.mjs"
    js.write_text(CONVERSOR_JS.replace("__UTILS__", utils))
    entrada, salida = tmp / "in.json", tmp / "out.json"
    entrada.write_text(json.dumps(puntos))
    subprocess.run(
        ["node", str(js), str(entrada), str(salida)], check=True, cwd=RAIZ
    )
    return json.loads(salida.read_text())


def main() -> None:
    import shapefile  # pyshp
    from shapely.geometry import Point, shape
    from shapely.ops import unary_union
    from shapely.prepared import prep

    with tempfile.TemporaryDirectory() as td:
        tmp = Path(td)

        print("Cuencas BNA:")
        shp = descargar_cuencas(tmp)
        sf = shapefile.Reader(str(shp))
        poligonos = []
        for forma in sf.shapes():
            g = shape(forma.__geo_interface__)
            if not g.is_valid:
                g = g.buffer(0)  # cierra anillos mal formados
            poligonos.append(g)
        mascara = prep(unary_union(poligonos))
        print(f"  {len(poligonos)} cuencas")

        print("Puntos:")
        puntos = traer_puntos()
        print(f"  {len(puntos)} desde la API")
        proyectados = convertir(puntos, tmp)

    fuera = [
        p
        for p in proyectados
        if p["lat"] is None
        or p["lon"] is None
        or not mascara.contains(Point(p["lon"], p["lat"]))
    ]
    fuera.sort(key=lambda p: -p["lat"] if p["lat"] is not None else 0)

    print(f"\n  dentro de una cuenca: {len(proyectados) - len(fuera)}")
    print(f"  fuera:                {len(fuera)}")
    for p in fuera:
        print(
            f"    {p['utm_norte']}|{p['utm_este']}  "
            f"lat {p['lat']:9.4f} lon {p['lon']:9.4f}  {p['sector_sha']}"
        )

    entradas = "\n".join(
        f"  // lat {p['lat']:.4f}, lon {p['lon']:.4f} — SHAC: {p['sector_sha'] or 'sin asignar'}\n"
        f"  '{p['utm_norte']}|{p['utm_este']}',"
        for p in fuera
    )

    SALIDA.write_text(
        f"""// GENERADO — no editar a mano.
// Regenerar con: uv run --with pyshp --with shapely python scripts/generar_mascara_cuencas.py
//
// Obras cuya coordenada cae fuera de toda cuenca hidrográfica BNA de la DGA,
// es decir fuera de Chile continental. Son errores de georreferenciación en el
// dato de origen, no del visualizador.
//
// Evaluado sobre {len(proyectados)} obras: {len(proyectados) - len(fuera)} dentro, {len(fuera)} fuera.
// Clave: `${{utm_norte}}|${{utm_este}}`.

export const COORDENADAS_FUERA_DE_CUENCA = new Set([
{entradas}
]);
""",
        encoding="utf-8",
    )
    print(f"\n  escrito {SALIDA.relative_to(RAIZ)}")


if __name__ == "__main__":
    main()
