import { formatNumberCL } from "../../utils/formatNumberCL"


export const PopupPunto = ({punto, handleShowSidebarCuencas, handleShowSidebarPunto}) => {
  return (
    <div className="text-sm flex flex-col justify-between items-start">
      <p className='flex gap-2'>
        <strong>Cuenca:</strong> {punto.nombre_cuenca}
        <span
          onClick={() => handleShowSidebarCuencas(punto.nombre_cuenca, punto.cod_cuenca)}
          className='text-cyan-800 underline cursor-pointer cuenca-analizar'
        >
          (Ver Detalles)
        </span>
      </p>
      <p><strong>Subcuenca:</strong> {punto.nombre_subcuenca}</p>
      <p><strong>Caudal promedio:</strong> {punto.caudal_promedio.toLocaleString()} (m³/s)</p>
      <p><strong>Nº de Mediciones:</strong> {formatNumberCL(punto.n_mediciones)}</p>
      <button
        className='bg-cyan-800 text-white p-2 cursor-pointer hover:bg-cyan-600'
        onClick={() => handleShowSidebarPunto(punto.utm_norte, punto.utm_este, punto.tipoPunto.altura)}
      >
        Analizar Punto
      </button>
    </div>
  )
}
