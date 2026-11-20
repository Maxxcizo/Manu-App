import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { Avatar } from '../../src/components/AppShell';
import { items_for } from '../../src/components/nav_config';
import { useApp } from '../../src/data/app_context';
import { useBreakpoint } from '../../src/hooks/use_breakpoint';
import { role_label } from '../../src/lib/labels';
import { colors, space } from '../../src/theme';
import { Badge, Button, ConfirmDialog, KeyValue, Page, Panel, Text } from '../../src/ui';
import { focus_ring, web_pointer, type PressState } from '../../src/ui/interaction';

// Account page. On phones it is also the "Más" hub listing modules that do not fit the bottom bar.
export default function Perfil() {
  const { user, sign_out, repo } = useApp();
  const router = useRouter();
  const { is_phone } = useBreakpoint();
  const [confirm, set_confirm] = useState(false);
  const extra = user ? items_for(user.role).filter((i) => ['/comparacion', '/reportes', '/admin'].includes(i.href)) : [];
  if (!user) return null;

  return (
    <Page title="Cuenta" description="Tu sesión y la información de tu cuenta.">
      <Panel>
        <View style={styles.identity}>
          <Avatar name={user.full_name} size={56} />
          <View style={{ flex: 1, gap: space[1] }}>
            <Text variant="heading">{user.full_name}</Text>
            <Text tone="muted">{user.email}</Text>
            <View style={styles.badges}>
              <Badge label={role_label[user.role]} tone="brand" />
              {user.brigade ? <Badge label={`Brigada ${user.brigade}`} /> : null}
            </View>
          </View>
        </View>
        <View>
          <KeyValue label="Conexión" value={repo.mode === 'demo' ? 'Modo demostración con datos sintéticos locales' : 'Conectado al servidor'} />
          <KeyValue label="Permisos" value={user.role === 'rescatista' ? 'Consultar el mapa e incidentes, registrar incidentes.' : user.role === 'coordinador' ? 'Además: validar y cerrar incidentes, zonas críticas, comparación e informes.' : 'Además: gestionar usuarios y roles.'} />
        </View>
      </Panel>

      {is_phone && extra.length ? (
        <Panel title="Más secciones" padded={false}>
          {extra.map((item) => (
            <Pressable
              key={item.href}
              accessibilityRole="link"
              accessibilityLabel={item.label}
              onPress={() => router.navigate(item.href as never)}
              android_ripple={{ color: colors.ripple }}
              style={(s) => [styles.link, web_pointer, focus_ring(s as PressState, -2)] as ViewStyle[]}
            >
              <Ionicons name={item.icon} size={22} color={colors.bosque} aria-hidden />
              <Text variant="body" style={{ flex: 1 }}>
                {item.label}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.ink_subtle} aria-hidden />
            </Pressable>
          ))}
        </Panel>
      ) : null}

      <View style={styles.signout}>
        <Button label="Cerrar sesión" variant="secondary" icon="log-out-outline" onPress={() => set_confirm(true)} />
      </View>
      <Text variant="small" tone="muted">
        Primavera Segura 1.0. Herramienta de planeación para Más Bosque Manu; no sustituye a los servicios de emergencia.
      </Text>
      <ConfirmDialog
        visible={confirm}
        title="Cerrar sesión"
        message="Tendrás que volver a escribir tu correo y contraseña para entrar."
        confirm_label="Cerrar sesión"
        onCancel={() => set_confirm(false)}
        onConfirm={async () => {
          set_confirm(false);
          await sign_out();
          router.replace('/login');
        }}
      />
    </Page>
  );
}

const styles = StyleSheet.create({
  identity: { flexDirection: 'row', alignItems: 'center', gap: space[4] },
  badges: { flexDirection: 'row', gap: space[2], flexWrap: 'wrap', marginTop: space[1] },
  link: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: space[3], paddingHorizontal: space[5], borderBottomWidth: 1, borderBottomColor: colors.line },
  signout: { alignItems: 'flex-start' },
});
