import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../src/data/app_context';
import { useBreakpoint } from '../src/hooks/use_breakpoint';
import { colors, space } from '../src/theme';
import { Banner, Button, Contours, Text, TextField, Wordmark } from '../src/ui';

const DEMO = [
  { email: 'rescatista@demo.mx', label: 'Rescatista' },
  { email: 'coordinador@demo.mx', label: 'Coordinación' },
  { email: 'admin@demo.mx', label: 'Administración' },
];

export default function Login() {
  const { sign_in, repo } = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { is_desktop, is_phone } = useBreakpoint();
  const [email, set_email] = useState('');
  const [password, set_password] = useState('');
  const [error, set_error] = useState<string | null>(null);
  const [loading, set_loading] = useState(false);

  async function submit() {
    if (!email || !password) {
      set_error('Escribe tu correo y tu contraseña.');
      return;
    }
    set_loading(true);
    set_error(null);
    try {
      await sign_in(email, password);
      router.replace('/home');
    } catch (e) {
      set_error((e as Error).message);
    } finally {
      set_loading(false);
    }
  }

  const form = (
    <View style={styles.form}>
      <View style={styles.form_head}>
        <Text variant={is_phone ? 'heading' : 'title'} heading={1}>
          Inicia sesión
        </Text>
        <Text tone="muted">Usa la cuenta que te dio coordinación.</Text>
      </View>
      <TextField
        label="Correo"
        value={email}
        onChangeText={set_email}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="username"
        returnKeyType="next"
        testID="email"
      />
      <TextField
        label="Contraseña"
        value={password}
        onChangeText={set_password}
        secureTextEntry
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={submit}
        testID="password"
      />
      {error ? <Banner tone="danger">{error}</Banner> : null}
      <Button label="Iniciar sesión" onPress={submit} loading={loading} full_width />
      {repo.mode === 'demo' ? (
        <View style={styles.demo}>
          <Text variant="small_strong">Modo demostración</Text>
          <Text variant="small" tone="muted">
            No hay servidor configurado: los datos son sintéticos. Elige una cuenta de prueba; la contraseña es demo.
          </Text>
          <View style={styles.demo_row}>
            {DEMO.map((d) => (
              <Button
                key={d.email}
                label={d.label}
                variant="secondary"
                compact
                onPress={() => {
                  set_email(d.email);
                  set_password('demo');
                  set_error(null);
                }}
              />
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );

  if (is_desktop) {
    return (
      <View style={styles.split}>
        <View style={styles.brand_panel}>
          <Contours color="#2B5446" />
          <Wordmark inverse size="lg" />
          <View style={styles.brand_copy}>
            <Text variant="display" style={{ color: colors.pino_text }}>
              Dónde ocurren los incidentes en La Primavera, y cómo cambian con el tiempo.
            </Text>
            <Text style={{ color: colors.pino_muted, maxWidth: 520 }}>
              Registro de incidentes, zonas críticas y comparación de periodos para coordinar el apoyo de Más Bosque Manu.
            </Text>
          </View>
          <Text variant="caption" style={{ color: colors.pino_muted }}>
            Bosque La Primavera, Jalisco. Herramienta de planeación; no sustituye a los servicios de emergencia.
          </Text>
        </View>
        <ScrollView contentContainerStyle={styles.form_side} keyboardShouldPersistTaps="handled">
          {form}
        </ScrollView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.fill_grow} keyboardShouldPersistTaps="handled">
        <View style={[styles.mobile_brand, { paddingTop: insets.top + space[6] }]}>
          <Contours color="#2B5446" />
          <Wordmark inverse />
          <Text style={{ color: colors.pino_muted }}>Incidentes y zonas críticas del Bosque La Primavera.</Text>
        </View>
        <View style={[styles.mobile_form, { paddingBottom: insets.bottom + space[8] }]}>{form}</View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.canvas },
  fill_grow: { flexGrow: 1 },
  split: { flex: 1, flexDirection: 'row', backgroundColor: colors.canvas },
  brand_panel: { flex: 1.1, backgroundColor: colors.pino, padding: space[12], justifyContent: 'space-between', overflow: 'hidden' },
  brand_copy: { gap: space[5], maxWidth: 640 },
  form_side: { flexGrow: 1, justifyContent: 'center', padding: space[12] },
  form: { width: '100%', maxWidth: 420, alignSelf: 'center', gap: space[5] },
  form_head: { gap: space[2] },
  demo: { gap: space[2], paddingTop: space[5], borderTopWidth: 1, borderTopColor: colors.line },
  demo_row: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2], marginTop: space[1] },
  mobile_brand: { backgroundColor: colors.pino, paddingHorizontal: space[5], paddingBottom: space[8], gap: space[3], overflow: 'hidden' },
  mobile_form: { paddingHorizontal: space[5], paddingTop: space[6], flex: 1 },
});
