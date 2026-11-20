import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { IncidentListItem } from '../../src/components/IncidentListItem';
import { SyntheticBanner } from '../../src/components/SyntheticBanner';
import { useApp } from '../../src/data/app_context';
import { useBreakpoint } from '../../src/hooks/use_breakpoint';
import { PERIOD_PRESETS, period_range, type PeriodPreset } from '../../src/lib/filters';
import { role_label, type_label } from '../../src/lib/labels';
import { filter_incidents, stats_by, stats_by_weekday } from '../../src/lib/zones';
import { colors, space } from '../../src/theme';
import { Banner, BarList, Button, ChoiceGroup, ColumnChart, Columns, EmptyState, LoadingList, Page, Panel, Skeleton, Text } from '../../src/ui';

const PERIODS = PERIOD_PRESETS.map((p) => ({ value: p.value as PeriodPreset, label: p.label }));
const PERIOD_TEXT: Record<string, string> = { '7d': 'en los últimos 7 días', '30d': 'en los últimos 30 días', '90d': 'en los últimos 90 días', all: 'en todo el registro' };

export default function Home() {
  const { user, incidents, loading, error, refresh } = useApp();
  const router = useRouter();
  const { is_phone, is_desktop } = useBreakpoint();
  const [period, set_period] = useState<PeriodPreset>('30d');
  const staff = user?.role !== 'rescatista';

  const data = useMemo(() => filter_incidents(incidents, period_range(period)), [incidents, period]);
  const stats = useMemo(
    () => ({
      serious: data.filter((i) => i.severity === 'alta'),
      pending: data.filter((i) => i.status === 'pendiente'),
      trails: stats_by(data, 'trail').map(([label, value]) => ({ label, value })),
      types: stats_by(data, 'type').map(([code, value]) => ({ label: type_label(code), value })),
      weekday: stats_by_weekday(data).map((d) => ({ label: d.name, value: d.count })),
    }),
    [data],
  );
  const top_trail = stats.trails[0];
  const open = (id: string) => router.navigate({ pathname: '/incidente/[id]', params: { id } });
  const report = <Button label="Registrar incidente" icon="add" onPress={() => router.navigate('/registrar')} full_width={is_phone} />;

  const period_control = <ChoiceGroup label="Periodo" hide_label options={PERIODS} value={period} onChange={set_period} />;

  return (
    <Page
      title={staff ? 'Resumen' : `Hola, ${user?.full_name.split(' ')[0] ?? ''}`}
      description={staff ? `Actividad de incidentes ${PERIOD_TEXT[period]}.` : `${role_label.rescatista}${user?.brigade ? `, brigada ${user.brigade}` : ''}. Lo que ha pasado ${PERIOD_TEXT[period]}.`}
      actions={is_desktop ? (staff ? period_control : report) : undefined}
    >
      {!is_desktop && !staff ? report : null}
      {!is_desktop || !staff ? period_control : null}
      <SyntheticBanner />
      {error ? (
        <Banner tone="danger" title="Sin datos actualizados" action={<Button label="Reintentar" variant="secondary" compact onPress={refresh} />}>
          {error}
        </Banner>
      ) : null}

      <View style={styles.strip} accessibilityLabel="Cifras del periodo">
        <Figure label="Incidentes" value={loading ? null : String(data.length)} />
        <Figure label="Gravedad alta" value={loading ? null : String(stats.serious.length)} tone={stats.serious.length ? 'danger' : 'default'} />
        <Figure label="Pendientes de validar" value={loading ? null : String(stats.pending.length)} />
        <Figure label="Sendero con más incidentes" value={loading ? null : (top_trail?.label ?? 'Sin datos')} small />
      </View>

      <Columns ratio={[1.35, 1]}>
        <View style={styles.stack}>
          <Panel
            title={staff ? 'Pendientes de validar' : 'Incidentes recientes'}
            description={staff ? 'Registrados en campo y aún sin revisar.' : undefined}
            padded={false}
            actions={<Button label="Ver todos" variant="tertiary" compact onPress={() => router.navigate('/incidentes')} />}
          >
            {loading ? (
              <View style={{ padding: space[4] }}>
                <LoadingList rows={4} />
              </View>
            ) : (staff ? stats.pending : data).length === 0 ? (
              <EmptyState icon="checkmark-done-outline" title={staff ? 'Nada pendiente' : 'Sin incidentes en este periodo'} body={staff ? 'Todos los incidentes del periodo están validados o cerrados.' : 'Prueba con un periodo más amplio.'} />
            ) : (
              (staff ? stats.pending : data).slice(0, 6).map((i) => <IncidentListItem key={i.id} incident={i} onPress={() => open(i.id)} />)
            )}
          </Panel>
          {staff ? (
            <Panel title="Por día de la semana" description="Ayuda a decidir qué días reforzar las brigadas.">
              {loading ? <Skeleton height={140} /> : <ColumnChart items={stats.weekday} caption="Incidentes por día de la semana" />}
            </Panel>
          ) : null}
        </View>
        <View style={styles.stack}>
          <Panel title="Senderos con más incidentes">
            {loading ? <Skeleton height={160} /> : stats.trails.length ? <BarList items={stats.trails.slice(0, 6)} caption="Incidentes por sendero" /> : <Text tone="muted">Sin datos en este periodo.</Text>}
          </Panel>
          <Panel title="Por tipo de incidente">
            {loading ? <Skeleton height={160} /> : stats.types.length ? <BarList items={stats.types.slice(0, 7)} caption="Incidentes por tipo" /> : <Text tone="muted">Sin datos en este periodo.</Text>}
          </Panel>
        </View>
      </Columns>
    </Page>
  );
}

function Figure({ label, value, tone = 'default', small }: { label: string; value: string | null; tone?: 'default' | 'danger'; small?: boolean }) {
  return (
    <View style={styles.figure}>
      <Text variant="small" tone="muted">
        {label}
      </Text>
      {value === null ? (
        <Skeleton width={64} height={28} />
      ) : (
        <Text variant={small ? 'subheading' : 'figure'} numberOfLines={1} style={tone === 'danger' ? { color: colors.danger_text } : undefined}>
          {value}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: space[6] },
  strip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
  },
  figure: {
    flexGrow: 1,
    flexBasis: 150,
    gap: space[1],
    paddingVertical: space[4],
    paddingHorizontal: space[5],
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.line,
    marginRight: -1,
    marginBottom: -1,
    minHeight: 84,
    justifyContent: 'center',
  },
});
