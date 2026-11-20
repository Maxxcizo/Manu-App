export type Role = 'rescatista' | 'coordinador' | 'administrador';
export type Severity = 'baja' | 'media' | 'alta';
export type IncidentStatus = 'pendiente' | 'validado' | 'cerrado';
export type LocationPrecision = 'exacta' | 'sendero' | 'kilometro';

export const SEVERITIES: Severity[] = ['baja', 'media', 'alta'];
export const SEVERITY_WEIGHT: Record<Severity, number> = { baja: 1, media: 2, alta: 3 };

export const INCIDENT_TYPES = [
  { code: 'caida', label: 'Caída' },
  { code: 'fractura', label: 'Fractura' },
  { code: 'desorientacion', label: 'Desorientación' },
  { code: 'deshidratacion', label: 'Deshidratación' },
  { code: 'picadura', label: 'Picadura o mordedura' },
  { code: 'humo', label: 'Avistamiento de humo' },
  { code: 'otro', label: 'Otro' },
] as const;

export type IncidentTypeCode = (typeof INCIDENT_TYPES)[number]['code'];

export interface Incident {
  id: string;
  type: IncidentTypeCode;
  severity: Severity;
  occurred_on: string; // YYYY-MM-DD
  latitude: number;
  longitude: number;
  location_precision: LocationPrecision;
  trail: string | null;
  status: IncidentStatus;
  source: 'app' | 'historico' | 'sintetico';
  created_by: string | null;
}

export interface NewIncident {
  type: string;
  severity: string;
  occurred_on: string;
  latitude: number | string;
  longitude: number | string;
  trail?: string | null;
}

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: Role;
  brigade: string | null;
  is_active: boolean;
}

export interface IncidentFilters {
  from?: string;
  to?: string;
  type?: IncidentTypeCode | '';
  severity?: Severity | '';
  trail?: string;
}

export interface Zone {
  key: string;
  center: { latitude: number; longitude: number };
  bounds: [[number, number], [number, number]]; // [[south, west], [north, east]]
  count: number;
  score: number;
  critical: boolean;
  low_confidence: boolean;
}

export interface ZoneDelta {
  key: string;
  center: { latitude: number; longitude: number };
  score_a: number;
  score_b: number;
  delta: number;
  trend: 'empeora' | 'mejora' | 'igual';
  low_confidence: boolean;
}
