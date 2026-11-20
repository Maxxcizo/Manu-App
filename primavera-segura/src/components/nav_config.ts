import type { Ionicons } from '@expo/vector-icons';
import type React from 'react';
import type { Role } from '../lib/types';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  icon_active: IconName;
  group: 'operacion' | 'analisis' | 'administracion' | 'cuenta';
  roles: Role[];
}

const ALL: Role[] = ['rescatista', 'coordinador', 'administrador'];
const STAFF: Role[] = ['coordinador', 'administrador'];

export const NAV_ITEMS: NavItem[] = [
  { href: '/home', label: 'Inicio', icon: 'home-outline', icon_active: 'home', group: 'operacion', roles: ALL },
  { href: '/mapa', label: 'Mapa', icon: 'map-outline', icon_active: 'map', group: 'operacion', roles: ALL },
  { href: '/incidentes', label: 'Incidentes', icon: 'list-outline', icon_active: 'list', group: 'operacion', roles: ALL },
  { href: '/zonas', label: 'Zonas críticas', icon: 'layers-outline', icon_active: 'layers', group: 'analisis', roles: STAFF },
  { href: '/comparacion', label: 'Comparación', icon: 'git-compare-outline', icon_active: 'git-compare', group: 'analisis', roles: STAFF },
  { href: '/reportes', label: 'Informes', icon: 'document-text-outline', icon_active: 'document-text', group: 'analisis', roles: STAFF },
  { href: '/admin', label: 'Usuarios', icon: 'people-outline', icon_active: 'people', group: 'administracion', roles: ['administrador'] },
  { href: '/perfil', label: 'Cuenta', icon: 'person-circle-outline', icon_active: 'person-circle', group: 'cuenta', roles: ALL },
];

export const GROUP_LABEL: Record<NavItem['group'], string> = {
  operacion: 'Operación',
  analisis: 'Análisis',
  administracion: 'Administración',
  cuenta: 'Cuenta',
};

export function items_for(role: Role): NavItem[] {
  return NAV_ITEMS.filter((i) => i.roles.includes(role));
}

// Phones get at most 5 destinations. Field responders get the report action in the middle;
// staff get "Más" (the account hub) which lists the remaining modules.
export interface PhoneTab {
  href: string;
  label: string;
  icon: IconName;
  icon_active: IconName;
  primary?: boolean;
  matches: string[];
}

export function phone_tabs(role: Role): PhoneTab[] {
  const tab = (href: string, label: string, icon: IconName, icon_active: IconName, matches: string[] = [href], primary = false): PhoneTab => ({ href, label, icon, icon_active, matches, primary });
  if (role === 'rescatista') {
    return [
      tab('/home', 'Inicio', 'home-outline', 'home'),
      tab('/mapa', 'Mapa', 'map-outline', 'map'),
      tab('/registrar', 'Reportar', 'add', 'add', ['/registrar'], true),
      tab('/incidentes', 'Incidentes', 'list-outline', 'list', ['/incidentes', '/incidente']),
      tab('/perfil', 'Cuenta', 'person-circle-outline', 'person-circle'),
    ];
  }
  return [
    tab('/home', 'Resumen', 'home-outline', 'home'),
    tab('/mapa', 'Mapa', 'map-outline', 'map'),
    tab('/incidentes', 'Incidentes', 'list-outline', 'list', ['/incidentes', '/incidente']),
    tab('/zonas', 'Zonas', 'layers-outline', 'layers', ['/zonas', '/comparacion']),
    tab('/perfil', 'Más', 'ellipsis-horizontal-circle-outline', 'ellipsis-horizontal-circle', ['/perfil', '/reportes', '/admin']),
  ];
}

// Routes that are a step inside a flow: phones hide the bottom bar and show a back button.
export const FLOW_ROUTES = ['/registrar', '/incidente'];

export function is_active(pathname: string, matches: string[]): boolean {
  return matches.some((m) => pathname === m || pathname.startsWith(`${m}/`));
}

// Top-level navigation keeps the stack bounded: Home is the start destination, any other section
// sits on top of it, and switching sections pops back to (or replaces) instead of piling screens up.
// Android back from a section therefore returns to Home, then exits.
export interface SectionRouter {
  push: (href: never) => void;
  dismissTo: (href: never) => void;
}

export function go_to_section(router: SectionRouter, pathname: string, href: string): void {
  if (href === pathname) return;
  if (href === '/home') return router.dismissTo(href as never);
  if (pathname === '/home') return router.push(href as never);
  router.dismissTo(href as never);
}
