import { useState, useEffect } from 'react';
import { UI_CONFIG } from '../constants/uiConfig.js';

export const useFilterStatus = (puntos, filtros, filtroCaudal, ordenCaudal, isLoaded, handleCoordenadasUnicas) => {
  const [consultandoPuntos, setConsultandoPuntos] = useState(UI_CONFIG.LOADING_STATES.IDLE);
  const [isOpen, setIsOpen] = useState(false);

  // Animación de apertura del sidebar
  useEffect(() => {
    setTimeout(() => {
      setIsOpen(true);
    }, UI_CONFIG.ANIMATIONS.SIDEBAR_DELAY);
  }, []);

  // Auto-consulta cuando se carga la data inicial
  useEffect(() => {
    if (isLoaded) {
      handleCoordenadasUnicas();
    }
  }, [isLoaded]);

  // Marcar como exitoso cuando lleguen puntos
  useEffect(() => {
    if (puntos.length !== 0) {
      setConsultandoPuntos(UI_CONFIG.LOADING_STATES.SUCCESS);
    }
  }, [puntos]);

  // Reset status cuando cambien filtros
  useEffect(() => {
    setConsultandoPuntos(UI_CONFIG.LOADING_STATES.IDLE);
  }, [filtros.region, filtros.cuenca, filtros.subcuenca, filtros.limit, filtroCaudal, ordenCaudal]);

  // Auto-hide success state
  useEffect(() => {
    if (consultandoPuntos === UI_CONFIG.LOADING_STATES.SUCCESS) {
      const timer = setTimeout(() => {
        setConsultandoPuntos(UI_CONFIG.LOADING_STATES.IDLE);
      }, UI_CONFIG.ANIMATIONS.SUCCESS_DISPLAY_TIME);
      return () => clearTimeout(timer);
    }
  }, [consultandoPuntos]);

  const handleUpdateStateConsultandoPuntos = () => {
    setConsultandoPuntos(UI_CONFIG.LOADING_STATES.LOADING);
  };

  return {
    consultandoPuntos,
    isOpen,
    setIsOpen,
    handleUpdateStateConsultandoPuntos
  };
};