import { useState } from 'react';

export const useSidebarState = () => {
  const [sidebarAbierto, setSidebarAbierto] = useState(true);
  const [rightSidebarAbiertoCuencas, setRightSidebarAbiertoCuencas] = useState(false);
  const [rightSidebarAbiertoSubcuencas, setRightSidebarAbiertoSubcuencas] = useState(false);
  const [rightSidebarAbiertoPunto, setRightSidebarAbiertoPunto] = useState(false);

  const openCuencaSidebar = () => {
    setRightSidebarAbiertoPunto(false);
    setRightSidebarAbiertoSubcuencas(false);
    setRightSidebarAbiertoCuencas(true);
  };

  const openSubcuencaSidebar = () => {
    setRightSidebarAbiertoPunto(false);
    setRightSidebarAbiertoCuencas(false);
    setRightSidebarAbiertoSubcuencas(true);
  };

  const openPuntoSidebar = () => {
    setRightSidebarAbiertoCuencas(false);
    setRightSidebarAbiertoSubcuencas(false);
    setRightSidebarAbiertoPunto(true);
  };

  const closeRightSidebars = () => {
    setRightSidebarAbiertoCuencas(false);
    setRightSidebarAbiertoSubcuencas(false);
    setRightSidebarAbiertoPunto(false);
  };

  return {
    // Estados
    sidebarAbierto,
    setSidebarAbierto,
    rightSidebarAbiertoCuencas,
    setRightSidebarAbiertoCuencas,
    rightSidebarAbiertoSubcuencas,
    setRightSidebarAbiertoSubcuencas,
    rightSidebarAbiertoPunto,
    setRightSidebarAbiertoPunto,

    // Funciones de conveniencia
    openCuencaSidebar,
    openSubcuencaSidebar,
    openPuntoSidebar,
    closeRightSidebars
  };
};