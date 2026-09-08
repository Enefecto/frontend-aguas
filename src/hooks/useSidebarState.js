import { useState, useCallback } from 'react';

export const useSidebarState = () => {
  const [sidebarAbierto, setSidebarAbierto] = useState(true);
  const [rightSidebarAbiertoCuencas, setRightSidebarAbiertoCuencas] = useState(false);
  const [rightSidebarAbiertoSubcuencas, setRightSidebarAbiertoSubcuencas] = useState(false);
  const [rightSidebarAbiertoPunto, setRightSidebarAbiertoPunto] = useState(false);
  const [rightSidebarAbiertoShac, setRightSidebarAbiertoShac] = useState(false);

  const openCuencaSidebar = useCallback(() => {
    setRightSidebarAbiertoPunto(false);
    setRightSidebarAbiertoSubcuencas(false);
    setRightSidebarAbiertoShac(false);
    setRightSidebarAbiertoCuencas(true);
  }, []);

  const openSubcuencaSidebar = useCallback(() => {
    setRightSidebarAbiertoPunto(false);
    setRightSidebarAbiertoCuencas(false);
    setRightSidebarAbiertoShac(false);
    setRightSidebarAbiertoSubcuencas(true);
  }, []);

  const openPuntoSidebar = useCallback(() => {
    setRightSidebarAbiertoCuencas(false);
    setRightSidebarAbiertoSubcuencas(false);
    setRightSidebarAbiertoShac(false);
    setRightSidebarAbiertoPunto(true);
  }, []);

  const openShacSidebar = useCallback(() => {
    setRightSidebarAbiertoCuencas(false);
    setRightSidebarAbiertoSubcuencas(false);
    setRightSidebarAbiertoPunto(false);
    setRightSidebarAbiertoShac(true);
  }, []);

  const closeRightSidebars = useCallback(() => {
    setRightSidebarAbiertoCuencas(false);
    setRightSidebarAbiertoSubcuencas(false);
    setRightSidebarAbiertoPunto(false);
    setRightSidebarAbiertoShac(false);
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
    rightSidebarAbiertoShac,
    setRightSidebarAbiertoShac,
    openCuencaSidebar,
    openSubcuencaSidebar,
    openPuntoSidebar,
    openShacSidebar,
    closeRightSidebars
  };
};
