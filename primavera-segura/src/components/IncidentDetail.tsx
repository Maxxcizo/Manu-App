import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useApp } from '../data/app_context';
import { ForbiddenError } from '../data/repository';
import { format_coords, format_date, precision_label, source_label, type_label } from '../lib/labels';
import type { Incident, IncidentStatus } from '../lib/types';
import { space } from '../theme';
import { Banner, Button, ConfirmDialog, KeyValue, SeverityBadge, StatusBadge, Text, useToast } from '../ui';
import { IncidentMap } from './IncidentMap';

// Shared by the phone detail screen and the desktop master-detail panel.
export function IncidentDetail({ incident, show_map = true, heading = true }: { incident: Incident; show_map?: boolean; heading?: boolean }) {
  const { user, repo, refresh } = useApp();
  const toast = useToast();
  const [busy, set_busy] = useState<IncidentStatus | null>(null);
  const [confirm_close, set_confirm_close] = useState(false);
  const staff = user?.role === 'coordinador' || user?.role === 'administrador';
  const focus = useMemo(() => ({ lat: incident.latitude, lng: incident.longitude }), [incident.latitude, incident.longitude]);
  const list = useMemo(() => [incident], [incident]);

  async function set_status(status: IncidentStatus) {
    set_busy(status);
    try {
      await repo.set_incident_status(incident.id, status);
      await refresh();
      toast.show(status === 'validado' ? 'Incidente validado' : 'Incidente cerrado');
    } catch (e) {
      toast.show(e instanceof ForbiddenError ? 'Tu rol no puede cambiar el estado.' : 'No se pudo actualizar el estado. Inténtalo de nuevo.', 'danger');
    } finally {
      set_busy(null);
    }
  }

  return (
    <View style={styles.wrap}>
      {heading ? (
        <View style={styles.head}>
          <Text variant="heading" heading={2}>
            {type_label(incident.type)}
          </Text>
          <View style={styles.badges}>
            <SeverityBadge value={incident.severity} />
            <StatusBadge value={incident.status} />
          </View>
        </View>
      ) : (
        <View style={styles.badges}>
          <SeverityBadge value={incident.severity} />
          <StatusBadge value={incident.status} />
        </View>
      )}
      {incident.source === 'sintetico' ? <Banner tone="warning">Este registro es sintético, de demostración.</Banner> : null}
      {show_map ? (
        <IncidentMap incidents={list} zones={[]} show_incidents show_zones={false} selected_id={incident.id} focus={focus} height={200} label={`Ubicación de ${type_label(incident.type)}`} />
      ) : null}
      <View>
        <KeyValue label="Fecha" value={format_date(incident.occurred_on)} />
        <KeyValue label="Sendero" value={incident.trail ?? 'Sin sendero'} />
        <KeyValue label="Coordenadas" value={format_coords(incident.latitude, incident.longitude)} />
        <KeyValue label="Precisión" value={precision_label[incident.location_precision]} />
        <KeyValue label="Origen" value={source_label[incident.source]} />
        <KeyValue label="Identificador" value={incident.id} />
      </View>
      {staff ? (
        <View style={styles.actions}>
          {incident.status !== 'validado' && incident.status !== 'cerrado' ? (
            <Button label="Validar incidente" icon="checkmark" onPress={() => set_status('validado')} loading={busy === 'validado'} />
          ) : null}
          {incident.status !== 'cerrado' ? (
            <Button label="Cerrar incidente" variant="secondary" icon="lock-closed-outline" onPress={() => set_confirm_close(true)} loading={busy === 'cerrado'} />
          ) : null}
        </View>
      ) : (
        <Text variant="small" tone="muted">
          Coordinación valida y cierra los incidentes.
        </Text>
      )}
      <ConfirmDialog
        visible={confirm_close}
        title="Cerrar incidente"
        message="El incidente quedará cerrado y dejará de aparecer como pendiente. Coordinación puede consultarlo en el historial."
        confirm_label="Cerrar incidente"
        onCancel={() => set_confirm_close(false)}
        onConfirm={() => {
          set_confirm_close(false);
          void set_status('cerrado');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space[5] },
  head: { gap: space[3] },
  badges: { flexDirection: 'row', gap: space[2], flexWrap: 'wrap' },
  actions: { flexDirection: 'row', gap: space[3], flexWrap: 'wrap' },
});
