import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../data/app_context';
import { useBreakpoint } from '../hooks/use_breakpoint';
import { role_label } from '../lib/labels';
import type { Role } from '../lib/types';
import { colors, radius, space } from '../theme';
import { Contours, IconButton, LogoMark, Text, Wordmark } from '../ui';
import { focus_ring, web_pointer, type PressState } from '../ui/interaction';
import { FLOW_ROUTES, go_to_section, GROUP_LABEL, is_active, items_for, phone_tabs, type NavItem } from './nav_config';

// One identity, three navigation forms: sidebar (desktop), rail (tablet), bottom bar (phone).
export function AppShell({ role, children }: { role: Role; children: React.ReactNode }) {
  const { is_phone, is_tablet } = useBreakpoint();
  const pathname = usePathname();
  if (is_phone) {
    const in_flow = FLOW_ROUTES.some((r) => is_active(pathname, [r]));
    return (
      <View style={styles.fill}>
        <View style={styles.fill}>{children}</View>
        {in_flow ? null : <BottomBar role={role} pathname={pathname} />}
      </View>
    );
  }
  return (
    <View style={[styles.fill, styles.row]}>
      {is_tablet ? <Rail role={role} pathname={pathname} /> : <Sidebar role={role} pathname={pathname} />}
      <View style={styles.fill}>{children}</View>
    </View>
  );
}

