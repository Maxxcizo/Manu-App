import { useRouter } from 'expo-router';
import React from 'react';
import { Button, Card, H, Muted, Row, Screen, Tag } from '../../src/components/ui';
import { useApp } from '../../src/data/app_context';

export default function Perfil() {
  const { user, sign_out, repo } = useApp();
  const router = useRouter();
  return (
    <Screen title="Mi perfil" subtitle="Cuenta y sesión">
      <Card>
        <H>{user?.full_name ?? ''}</H>
        <Muted>{user?.email ?? ''}</Muted>
        <Row>
          <Tag label={user?.role ?? ''} tone="success" />
          {user?.brigade ? <Tag label={`Brigada ${user.brigade}`} /> : null}
        </Row>
      </Card>
      <Muted>{`Modo: ${repo.mode === 'demo' ? 'demostración (datos locales)' : 'conectado al servidor'}`}</Muted>
      <Button
        label="Cerrar sesión"
        variant="secondary"
        onPress={async () => {
          await sign_out();
          router.replace('/login');
        }}
      />
    </Screen>
  );
}
