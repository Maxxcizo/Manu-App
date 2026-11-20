import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { Incident, IncidentFilters, Profile } from '../lib/types';
import { ForbiddenError, type Repository } from './repository';

// Session storage: encrypted keystore on Android/iOS, browser storage on web (C07).
// Large values are chunked because SecureStore limits value size.
const storage = {
  async getItem(key: string) {
    return Platform.OS === 'web' ? globalThis.localStorage?.getItem(key) ?? null : SecureStore.getItemAsync(key);
  },
  async setItem(key: string, value: string) {
    if (Platform.OS === 'web') globalThis.localStorage?.setItem(key, value);
    else await SecureStore.setItemAsync(key, value);
  },
  async removeItem(key: string) {
    if (Platform.OS === 'web') globalThis.localStorage?.removeItem(key);
    else await SecureStore.deleteItemAsync(key);
  },
};

type Row = {
  id: string;
  type_code: Incident['type'];
  severity: Incident['severity'];
  occurred_on: string;
  latitude: number;
  longitude: number;
  location_precision: Incident['location_precision'];
  trail: string | null;
  status: Incident['status'];
  source: Incident['source'];
};

const to_incident = (r: Row): Incident => ({
  id: r.id,
  type: r.type_code,
  severity: r.severity,
  occurred_on: r.occurred_on,
  latitude: r.latitude,
  longitude: r.longitude,
  location_precision: r.location_precision,
  trail: r.trail,
  status: r.status,
  source: r.source,
  created_by: null,
});

export function create_supabase_repository(url: string, anon_key: string): Repository {
  // Only the public anon key lives in the client. service_role must never be used here (C03).
  const client = createClient(url, anon_key, {
    auth: { storage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
  });

  const check = (error: { code?: string; message: string } | null) => {
    if (!error) return;
    if (error.code === '42501') throw new ForbiddenError();
    throw new Error(error.message);
  };

  async function load_profile(): Promise<Profile | null> {
    const { data: auth } = await client.auth.getUser();
    if (!auth.user) return null;
    const { data, error } = await client.from('profiles').select('*').eq('id', auth.user.id).single();
    check(error);
    if (!data?.is_active) return null;
    return { id: data.id, full_name: data.full_name, email: auth.user.email ?? '', role: data.role, brigade: data.brigade, is_active: data.is_active };
  }

  return {
    mode: 'supabase',
    async sign_in(email, password) {
      const { error } = await client.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw new Error('Correo o contraseña incorrectos.');
      const profile = await load_profile();
      if (!profile) throw new Error('La cuenta está desactivada.');
      return profile;
    },
    async sign_out() {
      await client.auth.signOut();
    },
    restore_session: load_profile,
    async list_incidents(filters: IncidentFilters = {}) {
      const { data, error } = await client.rpc('get_incidents', {
        p_from: filters.from || null,
        p_to: filters.to || null,
        p_type: filters.type || null,
        p_severity: filters.severity || null,
        p_trail: filters.trail || null,
      });
      check(error);
      return (data as Row[]).map(to_incident);
    },
    async get_incident(id) {
      const all = await this.list_incidents();
      return all.find((i) => i.id === id) ?? null;
    },
    async create_incident(input) {
      const { data, error } = await client.rpc('create_incident', {
        p_type: input.type,
        p_severity: input.severity,
        p_occurred_on: input.occurred_on,
        p_lat: Number(input.latitude),
        p_lon: Number(input.longitude),
        p_trail: input.trail ?? null,
      });
      check(error);
      return {
        id: data as string,
        type: input.type as Incident['type'],
        severity: input.severity as Incident['severity'],
        occurred_on: input.occurred_on,
        latitude: Number(input.latitude),
        longitude: Number(input.longitude),
        location_precision: 'exacta',
        trail: input.trail ?? null,
        status: 'pendiente',
        source: 'app',
        created_by: null,
      };
    },
    async set_incident_status(id, status) {
      check((await client.rpc('set_incident_status', { p_id: id, p_status: status })).error);
    },
    async list_users() {
      const { data, error } = await client.from('profiles').select('*');
      check(error);
      return (data ?? []).map((d) => ({ ...d, email: '' })) as Profile[];
    },
    async set_user_role(id, role, is_active) {
      check((await client.rpc('set_user_role', { p_user: id, p_role: role, p_active: is_active })).error);
    },
  };
}
