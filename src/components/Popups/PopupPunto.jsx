import { formatNumberCL } from "../../utils/formatNumberCL"
import { getPuntoTypeLabel } from "../../utils/mapUtils"


export const PopupPunto = ({punto, handleShowSidebarCuencas, handleShowSidebarSubcuencas, handleShowSidebarPunto}) => {
  // Determinar si la subcuenca tiene registro o no
  const subcuencaNombre = punto.nombre_subcuenca || 'Sin registro';
  const subcuencaCodigo = punto.cod_subcuenca || 'sin_registro';

  return (
    <div className="text-sm flex flex-col justify-between items-start">
      <p className='flex gap-2'>
        <strong>Cuenca:</strong> {punto.nombre_cuenca}
        <span
          onClick={() => handleShowSidebarCuencas(punto.nombre_cuenca, punto.cod_cuenca)}
          className='cuenca-analizar'
        >
          (Ver Detalles)
        </span>
      </p>
      <p className='flex gap-2'>
        <strong>Subcuenca:</strong> {subcuencaNombre}
        <span
          onClick={() => handleShowSidebarSubcuencas(subcuencaNombre, subcuencaCodigo, punto.cod_cuenca, punto.nombre_cuenca)}
          className='subcuenca-analizar'
        >
          (Ver Detalles)
        </span>
      </p>
      <p><strong>Tipo:</strong> {getPuntoTypeLabel(punto)}</p>
      <p><strong>Caudal promedio:</strong> {punto.caudal_promedio.toLocaleString()} (L/s)</p>
      <p><strong>Nº de Mediciones:</strong> {formatNumberCL(punto.n_mediciones)}</p>
      <button
        className='bg-cyan-800 text-white p-2 cursor-pointer hover:bg-cyan-600'
        onClick={() => handleShowSidebarPunto(punto)}
      >
        Analizar Punto
      </button>
    </div>
  )
}
