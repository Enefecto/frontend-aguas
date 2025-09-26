import { useState } from 'react';

export const useSidebarState = () => {
  const [sidebarAbierto, setSidebarAbierto] = useState(true);
  const [rightSidebarAbiertoCuencas, setRightSidebarAbiertoCuencas] = useState(false);
  const [rightSidebarAbiertoPunto, setRightSidebarAbiertoPunto] = useState(false);

  const openCuencaSidebar = () => {
    setRightSidebarAbiertoPunto(false);
    setRightSidebarAbiertoCuencas(true);
  };

  const openPuntoSidebar = () => {
    setRightSidebarAbiertoCuencas(false);
    setRightSidebarAbiertoPunto(true);
  };

  const closeRightSidebars = () => {
    setRightSidebarAbiertoCuencas(false);
    setRightSidebarAbiertoPunto(false);
  };

  return {
    // Estados
    sidebarAbierto,
    setSidebarAbierto,
    rightSidebarAbiertoCuencas,
    setRightSidebarAbiertoCuencas,
    rightSidebarAbiertoPunto,
    setRightSidebarAbiertoPunto,

    // Funciones de conveniencia
    openCuencaSidebar,
    openPuntoSidebar,
    closeRightSidebars
  };
};