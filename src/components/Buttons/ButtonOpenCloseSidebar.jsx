import { useEffect } from "react";

export const ButtonOpenCloseSidebar = ({ toggleSidebar, isFiltrosSidebar = false }) => {
  // en móvil, ambos usan top-3/left-3; en md+ cambian a su posición “clásica”
  
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && toggleSidebar(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggleSidebar]);

  
  const posClasses = isFiltrosSidebar
    ? "top-1 right-1 md:top-1 md:left-auto md:-left-2"   // sidebar de filtros (izquierda)
    : "top-3 right-3 md:top-1 md:right-auto md:left-1";  // sidebars de la derecha

    
  return (
    <button
      type="button"
      onClick={() => toggleSidebar(false)}
      className={`
        absolute ${posClasses}
        z-[1100]
        w-11 h-11 md:w-10 md:h-10
        rounded
        bg-gray-700 hover:bg-gray-600 active:bg-gray-800
        text-white hover:text-cyan-300
        flex items-center justify-center
        shadow-lg
        focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500
        transition
        cursor-pointer
      `}
      aria-label="Cerrar panel"
      title="Cerrar"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6 md:h-5 md:w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18 6L6 18" />
        <path d="M6 6l12 12" />
      </svg>
    </button>
  );
};
