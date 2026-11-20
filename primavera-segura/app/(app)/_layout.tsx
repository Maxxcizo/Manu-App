import { Ionicons } from '@expo/vector-icons';
import type React from 'react';
import { Redirect, Tabs } from 'expo-router';
import { useApp } from '../../src/data/app_context';
import { colors } from '../../src/theme';
import type { Role } from '../../src/lib/types';

const STAFF: Role[] = ['coordinador', 'administrador'];

function tab_icon(name: React.ComponentProps<typeof Ionicons>['name']) {
  return function TabIcon({ color, size }: { color: unknown; size: number }) {
    return <Ionicons name={name} color={String(color)} size={size} />;
  };
}

export default function AppLayout() {
  const { user, ready } = useApp();
  if (ready && !user) return <Redirect href="/login" />;
  const role = user?.role;
  const staff = !!role && STAFF.includes(role);
  const hidden = { href: null } as const;

  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.primary }}>
      <Tabs.Screen name="home" options={{ title: staff ? 'Resumen' : 'Inicio', tabBarIcon: tab_icon('home-outline') }} />
      <Tabs.Screen name="mapa" options={{ title: 'Mapa', tabBarIcon: tab_icon('map-outline') }} />
      <Tabs.Screen name="incidentes" options={{ title: 'Incidentes', tabBarIcon: tab_icon('warning-outline') }} />
      <Tabs.Screen name="zonas" options={staff ? { title: 'Zonas', tabBarIcon: tab_icon('layers-outline') } : hidden} />
      <Tabs.Screen name="reportes" options={staff ? { title: 'Informes', tabBarIcon: tab_icon('document-text-outline') } : hidden} />
      <Tabs.Screen name="admin" options={role === 'administrador' ? { title: 'Usuarios', tabBarIcon: tab_icon('people-outline') } : hidden} />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil', tabBarIcon: tab_icon('person-outline') }} />
    </Tabs>
  );
}
