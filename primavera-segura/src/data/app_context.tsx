import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Incident, Profile } from '../lib/types';
import { create_demo_repository, type Repository } from './repository';
import { create_supabase_repository } from './supabase_repository';

const URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const repository: Repository = URL && KEY ? create_supabase_repository(URL, KEY) : create_demo_repository();

interface AppState {
  repo: Repository;
  ready: boolean;
  user: Profile | null;
  incidents: Incident[];
  loading: boolean; // first load of incidents after sign-in
  error: string | null;
  sign_in(email: string, password: string): Promise<void>;
  sign_out(): Promise<void>;
  refresh(): Promise<void>;
}

const Context = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, set_ready] = useState(false);
  const [user, set_user] = useState<Profile | null>(null);
  const [incidents, set_incidents] = useState<Incident[]>([]);
  const [error, set_error] = useState<string | null>(null);
  const [loaded, set_loaded] = useState(false);

  const refresh = useCallback(async () => {
    try {
      set_incidents(await repository.list_incidents());
      set_error(null);
    } catch {
      set_error('No se pudieron cargar los incidentes. Revisa tu conexión e inténtalo de nuevo.');
    } finally {
      set_loaded(true);
    }
  }, []);

  useEffect(() => {
    repository
      .restore_session()
      .then(async (profile) => {
        set_user(profile);
        if (profile) await refresh();
      })
      .catch(() => set_user(null))
      .finally(() => set_ready(true));
  }, [refresh]);

  const value = useMemo<AppState>(
    () => ({
      repo: repository,
      ready,
      user,
      incidents,
      loading: !!user && !loaded,
      error,
      refresh,
      async sign_in(email, password) {
        set_user(await repository.sign_in(email, password));
        await refresh();
      },
      async sign_out() {
        await repository.sign_out();
        set_user(null);
        set_incidents([]); // nothing persists after logout (C07)
        set_loaded(false);
      },
    }),
    [ready, user, incidents, loaded, error, refresh],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(Context);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
