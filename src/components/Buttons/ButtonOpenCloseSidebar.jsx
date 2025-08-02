export const ButtonOpenCloseSidebar = ({ toggleSidebar, isFiltrosSidebar = false }) => {
  return (
    <button
      onClick={() => toggleSidebar(false)}
      className={`absolute text-white bg-gray-700 w-10 h-10 hover:text-cyan-300 flex items-center justify-center font-bold z-[1100] shadow-lg cursor-pointer ${
        isFiltrosSidebar ? '-top-0 -right-5 rounded text-4xl' : 'top-1 left-1 rounded-full text-2xl'
      }`}
      aria-label="Cerrar sidebar"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="icon icon-tabler icons-tabler-outline icon-tabler-x"
      >
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M18 6l-12 12" />
        <path d="M6 6l12 12" />
      </svg>
    </button>
  );
};
