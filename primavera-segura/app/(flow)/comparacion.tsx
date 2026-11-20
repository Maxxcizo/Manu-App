import React, { useMemo, useState } from 'react';
import { RequireRole } from '../../src/components/RequireRole';
import { SyntheticBanner } from '../../src/components/SyntheticBanner';
import { Card, Field, H, Muted, Notice, Row, Screen, Tag } from '../../src/components/ui';
import { useApp } from '../../src/data/app_context';
import { compare_periods, period_confidence } from '../../src/lib/zones';

export default function Comparacion() {
  const { incidents } = useApp();
  const [a_from, set_a_from] = useState('2026-09-01');
  const [a_to, set_a_to] = useState('2026-09-30');
  const [b_from, set_b_from] = useState('2026-10-01');
  const [b_to, set_b_to] = useState('2026-10-31');
  const a = useMemo(() => ({ from: a_from, to: a_to }), [a_from, a_to]);
  const b = useMemo(() => ({ from: b_from, to: b_to }), [b_from, b_to]);
  const deltas = useMemo(() => compare_periods(incidents, a, b).slice(0, 10), [incidents, a, b]);
  const ca = period_confidence(incidents, a);
  const cb = period_confidence(incidents, b);

  return (
    <RequireRole roles={['coordinador', 'administrador']}>
      <Screen embedded title="Comparación de periodos" subtitle="Qué zonas empeoran o mejoran">
        <SyntheticBanner />
        <Card>
          <H>Periodo A</H>
          <Row><Field label="Desde" value={a_from} onChangeText={set_a_from} testID="afrom" /><Field label="Hasta" value={a_to} onChangeText={set_a_to} testID="ato" /></Row>
          <H>Periodo B</H>
          <Row><Field label="Desde" value={b_from} onChangeText={set_b_from} testID="bfrom" /><Field label="Hasta" value={b_to} onChangeText={set_b_to} testID="bto" /></Row>
        </Card>
        {ca.low_confidence || cb.low_confidence ? (
          <Notice tone="warning">{`Datos insuficientes: periodo A tiene ${ca.count} incidentes y B tiene ${cb.count}. Se necesitan al menos 5 en cada uno.`}</Notice>
        ) : null}
        {deltas.map((d) => (
          <Card key={d.key}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Muted>{`${d.center.latitude.toFixed(4)}, ${d.center.longitude.toFixed(4)}`}</Muted>
              <Tag label={d.trend === 'empeora' ? `Empeora +${d.delta}` : d.trend === 'mejora' ? `Mejora ${d.delta}` : 'Sin cambio'} tone={d.trend === 'empeora' ? 'danger' : d.trend === 'mejora' ? 'success' : 'info'} />
            </Row>
            <Muted>{`Puntaje A ${d.score_a} → B ${d.score_b}${d.low_confidence ? ' · pocos datos' : ''}`}</Muted>
          </Card>
        ))}
      </Screen>
    </RequireRole>
  );
}
