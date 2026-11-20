import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { IncidentMap } from '../../src/components/IncidentMap';
import { RequireRole } from '../../src/components/RequireRole';
import { SyntheticBanner } from '../../src/components/SyntheticBanner';
import { Button, Card, Field, Muted, Notice, Row, Screen, Tag } from '../../src/components/ui';
import { useApp } from '../../src/data/app_context';
import { critical_zones, filter_incidents } from '../../src/lib/zones';

export default function Zonas() {
  const { incidents } = useApp();
  const router = useRouter();
  const [from, set_from] = useState('');
  const [to, set_to] = useState('');
  const data = useMemo(() => filter_incidents(incidents, { from, to }), [incidents, from, to]);
  const zones = useMemo(() => critical_zones(data), [data]);
  const critical = zones.filter((z) => z.critical);

  return (
    <RequireRole roles={['coordinador', 'administrador']}>
      <Screen title="Zonas críticas" subtitle="Celdas de ~500 m con puntaje por gravedad (baja 1, media 2, alta 3)">
        <SyntheticBanner />
        <Card>
          <Row>
            <Field label="Desde" value={from} onChangeText={set_from} testID="zfrom" />
            <Field label="Hasta" value={to} onChangeText={set_to} testID="zto" />
          </Row>
        </Card>
        {data.length < 5 ? <Notice tone="warning">Hay pocos datos en este periodo ({data.length}). Las conclusiones pueden no ser confiables.</Notice> : null}
        <IncidentMap incidents={data} zones={zones} show_incidents={false} show_zones height={360} />
        {critical.slice(0, 8).map((z, n) => (
          <Card key={z.key}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Muted>{`Zona ${n + 1} · ${z.center.latitude.toFixed(4)}, ${z.center.longitude.toFixed(4)}`}</Muted>
              <Tag label={`Puntaje ${z.score}`} tone="danger" />
            </Row>
            <Muted>{`${z.count} incidentes`}</Muted>
          </Card>
        ))}
        {critical.length === 0 ? <Muted>Ninguna celda cumple el criterio (percentil 80 y al menos 5 incidentes).</Muted> : null}
        <Button label="Comparar periodos" variant="secondary" onPress={() => router.navigate('/comparacion')} />
      </Screen>
    </RequireRole>
  );
}
