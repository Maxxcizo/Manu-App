import { INCIDENT_TYPES, type Severity, type IncidentStatus } from '../lib/types';

export const type_label = (code: string) => INCIDENT_TYPES.find((t) => t.code === code)?.label ?? 'Otro';
export const severity_tone = (s: Severity) => (s === 'alta' ? 'danger' : s === 'media' ? 'warning' : 'success');
export const status_label: Record<IncidentStatus, string> = { pendiente: 'Pendiente de validación', validado: 'Validado', cerrado: 'Cerrado' };
