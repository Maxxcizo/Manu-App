import type { Incident, IncidentFilters, NewIncident, Profile, Role, IncidentStatus } from '../lib/types';
import { validate_incident } from '../lib/validation';
import { filter_incidents } from '../lib/zones';
import { build_seed } from './seed';

export class ForbiddenError extends Error {
  constructor() {
    super('forbidden');
  }
}

export interface Repository {
  mode: 'demo' | 'supabase';
  sign_in(email: string, password: string): Promise<Profile>;
  sign_out(): Promise<void>;
  restore_session(): Promise<Profile | null>;
  list_incidents(filters?: IncidentFilters): Promise<Incident[]>;
  get_incident(id: string): Promise<Incident | null>;
  create_incident(input: NewIncident): Promise<Incident>;
  set_incident_status(id: string, status: IncidentStatus): Promise<void>;
  list_users(): Promise<Profile[]>;
  set_user_role(id: string, role: Role, is_active: boolean): Promise<void>;
}

// ---------- Demo repository (no backend configured) ----------
// Demo accounts only exist while EXPO_PUBLIC_SUPABASE_URL is empty; the UI labels this mode.
const DEMO_USERS: (Profile & { password: string })[] = [
  { id: 'u1', full_name: 'Ana Torres', email: 'rescatista@demo.mx', role: 'rescatista', brigade: 'Bravo', is_active: true, password: 'demo' },
  { id: 'u2', full_name: 'Luis Ramírez', email: 'coordinador@demo.mx', role: 'coordinador', brigade: null, is_active: true, password: 'demo' },
  { id: 'u3', full_name: 'Marta Solís', email: 'admin@demo.mx', role: 'administrador', brigade: null, is_active: true, password: 'demo' },
];

export function create_demo_repository(): Repository {
  let incidents = build_seed();
  const users = DEMO_USERS.map((u) => ({ ...u }));
  let current: Profile | null = null;

  const strip = ({ password: _p, ...profile }: Profile & { password: string }): Profile => profile;
  const require_role = (...roles: Role[]) => {
    if (!current || !roles.includes(current.role)) throw new ForbiddenError();
  };

  return {
    mode: 'demo',
    async sign_in(email, password) {
      const user = users.find((u) => u.email === email.trim().toLowerCase() && u.password === password);
      if (!user || !user.is_active) throw new Error('Correo o contraseña incorrectos.');
      current = strip(user);
      return current;
    },
    async sign_out() {
      current = null;
    },
    async restore_session() {
      return current;
    },
    async list_incidents(filters = {}) {
      require_role('rescatista', 'coordinador', 'administrador');
      return filter_incidents(incidents, filters);
    },
    async get_incident(id) {
      require_role('rescatista', 'coordinador', 'administrador');
      return incidents.find((i) => i.id === id) ?? null;
    },
    async create_incident(input) {
      require_role('rescatista', 'coordinador', 'administrador');
      const result = validate_incident(input); // the real backend re-validates in create_incident()
      if (!result.valid) throw new Error(Object.values(result.errors)[0]);
      const incident: Incident = {
        id: `app-${Date.now()}`,
        type: input.type as Incident['type'],
        severity: input.severity as Incident['severity'],
        occurred_on: input.occurred_on,
        latitude: Number(input.latitude),
        longitude: Number(input.longitude),
        location_precision: 'exacta',
        trail: input.trail ?? null,
        status: 'pendiente',
        source: 'app',
        created_by: current!.id,
      };
      incidents = [incident, ...incidents];
      return incident;
    },
    async set_incident_status(id, status) {
      require_role('coordinador', 'administrador');
      incidents = incidents.map((i) => (i.id === id ? { ...i, status } : i));
    },
    async list_users() {
      require_role('administrador');
      return users.map(strip);
    },
    async set_user_role(id, role, is_active) {
      require_role('administrador');
      const user = users.find((u) => u.id === id);
      if (user) Object.assign(user, { role, is_active });
    },
  };
}
