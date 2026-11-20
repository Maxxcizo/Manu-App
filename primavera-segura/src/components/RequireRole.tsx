import { useRouter } from 'expo-router';
import React from 'react';
import { useApp } from '../data/app_context';
import type { Role } from '../lib/types';
import { Button, Card, Muted, Notice, Screen, Tag } from './ui';

// Client-side guard for UX only. The server enforces the same rule with RLS / RPC (C02).
export function RequireRole({ roles, children }: { roles: Role[]; children: React.ReactNode }) {
  const { user } = useApp();
  const router = useRouter();
  if (user && roles.includes(user.role)) return <>{children}</>;
  return (
    <Screen title="Acceso restringido" subtitle="Protección de la cuenta y del sistema">
      <Card>
        <Tag label="Permiso no disponible" />
        <Muted>Esta función requiere otro rol. Tu sesión sigue activa y tus reportes están seguros.</Muted>
        <Notice>Si necesitas otro permiso, solicita una revisión de tu rol a un administrador.</Notice>
        <Button label="Volver al inicio" onPress={() => router.replace('/home')} />
      </Card>
    </Screen>
  );
}
