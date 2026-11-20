import { INCIDENT_TYPES, type IncidentStatus, type Role, type Severity } from './types';

export const type_label = (code: string) => INCIDENT_TYPES.find((t) => t.code === code)?.label ?? 'Otro';

export const severity_label: Record<Severity, string> = { baja: 'Baja', media: 'Media', alta: 'Alta' };

export const status_label: Record<IncidentStatus, string> = {
  pendiente: 'Pendiente de validar',
  validado: 'Validado',
  cerrado: 'Cerrado',
};

export const role_label: Record<Role, string> = {
  rescatista: 'Rescatista',
  coordinador: 'Coordinación',
  administrador: 'Administración',
};

export const precision_label = { exacta: 'Coordenadas exactas', sendero: 'Por sendero', kilometro: 'Por kilómetro' } as const;

export const source_label = { app: 'Registrado en la app', historico: 'Registro histórico', sintetico: 'Dato sintético de demostración' } as const;

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

// '2026-11-08' -> '8 nov 2026' (dates are calendar dates, no timezone shift).
export function format_date(iso: string, with_year = true): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return with_year ? `${d} ${MONTHS[m - 1]} ${y}` : `${d} ${MONTHS[m - 1]}`;
}

export function format_coords(lat: number, lon: number): string {
  return `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
}