function Sidebar({ role, pathname }: { role: Role; pathname: string }) {
  const router = useRouter();
  const { user, sign_out, repo } = useApp();
  const items = items_for(role).filter((i) => i.group !== 'cuenta');
  const groups = (['operacion', 'analisis', 'administracion'] as const).map((g) => ({ g, items: items.filter((i) => i.group === g) })).filter((x) => x.items.length);
  return (
    <View style={styles.sidebar} role="navigation" aria-label="Navegación principal">
      <View style={styles.brand}>
        <Contours color="#2B5446" opacity={0.7} />
        <Wordmark inverse />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Registrar incidente"
          onPress={() => router.push('/registrar')}
          style={(state) => {
            const s = state as PressState;
            return [styles.report, (s.hovered || s.pressed) && { backgroundColor: colors.surface }, web_pointer, focus_ring(s, 2, true)] as ViewStyle[];
          }}
        >
          <Ionicons name="add" size={20} color={colors.pino} aria-hidden />
          <Text variant="small_strong" style={{ color: colors.pino }}>
            Registrar incidente
          </Text>
        </Pressable>
      </View>
      <View style={styles.groups}>
        {groups.map(({ g, items: group_items }) => (
          <View key={g} style={styles.group}>
            <Text variant="caption" style={styles.group_label}>
              {GROUP_LABEL[g]}
            </Text>
            {group_items.map((item) => (
              <SideLink key={item.href} item={item} pathname={pathname} active={is_active(pathname, [item.href, ...(item.href === '/incidentes' ? ['/incidente'] : [])])} />
            ))}
          </View>
        ))}
      </View>
      <View style={styles.account}>
        {repo.mode === 'demo' ? (
          <View style={styles.demo}>
            <Ionicons name="flask-outline" size={14} color={colors.pino_muted} aria-hidden />
            <Text variant="caption" style={{ color: colors.pino_muted }}>
              Modo demostración, datos sintéticos
            </Text>
          </View>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Cuenta de ${user?.full_name ?? ''}`}
          onPress={() => go_to_section(router, pathname, '/perfil')}
          style={(state) => {
            const s = state as PressState;
            return [styles.user, (s.hovered || is_active(pathname, ['/perfil'])) && styles.link_active_bg, web_pointer, focus_ring(s, 2, true)] as ViewStyle[];
          }}
        >
          <Avatar name={user?.full_name ?? ''} />
          <View style={styles.fill}>
            <Text variant="small_strong" style={{ color: colors.pino_text }} numberOfLines={1}>
              {user?.full_name}
            </Text>
            <Text variant="caption" style={{ color: colors.pino_muted }}>
              {role_label[role]}
            </Text>
          </View>
        </Pressable>
        <IconButton
          icon="log-out-outline"
          label="Cerrar sesión"
          tone="inverse"
          onPress={async () => {
            await sign_out();
            router.replace('/login');
          }}
        />
      </View>
    </View>
  );
}

function SideLink({ item, active, pathname }: { item: NavItem; active: boolean; pathname: string }) {
  const router = useRouter();
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={item.label}
      aria-current={active ? 'page' : undefined}
      onPress={() => go_to_section(router, pathname, item.href)}
      style={(state) => {
        const s = state as PressState;
        return [styles.link, (active || s.hovered) && styles.link_active_bg, web_pointer, focus_ring(s, -2, true)] as ViewStyle[];
      }}
    >
      {active ? <View style={styles.link_bar} /> : null}
      <Ionicons name={active ? item.icon_active : item.icon} size={20} color={active ? colors.pino_text : colors.pino_muted} aria-hidden />
      <Text variant={active ? 'small_strong' : 'small'} style={{ color: active ? colors.pino_text : colors.pino_muted }}>
        {item.label}
      </Text>
    </Pressable>
  );
}

function Rail({ role, pathname }: { role: Role; pathname: string }) {
  const router = useRouter();
  const items = items_for(role);
  return (
    <View style={styles.rail} role="navigation" aria-label="Navegación principal">
      <View style={styles.rail_logo}>
        <LogoMark inverse size={36} />
      </View>
      <IconButton icon="add-circle" label="Registrar incidente" tone="inverse" onPress={() => router.push('/registrar')} />
      <View style={styles.rail_items}>
        {items.map((item) => {
          const active = is_active(pathname, [item.href, ...(item.href === '/incidentes' ? ['/incidente'] : [])]);
          return (
            <Pressable
              key={item.href}
              accessibilityRole="link"
              accessibilityLabel={item.label}
              aria-current={active ? 'page' : undefined}
              onPress={() => go_to_section(router, pathname, item.href)}
              style={(state) => {
                const s = state as PressState;
                return [styles.rail_item, (active || s.hovered) && styles.link_active_bg, web_pointer, focus_ring(s, -2, true)] as ViewStyle[];
              }}
            >
              <Ionicons name={active ? item.icon_active : item.icon} size={22} color={active ? colors.pino_text : colors.pino_muted} aria-hidden />
              <Text variant="caption" align="center" numberOfLines={1} style={{ color: active ? colors.pino_text : colors.pino_muted, fontSize: 11 }}>
                {item.label.split(' ')[0]}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function BottomBar({ role, pathname }: { role: Role; pathname: string }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bottom, { paddingBottom: Math.max(insets.bottom, space[2]) }]} role="navigation" aria-label="Navegación principal">
      {phone_tabs(role).map((tab) => {
        const active = is_active(pathname, tab.matches);
        return (
          <Pressable
            key={tab.href}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected: active }}
            onPress={() => (tab.primary ? router.push(tab.href as never) : go_to_section(router, pathname, tab.href))}
            android_ripple={{ color: colors.ripple, borderless: true, radius: 36 }}
            style={styles.tab}
          >
            {tab.primary ? (
              <View style={styles.tab_primary}>
                <Ionicons name="add" size={26} color={colors.ink_inverse} aria-hidden />
              </View>
            ) : (
              <View style={[styles.tab_icon, active && { backgroundColor: colors.bosque_tint }]}>
                <Ionicons name={active ? tab.icon_active : tab.icon} size={22} color={active ? colors.bosque : colors.ink_muted} aria-hidden />
              </View>
            )}
            <Text variant="caption" style={{ color: active || tab.primary ? colors.bosque : colors.ink_muted, fontFamily: active ? 'AtkinsonHyperlegibleNext_700Bold' : undefined }}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('');
  return (
    <View style={[styles.avatar, { width: size, height: size }]} aria-hidden>
      <Text variant="small_strong" style={{ color: colors.pino }}>
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, minWidth: 0 },
  row: { flexDirection: 'row' },
  sidebar: { width: 264, backgroundColor: colors.pino, borderRightWidth: 1, borderRightColor: colors.pino_line },
  brand: { padding: space[5], paddingTop: space[6], gap: space[5], overflow: 'hidden', borderBottomWidth: 1, borderBottomColor: colors.pino_line },
  report: {
    minHeight: 44,
    borderRadius: radius.control,
    backgroundColor: colors.pino_text,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[2],
  },
  groups: { flex: 1, paddingVertical: space[4], gap: space[5] },
  group: { gap: 2 },
  group_label: { color: colors.pino_muted, paddingHorizontal: space[5], marginBottom: space[1] },
  link: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: space[3], paddingHorizontal: space[5] },
  link_active_bg: { backgroundColor: colors.pino_hover },
  link_bar: { position: 'absolute', left: 0, top: 8, bottom: 8, width: 3, borderRadius: 2, backgroundColor: colors.pino_accent },
  account: { borderTopWidth: 1, borderTopColor: colors.pino_line, padding: space[3], gap: space[2], flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  demo: { flexBasis: '100%', flexDirection: 'row', alignItems: 'center', gap: space[1], paddingHorizontal: space[2], paddingBottom: space[1] },
  user: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space[3], padding: space[2], borderRadius: radius.control },
  avatar: { borderRadius: 999, backgroundColor: colors.pino_accent, alignItems: 'center', justifyContent: 'center' },
  rail: { width: 92, backgroundColor: colors.pino, alignItems: 'center', paddingVertical: space[4], gap: space[3] },
  rail_logo: { paddingBottom: space[2] },
  rail_items: { gap: space[1], alignSelf: 'stretch', paddingHorizontal: space[2] },
  rail_item: { minHeight: 56, borderRadius: radius.control, alignItems: 'center', justifyContent: 'center', gap: 2, paddingHorizontal: 2 },
  bottom: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: space[2],
  },
  tab: { flex: 1, alignItems: 'center', gap: 2, minHeight: 56 },
  tab_icon: { width: 56, height: 30, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  tab_primary: { width: 48, height: 30, borderRadius: radius.pill, backgroundColor: colors.bosque, alignItems: 'center', justifyContent: 'center' },
});
