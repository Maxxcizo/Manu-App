import React from 'react';
import { useApp } from '../data/app_context';
import { Banner } from '../ui';

export function SyntheticBanner() {
  const { incidents } = useApp();
  if (!incidents.some((i) => i.source === 'sintetico')) return null;
  return <Banner tone="warning" title="Datos sintéticos de demostración">No son incidentes reales de Más Bosque Manu. Se reemplazan al importar los registros del socio.</Banner>;
}
