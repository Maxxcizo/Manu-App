import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { type_label } from '../../src/components/labels';
import { SyntheticBanner } from '../../src/components/SyntheticBanner';
import { Bar, Button, Card, H, Muted, Notice, Row, Screen, Tag } from '../../src/components/ui';
import { useApp } from '../../src/data/app_context';
import { stats_by, stats_by_weekday } from '../../src/lib/zones';

export default function Home() {
  const { user, incidents, error, refresh } = useApp();
  const router = useRouter();
  const staff = user?.role !== 'rescatista';
  const stats = useMemo(() => {
    const trails = stats_by(incidents, 'trail').slice(0, 5);
    const types = stats_by(incidents, 'type').slice(0, 5);
    const weekday = stats_by_weekday(incidents);
    return { trails, types, weekday, serious: incidents.filter((i) => i.severity === 'alta') };
  }, [incidents]);

  return (
    <Screen title={staff ? 'Resumen de coordinación' : `Hola, ${user?.full_name.split(' ')[0] ?? ''}`} subtitle={user ? `${user.role}${user.brigade ? ` · Brigada ${user.brigade}` : ''}` : ''}>
      <SyntheticBanner />
      {error ? <Notice tone="danger">{error}</Notice> : null}
      <Row>
        <Card style={{ flex: 1, minWidth: 140 }}>
          <Muted>Incidentes registrados</Muted>
          <H>{String(incidents.length)}</H>
        </Card>
        <Card style={{ flex: 1, minWidth: 140 }}>
          <Muted>Graves</Muted>
          <H>{String(stats.serious.length)}</H>
        </Card>
      </Row>
      <Button label="Registrar incidente" onPress={() => router.navigate('/registrar')} />
      {error ? <Button label="Reintentar" variant="secondary" onPress={refresh} /> : null}

      <Card>
        <H>Senderos con más incidentes</H>
        {stats.trails.map(([name, n]) => (
          <Bar key={name} label={name} value={n} max={stats.trails[0]?.[1] ?? 1} />
        ))}
      </Card>
      <Card>
        <H>Incidentes por tipo</H>
        {stats.types.map(([code, n]) => (
          <Bar key={code} label={type_label(code)} value={n} max={stats.types[0]?.[1] ?? 1} />
        ))}
      </Card>
      {staff ? (
        <Card>
          <H>Incidentes por día de la semana</H>
          {stats.weekday.map((d) => (
            <Bar key={d.name} label={d.name} value={d.count} max={Math.max(...stats.weekday.map((x) => x.count), 1)} />
          ))}
        </Card>
      ) : null}
      <Card>
        <H>Incidentes graves recientes</H>
        {stats.serious.slice(0, 4).map((i) => (
          <Row key={i.id} style={{ justifyContent: 'space-between' }}>
            <Muted>{`${type_label(i.type)} · ${i.trail ?? 'sin sendero'} · ${i.occurred_on}`}</Muted>
            <Tag label="Alta" tone="danger" />
          </Row>
        ))}
      </Card>
    </Screen>
  );
}
