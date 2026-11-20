import { useRouter } from 'expo-router';
import React from 'react';
import { useApp } from '../data/app_context';
import { role_label } from '../lib/labels';
import type { Role } from '../lib/types';
import { Button, EmptyState, Page } from '../ui';

// Client-side guard for UX only. The server enforces the same rule with RLS / RPC (C02).
export function RequireRole({ roles, children }: { roles: Role[]; children: React.ReactNode }) {
  const { user } = useApp();
  const router = useRouter();
  if (user && roles.includes(user.role)) return <>{children}</>;
  return (
    <Page title="Acceso restringido">
      <EmptyState
        icon="shield-checkmark-outline"
        title="Esta sección es para otro rol"
        body={`Tu cuenta es de ${user ? role_label[user.role].toLowerCase() : 'otro rol'}. Si necesitas este permiso, pídelo a un administrador. Tu sesión sigue activa.`}
        action={<Button label="Ir al inicio" onPress={() => router.replace('/home')} />}
      />
    </Page>
  );
}
