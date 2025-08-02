export default function BotonAbrirSidebar({ setSidebarAbierto }) {
  return (
    <button
      onClick={() => setSidebarAbierto(true)}
      className="absolute top-3 left-12 bg-blue-600 text-white px-3 py-1 rounded z-[1000] cursor-pointer"
    >
      ☰ Filtros
    </button>
  );
}
