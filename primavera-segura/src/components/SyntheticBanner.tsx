import React from 'react';
import { useApp } from '../data/app_context';
import { Notice } from './ui';

export function SyntheticBanner() {
  const { incidents } = useApp();
  if (!incidents.some((i) => i.source === 'sintetico')) return null;
  return <Notice tone="warning">Datos sintéticos de demostración. No son incidentes reales de Más Bosque Manu.</Notice>;
}
