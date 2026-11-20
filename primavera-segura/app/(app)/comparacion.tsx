import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RequireRole } from '../../src/components/RequireRole';
import { SyntheticBanner } from '../../src/components/SyntheticBanner';
import { useApp } from '../../src/data/app_context';
import { useBreakpoint } from '../../src/hooks/use_breakpoint';
import { iso_day } from '../../src/lib/filters';
import { format_date } from '../../src/lib/labels';
import type { ZoneDelta } from '../../src/lib/types';
import { compare_periods, period_confidence } from '../../src/lib/zones';
import { colors, space } from '../../src/theme';
import { Banner, ChoiceGroup, DataTable, EmptyState, Page, Panel, Text, TextField, type Column } from '../../src/ui';

type Preset = 'months' | 'weeks' | 'custom';

function month_bounds(offset: number, today: Date) {
  const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + offset, 1));
  const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + offset + 1, 0));
  return { from: iso_day(start), to: iso_day(offset === 0 ? today : end) };
}

function presets(today: Date) {
  const day = 86400000;
  return {
    months: { a: month_bounds(-1, today), b: month_bounds(0, today) },
    weeks: {
      a: { from: iso_day(new Date(today.getTime() - 27 * day)), to: iso_day(new Date(today.getTime() - 14 * day)) },
      b: { from: iso_day(new Date(today.getTime() - 13 * day)), to: iso_day(today) },
    },
  };
}

export default function Comparacion() {
  return (
    <RequireRole roles={['coordinador', 'administrador']}>
      <ComparacionScreen />
    </RequireRole>
  );
}

function ComparacionScreen() {
  const { incidents } = useApp();
  const { is_phone } = useBreakpoint();
  const today = useMemo(() => new Date(), []);
  const p = useMemo(() => presets(today), [today]);
  const [preset, set_preset] = useState<Preset>('months');
  const [custom, set_custom] = useState(p.months);
  const range = preset === 'custom' ? custom : p[preset];
  const a = range.a;
  const b = range.b;
  const deltas = useMemo(() => compare_periods(incidents, a, b), [incidents, a, b]);
  const ca = period_confidence(incidents, a);
  const cb = period_confidence(incidents, b);
  const worse = deltas.filter((d) => d.trend === 'empeora').length;
  const better = deltas.filter((d) => d.trend === 'mejora').length;
  const change = cb.count - ca.count;

  const columns: Column<ZoneDelta>[] = [
    { key: 'center', title: 'Celda (centro)', flex: 1.4, render: (d) => <Text variant="data">{`${d.center.latitude.toFixed(4)}, ${d.center.longitude.toFixed(4)}`}</Text> },
    { key: 'a', title: 'Puntaje A', width: 96, align: 'right', render: (d) => <Text variant="data">{d.score_a}</Text> },
    { key: 'b', title: 'Puntaje B', width: 96, align: 'right', render: (d) => <Text variant="data">{d.score_b}</Text> },
    { key: 'trend', title: 'Cambio', width: 150, render: (d) => <Trend delta={d} /> },
  ];

  return (
    <Page title="Comparación de periodos" description="Qué zonas empeoran o mejoran entre dos periodos." back={is_phone ? '/zonas' : undefined}>
      <ChoiceGroup
        label="Comparar"
        options={[
          { value: 'months', label: 'Mes anterior contra este mes' },
          { value: 'weeks', label: 'Dos semanas contra las dos previas' },
          { value: 'custom', label: 'Personalizado' },
        ]}
        value={preset}
        onChange={set_preset}
      />
      {preset === 'custom' ? (
        <View style={styles.custom}>
          <PeriodFields label="Periodo A" value={custom.a} onChange={(v) => set_custom((c) => ({ ...c, a: v }))} />
          <PeriodFields label="Periodo B" value={custom.b} onChange={(v) => set_custom((c) => ({ ...c, b: v }))} />
        </View>
      ) : null}
      <SyntheticBanner />
      {ca.low_confidence || cb.low_confidence ? (
        <Banner tone="warning" title="Datos insuficientes">
          {`El periodo A tiene ${ca.count} incidentes y el B tiene ${cb.count}. Se necesitan al menos 5 en cada uno para sacar conclusiones.`}
        </Banner>
      ) : null}
      <View style={styles.summary}>
        <Summary label="Periodo A" value={String(ca.count)} detail={`${format_date(a.from)} a ${format_date(a.to)}`} />
        <Summary label="Periodo B" value={String(cb.count)} detail={`${format_date(b.from)} a ${format_date(b.to)}`} />
        <Summary label="Diferencia" value={`${change > 0 ? '+' : ''}${change}`} detail={change > 0 ? 'Más incidentes en B' : change < 0 ? 'Menos incidentes en B' : 'Sin cambio'} />
        <Summary label="Celdas" value={`${worse} / ${better}`} detail="Empeoran / mejoran" />
      </View>
      <Panel title="Cambios por celda" description="Ordenados por la magnitud del cambio." padded={false}>
        {deltas.length === 0 ? (
          <EmptyState icon="analytics-outline" title="Sin incidentes en ninguno de los dos periodos" body="Elige periodos con registros." />
        ) : is_phone ? (
          deltas.slice(0, 12).map((d) => (
            <View key={d.key} style={styles.phone_row}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="data">{`${d.center.latitude.toFixed(4)}, ${d.center.longitude.toFixed(4)}`}</Text>
                <Text variant="small" tone="muted">{`Puntaje ${d.score_a} a ${d.score_b}${d.low_confidence ? ', pocos datos' : ''}`}</Text>
              </View>
              <Trend delta={d} />
            </View>
          ))
        ) : (
          <DataTable caption="Cambios por celda" columns={columns} rows={deltas.slice(0, 15)} row_key={(d) => d.key} />
        )}
      </Panel>
    </Page>
  );
}

