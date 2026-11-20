import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Avatar } from '../../src/components/AppShell';
import { RequireRole } from '../../src/components/RequireRole';
import { useApp } from '../../src/data/app_context';
import { useBreakpoint } from '../../src/hooks/use_breakpoint';
import { role_label } from '../../src/lib/labels';
import type { Profile, Role } from '../../src/lib/types';
import { colors, space } from '../../src/theme';
import { Badge, Banner, Button, ConfirmDialog, DataTable, LoadingList, Page, Panel, Select, Sheet, Text, useToast, type Column } from '../../src/ui';

const ROLE_OPTIONS = (['rescatista', 'coordinador', 'administrador'] as Role[]).map((r) => ({ value: r, label: role_label[r] }));

export default function Admin() {
  return (
    <RequireRole roles={['administrador']}>
      <AdminScreen />
    </RequireRole>
  );
}

function AdminScreen() {
  const { repo, user } = useApp();
  const toast = useToast();
  const { is_phone } = useBreakpoint();
  const [users, set_users] = useState<Profile[] | null>(null);
  const [error, set_error] = useState<string | null>(null);
  const [editing, set_editing] = useState<Profile | null>(null);
  const [confirm, set_confirm] = useState<Profile | null>(null);

  const load = useCallback(
    () =>
      repo
        .list_users()
        .then((list) => {
          set_users(list);
          set_error(null);
        })
        .catch(() => set_error('No se pudo cargar la lista de usuarios.')),
    [repo],
  );
  useEffect(() => {
    void load();
  }, [load]);

  async function update(u: Profile, role: Role, active: boolean, message: string) {
    try {
      await repo.set_user_role(u.id, role, active);
      await load();
      toast.show(message);
    } catch {
      toast.show('No tienes permiso o el cambio falló.', 'danger');
    }
  }

  const is_self = (u: Profile) => u.id === user?.id;
  const columns: Column<Profile>[] = [
    {
      key: 'name',
      title: 'Persona',
      flex: 2,
      render: (u) => (
        <View style={styles.person}>
          <Avatar name={u.full_name} size={32} />
          <View style={{ flex: 1 }}>
            <Text variant="small_strong">{`${u.full_name}${is_self(u) ? ' (tú)' : ''}`}</Text>
            <Text variant="small" tone="muted" numberOfLines={1}>
              {u.email || 'Correo no disponible'}
            </Text>
          </View>
        </View>
      ),
    },
    {
      key: 'role',
      title: 'Rol',
      width: 220,
      render: (u) =>
        is_self(u) ? (
          <Text variant="small">{role_label[u.role]}</Text>
        ) : (
          <Select label={`Rol de ${u.full_name}`} hide_label value={u.role} options={ROLE_OPTIONS} onChange={(r) => update(u, r, u.is_active, `Rol actualizado a ${role_label[r].toLowerCase()}`)} />
        ),
    },
    { key: 'state', title: 'Estado', width: 120, render: (u) => <Badge label={u.is_active ? 'Activa' : 'Desactivada'} tone={u.is_active ? 'brand' : 'neutral'} /> },
    {
      key: 'actions',
      title: 'Acciones',
      width: 160,
      render: (u) =>
        is_self(u) ? null : u.is_active ? (
          <Button label="Desactivar" variant="tertiary" compact onPress={() => set_confirm(u)} />
        ) : (
          <Button label="Activar" variant="tertiary" compact onPress={() => update(u, u.role, true, 'Cuenta activada')} />
        ),
    },
  ];

  return (
    <Page title="Usuarios y roles" description="Cada persona entra con su propia cuenta. El rol define qué puede ver y modificar; el servidor lo verifica en cada operación.">
      {error ? <Banner tone="danger" action={<Button label="Reintentar" variant="secondary" compact onPress={load} />}>{error}</Banner> : null}
      <Panel padded={false} title={users ? `${users.length} cuentas` : 'Cuentas'}>
        {!users ? (
          <View style={{ padding: space[4] }}>
            <LoadingList rows={3} />
          </View>
        ) : is_phone ? (
          users.map((u) => (
            <View key={u.id} style={styles.phone_row}>
              <Avatar name={u.full_name} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="body_strong">{`${u.full_name}${is_self(u) ? ' (tú)' : ''}`}</Text>
                <Text variant="small" tone="muted">
                  {role_label[u.role]}
                </Text>
                <Badge label={u.is_active ? 'Activa' : 'Desactivada'} tone={u.is_active ? 'brand' : 'neutral'} />
              </View>
              {is_self(u) ? null : <Button label="Editar" variant="secondary" compact onPress={() => set_editing(u)} />}
            </View>
          ))
        ) : (
          <DataTable caption="Usuarios" columns={columns} rows={users} row_key={(u) => u.id} />
        )}
      </Panel>
      <Sheet visible={!!editing} title={editing ? `Editar a ${editing.full_name}` : 'Editar'} onClose={() => set_editing(null)}>
        {editing ? (
          <View style={{ gap: space[5] }}>
            <Select
              label="Rol"
              value={editing.role}
              options={ROLE_OPTIONS}
              onChange={(r) => {
                void update(editing, r, editing.is_active, `Rol actualizado a ${role_label[r].toLowerCase()}`);
                set_editing({ ...editing, role: r });
              }}
            />
            {editing.is_active ? (
              <Button label="Desactivar cuenta" variant="secondary" icon="person-remove-outline" onPress={() => { set_confirm(editing); set_editing(null); }} />
            ) : (
              <Button label="Activar cuenta" icon="person-add-outline" onPress={() => { void update(editing, editing.role, true, 'Cuenta activada'); set_editing(null); }} />
            )}
          </View>
        ) : null}
      </Sheet>
      <ConfirmDialog
        visible={!!confirm}
        title="Desactivar cuenta"
        message={confirm ? `${confirm.full_name} ya no podrá iniciar sesión. Sus incidentes registrados se conservan y puedes volver a activar la cuenta después.` : ''}
        confirm_label="Desactivar cuenta"
        tone="danger"
        onCancel={() => set_confirm(null)}
        onConfirm={() => {
          if (confirm) void update(confirm, confirm.role, false, 'Cuenta desactivada');
          set_confirm(null);
        }}
      />
    </Page>
  );
}

const styles = StyleSheet.create({
  person: { flexDirection: 'row', alignItems: 'center', gap: space[3] },
  phone_row: { flexDirection: 'row', alignItems: 'center', gap: space[3], padding: space[4], borderBottomWidth: 1, borderBottomColor: colors.line },
});
