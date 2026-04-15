import { useState, useEffect, useRef } from 'react';
import { UI_CONFIG } from '../constants/uiConfig.js';

export const useFilterStatus = (puntos, filtros, filtroCaudal, ordenCaudal, isLoaded, handleCoordenadasUnicas, queryCompleted, limitMax) => {
  const [consultandoPuntos, setConsultandoPuntos] = useState(UI_CONFIG.LOADING_STATES.IDLE);
  const [isOpen, setIsOpen] = useState(false);
  const [hayFiltrosPendientes, setHayFiltrosPendientes] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const timeoutRef = useRef(null);

  // Animación de apertura del sidebar
  useEffect(() => {
    setTimeout(() => {
      setIsOpen(true);
    }, UI_CONFIG.ANIMATIONS.SIDEBAR_DELAY);
  }, []);

  // Auto-consulta cuando se carga la data inicial Y limitMax esté disponible
  useEffect(() => {
    if (isLoaded && limitMax && !initialLoadDone) {
      // Pasar limitMax como override para asegurar que se use el máximo en la primera carga
      handleCoordenadasUnicas(limitMax);
      setInitialLoadDone(true);
    }
  }, [isLoaded, limitMax]);

  // Marcar como exitoso cuando la consulta se complete (con o sin puntos)
  useEffect(() => {
    if (queryCompleted) {
      setConsultandoPuntos(UI_CONFIG.LOADING_STATES.SUCCESS);
      // Limpiar timeout de seguridad si la consulta terminó
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  }, [queryCompleted]);

  // Reset status cuando cambien filtros y marcar como pendientes
  useEffect(() => {
    setConsultandoPuntos(UI_CONFIG.LOADING_STATES.IDLE);
    setHayFiltrosPendientes(true);
  }, [filtros.region, filtros.cuenca, filtros.subcuenca, filtros.tipoPunto, filtros.limit, filtroCaudal, ordenCaudal]);

  // Limpiar filtros pendientes cuando se complete una consulta
  useEffect(() => {
    if (queryCompleted) {
      setHayFiltrosPendientes(false);
    }
  }, [queryCompleted]);

  // Auto-hide success state
  useEffect(() => {
    if (consultandoPuntos === UI_CONFIG.LOADING_STATES.SUCCESS) {
      const timer = setTimeout(() => {
        setConsultandoPuntos(UI_CONFIG.LOADING_STATES.IDLE);
      }, UI_CONFIG.ANIMATIONS.SUCCESS_DISPLAY_TIME);
      return () => clearTimeout(timer);
    }
  }, [consultandoPuntos]);

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleUpdateStateConsultandoPuntos = () => {
    setConsultandoPuntos(UI_CONFIG.LOADING_STATES.LOADING);

    // Limpiar timeout anterior si existe
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Timeout de seguridad de 30 segundos
    timeoutRef.current = setTimeout(() => {
      setConsultandoPuntos(prev => {
        if (prev === UI_CONFIG.LOADING_STATES.LOADING) {
          console.warn('Timeout: La consulta tardó más de 30 segundos');
          return UI_CONFIG.LOADING_STATES.ERROR;
        }
        return prev;
      });
      timeoutRef.current = null;
    }, 30000);
  };

  return {
    consultandoPuntos,
    isOpen,
    setIsOpen,
    handleUpdateStateConsultandoPuntos,
    hayFiltrosPendientes
  };
};