function Trend({ delta }: { delta: ZoneDelta }) {
  const t = {
    empeora: { icon: 'arrow-up' as const, color: colors.danger_text, text: `Empeora +${delta.delta}` },
    mejora: { icon: 'arrow-down' as const, color: colors.bosque, text: `Mejora ${delta.delta}` },
    igual: { icon: 'remove' as const, color: colors.ink_muted, text: 'Sin cambio' },
  }[delta.trend];
  return (
    <View style={styles.trend_wrap}>
      <View style={styles.trend}>
        <Ionicons name={t.icon} size={16} color={t.color} aria-hidden />
        <Text variant="small_strong" style={{ color: t.color }}>
          {t.text}
        </Text>
      </View>
      {delta.low_confidence ? (
        <Text variant="caption" tone="muted">
          Pocos datos
        </Text>
      ) : null}
    </View>
  );
}

function Summary({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <View style={styles.cell}>
      <Text variant="small" tone="muted">
        {label}
      </Text>
      <Text variant="figure">{value}</Text>
      <Text variant="small" tone="muted">
        {detail}
      </Text>
    </View>
  );
}

function PeriodFields({ label, value, onChange }: { label: string; value: { from: string; to: string }; onChange: (v: { from: string; to: string }) => void }) {
  return (
    <View style={{ gap: space[2], flex: 1, minWidth: 260 }}>
      <Text variant="small_strong">{label}</Text>
      <View style={styles.custom}>
        <TextField grow label="Desde" placeholder="AAAA-MM-DD" value={value.from} onChangeText={(from) => onChange({ ...value, from })} />
        <TextField grow label="Hasta" placeholder="AAAA-MM-DD" value={value.to} onChangeText={(to) => onChange({ ...value, to })} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  custom: { flexDirection: 'row', flexWrap: 'wrap', gap: space[4] },
  summary: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.line, overflow: 'hidden' },
  cell: { flexGrow: 1, flexBasis: 150, padding: space[4], paddingHorizontal: space[5], gap: 2, borderRightWidth: 1, borderBottomWidth: 1, borderColor: colors.line, marginRight: -1, marginBottom: -1 },
  phone_row: { flexDirection: 'row', alignItems: 'center', gap: space[3], padding: space[4], borderBottomWidth: 1, borderBottomColor: colors.line },
  trend_wrap: { gap: 2 },
  trend: { flexDirection: 'row', alignItems: 'center', gap: space[1] },
});
