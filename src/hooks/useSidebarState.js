import { useState, useCallback } from 'react';

export const useSidebarState = () => {
  const [sidebarAbierto, setSidebarAbierto] = useState(true);
  const [rightSidebarAbiertoCuencas, setRightSidebarAbiertoCuencas] = useState(false);
  const [rightSidebarAbiertoSubcuencas, setRightSidebarAbiertoSubcuencas] = useState(false);
  const [rightSidebarAbiertoPunto, setRightSidebarAbiertoPunto] = useState(false);

  const openCuencaSidebar = useCallback(() => {
    setRightSidebarAbiertoPunto(false);
    setRightSidebarAbiertoSubcuencas(false);
    setRightSidebarAbiertoCuencas(true);
  }, []);

  const openSubcuencaSidebar = useCallback(() => {
    setRightSidebarAbiertoPunto(false);
    setRightSidebarAbiertoCuencas(false);
    setRightSidebarAbiertoSubcuencas(true);
  }, []);

  const openPuntoSidebar = useCallback(() => {
    setRightSidebarAbiertoCuencas(false);
    setRightSidebarAbiertoSubcuencas(false);
    setRightSidebarAbiertoPunto(true);
  }, []);

  const closeRightSidebars = useCallback(() => {
    setRightSidebarAbiertoCuencas(false);
    setRightSidebarAbiertoSubcuencas(false);
    setRightSidebarAbiertoPunto(false);
  }, []);

  return {
    sidebarAbierto,
    setSidebarAbierto,
    rightSidebarAbiertoCuencas,
    setRightSidebarAbiertoCuencas,
    rightSidebarAbiertoSubcuencas,
    setRightSidebarAbiertoSubcuencas,
    rightSidebarAbiertoPunto,
    setRightSidebarAbiertoPunto,
    openCuencaSidebar,
    openSubcuencaSidebar,
    openPuntoSidebar,
    closeRightSidebars
  };
};
