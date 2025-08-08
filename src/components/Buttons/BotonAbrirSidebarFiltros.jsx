export default function BotonAbrirSidebarFiltros({ setSidebarAbierto }) {
  return (
    <button
      type="button"
      onClick={() => setSidebarAbierto(true)}
      className="
        fixed md:absolute
        bottom-5 left-4 md:bottom-auto md:top-3 md:left-12
        z-[1000]
        inline-flex items-center gap-2
        bg-cyan-700 hover:bg-cyan-600 active:bg-cyan-800
        text-white
        px-4 py-3 md:px-3 md:py-1.5
        rounded-full md:rounded
        shadow-lg md:shadow
        focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500
        transition
        cursor-pointer
      "
      aria-label="Abrir panel de filtros"
    >
      {/* Ícono hamburguesa accesible */}
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-4 md:w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 6h18M3 12h18M3 18h18" />
      </svg>
      <span className="hidden sm:inline">Filtros</span>
    </button>
  );
}
