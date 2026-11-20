import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable } from 'react-native';
import { severity_tone, type_label } from '../../src/components/labels';
import { SyntheticBanner } from '../../src/components/SyntheticBanner';
import { Button, Card, Chip, Field, Muted, Row, Screen, Tag } from '../../src/components/ui';
import { useApp } from '../../src/data/app_context';
import { INCIDENT_TYPES, SEVERITIES, type IncidentFilters } from '../../src/lib/types';
import { filter_incidents } from '../../src/lib/zones';

export default function Incidentes() {
  const { incidents } = useApp();
  const router = useRouter();
  const [filters, set_filters] = useState<IncidentFilters>({});
  const shown = useMemo(() => filter_incidents(incidents, filters), [incidents, filters]);
  const patch = (p: IncidentFilters) => set_filters((f) => ({ ...f, ...p }));

  return (
    <Screen title="Incidentes" subtitle={`${shown.length} de ${incidents.length} incidentes`}>
      <SyntheticBanner />
      <Card>
        <Muted>Gravedad</Muted>
        <Row>
          <Chip label="Todas" active={!filters.severity} onPress={() => patch({ severity: '' })} />
          {SEVERITIES.map((s) => (
            <Chip key={s} label={s} active={filters.severity === s} onPress={() => patch({ severity: s })} />
          ))}
        </Row>
        <Muted>Tipo</Muted>
        <Row>
          <Chip label="Todos" active={!filters.type} onPress={() => patch({ type: '' })} />
          {INCIDENT_TYPES.map((t) => (
            <Chip key={t.code} label={t.label} active={filters.type === t.code} onPress={() => patch({ type: t.code })} />
          ))}
        </Row>
        <Row>
          <Field label="Desde (AAAA-MM-DD)" value={filters.from ?? ''} onChangeText={(from) => patch({ from })} testID="from" />
          <Field label="Hasta (AAAA-MM-DD)" value={filters.to ?? ''} onChangeText={(to) => patch({ to })} testID="to" />
        </Row>
        <Button label="Limpiar filtros" variant="secondary" onPress={() => set_filters({})} />
      </Card>
      {shown.slice(0, 60).map((i) => (
        <Pressable key={i.id} accessibilityRole="button" onPress={() => router.navigate({ pathname: '/incidente/[id]', params: { id: i.id } })}>
          <Card>
            <Row style={{ justifyContent: 'space-between' }}>
              <Tag label={i.severity} tone={severity_tone(i.severity)} />
              <Muted>{i.occurred_on}</Muted>
            </Row>
            <Muted>{`${type_label(i.type)} · ${i.trail ?? 'sin sendero'}`}</Muted>
          </Card>
        </Pressable>
      ))}
      {shown.length === 0 ? <Muted>No hay incidentes con esos filtros.</Muted> : null}
    </Screen>
  );
}
