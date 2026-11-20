import React, { useCallback, useEffect, useState } from 'react';
import { RequireRole } from '../../src/components/RequireRole';
import { Button, Card, Chip, H, Muted, Notice, Row, Screen, Tag } from '../../src/components/ui';
import { useApp } from '../../src/data/app_context';
import type { Profile, Role } from '../../src/lib/types';

const ROLES: Role[] = ['rescatista', 'coordinador', 'administrador'];

export default function Admin() {
  const { repo, user } = useApp();
  const [users, set_users] = useState<Profile[]>([]);
  const [message, set_message] = useState<string | null>(null);

  const load = useCallback(
    () =>
      repo
        .list_users()
        .then(set_users)
        .catch(() => set_message('No se pudo cargar la lista de usuarios.')),
    [repo],
  );
  const is_admin = user?.role === 'administrador';
  useEffect(() => {
    if (is_admin) void load();
  }, [load, is_admin]);

  async function update(u: Profile, role: Role, active: boolean) {
    try {
      await repo.set_user_role(u.id, role, active);
      await load();
      set_message('Cambio guardado.');
    } catch {
      set_message('No tienes permiso o el cambio falló.');
    }
  }

  return (
    <RequireRole roles={['administrador']}>
      <Screen title="Usuarios y roles" subtitle="Solo administradores">
        {message ? <Notice>{message}</Notice> : null}
        {users.map((u) => (
          <Card key={u.id}>
            <Row style={{ justifyContent: 'space-between' }}>
              <H>{u.full_name}</H>
              <Tag label={u.is_active ? 'Activo' : 'Desactivado'} tone={u.is_active ? 'success' : 'danger'} />
            </Row>
            <Muted>{u.email}</Muted>
            <Row>
              {ROLES.map((r) => (
                <Chip key={r} label={r} active={u.role === r} onPress={() => update(u, r, u.is_active)} />
              ))}
            </Row>
            {u.id !== user?.id ? <Button label={u.is_active ? 'Desactivar cuenta' : 'Activar cuenta'} variant="secondary" onPress={() => update(u, u.role, !u.is_active)} /> : null}
          </Card>
        ))}
      </Screen>
    </RequireRole>
  );
}
