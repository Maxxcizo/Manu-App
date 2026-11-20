import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Button, Card, Field, Muted, Notice, Screen } from '../src/components/ui';
import { useApp } from '../src/data/app_context';

export default function Login() {
  const { sign_in, repo } = useApp();
  const router = useRouter();
  const [email, set_email] = useState('');
  const [password, set_password] = useState('');
  const [error, set_error] = useState<string | null>(null);
  const [loading, set_loading] = useState(false);

  async function submit() {
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

  return (
    <Screen title="Primavera Segura" subtitle="Seguimiento de incidentes en el Bosque La Primavera">
      <Card>
        <Field label="Correo" value={email} onChangeText={set_email} autoCapitalize="none" keyboardType="email-address" testID="email" />
        <Field label="Contraseña" value={password} onChangeText={set_password} secureTextEntry testID="password" />
        {error ? <Notice tone="danger">{error}</Notice> : null}
        <Button label="Iniciar sesión" onPress={submit} loading={loading} disabled={!email || !password} />
      </Card>
      {repo.mode === 'demo' ? (
        <Notice tone="warning">
          Modo demostración (sin servidor configurado). Cuentas de prueba: rescatista@demo.mx, coordinador@demo.mx y admin@demo.mx, contraseña &quot;demo&quot;. Los datos son sintéticos.
        </Notice>
      ) : (
        <Muted>Tu cuenta la crea un administrador. Si no puedes entrar, contacta a coordinación.</Muted>
      )}
    </Screen>
  );
}
