import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { severity_tone, status_label, type_label } from '../../../src/components/labels';
import { Button, Card, H, Muted, Notice, Row, Screen, Tag } from '../../../src/components/ui';
import { useApp } from '../../../src/data/app_context';
import { ForbiddenError } from '../../../src/data/repository';
import type { IncidentStatus } from '../../../src/lib/types';

export default function Detalle() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { incidents, user, repo, refresh } = useApp();
  const router = useRouter();
  const [message, set_message] = useState<string | null>(null);
  const incident = incidents.find((i) => i.id === id);
  const staff = user?.role !== 'rescatista';

  async function set_status(status: IncidentStatus) {
    try {
      await repo.set_incident_status(incident!.id, status);
      await refresh();
      set_message('Estado actualizado.');
    } catch (e) {
      set_message(e instanceof ForbiddenError ? 'No tienes permiso para cambiar el estado.' : 'No se pudo actualizar.');
    }
  }

  if (!incident)
    return (
      <Screen embedded title="Incidente">
        <Muted>No se encontró el incidente.</Muted>
        <Button label="Volver" onPress={() => router.back()} />
      </Screen>
    );

  return (
    <Screen embedded title={type_label(incident.type)} subtitle={incident.occurred_on}>
      <Card>
        <Row>
          <Tag label={incident.severity} tone={severity_tone(incident.severity)} />
          <Tag label={status_label[incident.status]} tone="warning" />
        </Row>
        <H>Ubicación</H>
        <Muted>{`${incident.latitude.toFixed(5)}, ${incident.longitude.toFixed(5)} · sendero ${incident.trail ?? 'sin dato'}`}</Muted>
        <Muted>{`Precisión: ${incident.location_precision} · origen: ${incident.source}`}</Muted>
      </Card>
      {message ? <Notice>{message}</Notice> : null}
      {staff && incident.status !== 'validado' ? <Button label="Marcar como validado" onPress={() => set_status('validado')} /> : null}
      {staff && incident.status !== 'cerrado' ? <Button label="Cerrar incidente" variant="secondary" onPress={() => set_status('cerrado')} /> : null}
      <Button label="Volver a la lista" variant="secondary" onPress={() => router.back()} />
    </Screen>
  );
}
