import { INCIDENT_TYPES, SEVERITIES, type NewIncident } from './types';

// Assumed rectangle around La Primavera. It MUST be replaced with the official
// polygon provided by Más Bosque Manu (see supabase/migrations/0002_forest_boundary.sql).
export const FOREST_BOUNDS = {
  lat_min: 20.6,
  lat_max: 20.78,
  lon_min: -103.67,
  lon_max: -103.45,
} as const;

export interface ValidationResult {
  valid: boolean;
  errors: Partial<Record<'type' | 'severity' | 'date' | 'location', string>>;
}

export function is_inside_forest(latitude: number, longitude: number): boolean {
  return (
    latitude >= FOREST_BOUNDS.lat_min &&
    latitude <= FOREST_BOUNDS.lat_max &&
    longitude >= FOREST_BOUNDS.lon_min &&
    longitude <= FOREST_BOUNDS.lon_max
  );
}

function is_blank(value: unknown): boolean {
  return value === null || value === undefined || String(value).trim() === '';
}

function today_iso(today: Date): string {
  return today.toISOString().slice(0, 10);
}

function is_real_date(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

// Same rules are enforced again in the database function create_incident (never trust the client).
export function validate_incident(input: NewIncident, today: Date = new Date()): ValidationResult {
  const errors: ValidationResult['errors'] = {};

  if (is_blank(input.type)) errors.type = 'El tipo de incidente es obligatorio.';
  else if (!INCIDENT_TYPES.some((t) => t.code === input.type))
    errors.type = 'El tipo de incidente no es válido.';

  if (is_blank(input.severity)) errors.severity = 'La gravedad es obligatoria.';
  else if (!(SEVERITIES as string[]).includes(String(input.severity)))
    errors.severity = 'La gravedad no es válida.';

  if (is_blank(input.occurred_on)) errors.date = 'La fecha es obligatoria.';
  else if (!is_real_date(String(input.occurred_on))) errors.date = 'La fecha debe tener formato AAAA-MM-DD.';
  else if (String(input.occurred_on) > today_iso(today)) errors.date = 'La fecha no puede ser futura.';

  if (is_blank(input.latitude) || is_blank(input.longitude)) {
    errors.location = 'La ubicación es obligatoria.';
  } else {
    const lat = Number(input.latitude);
    const lon = Number(input.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      errors.location = 'Las coordenadas deben ser números.';
    } else if (!is_inside_forest(lat, lon)) {
      errors.location = 'La ubicación debe estar dentro de La Primavera.';
    }
  }

  return { valid: Object.keys(errors).length === 0, errors };
}
