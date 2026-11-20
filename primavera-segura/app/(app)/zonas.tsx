import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { IncidentMap } from '../../src/components/IncidentMap';
import { MapLegend } from '../../src/components/MapLegend';
import { RequireRole } from '../../src/components/RequireRole';
import { SyntheticBanner } from '../../src/components/SyntheticBanner';
import { useApp } from '../../src/data/app_context';
import { useBreakpoint } from '../../src/hooks/use_breakpoint';
import { PERIOD_PRESETS, period_range, type PeriodPreset } from '../../src/lib/filters';
import type { Zone } from '../../src/lib/types';
import { MIN_INCIDENTS, critical_zones, filter_incidents } from '../../src/lib/zones';
import { space } from '../../src/theme';
import { Badge, Banner, Button, ChoiceGroup, Columns, DataTable, EmptyState, Page, Panel, Text, type Column } from '../../src/ui';

const PERIODS = PERIOD_PRESETS.map((p) => ({ value: p.value as PeriodPreset, label: p.label }));

export default function Zonas() {
  return (
    <RequireRole roles={['coordinador', 'administrador']}>
      <ZonasScreen />
    </RequireRole>
  );
}

function ZonasScreen() {
  const { incidents } = useApp();
  const router = useRouter();
  const { is_phone, is_desktop } = useBreakpoint();
  const [period, set_period] = useState<PeriodPreset>('90d');
  const data = useMemo(() => filter_incidents(incidents, period_range(period)), [incidents, period]);
  const zones = useMemo(() => critical_zones(data), [data]);
  const critical = zones.filter((z) => z.critical);
  const [selected, set_selected] = useState<string | null>(null);
  const focus = useMemo(() => {
    const z = critical.find((c) => c.key === selected);
    return z ? { lat: z.center.latitude, lng: z.center.longitude } : null;
  }, [critical, selected]);

  const columns: Column<Zone & { rank: number }>[] = [
    { key: 'rank', title: 'Zona', width: 52, render: (z) => <Text variant="body_strong">{z.rank}</Text> },
    { key: 'center', title: 'Centro', flex: 2, render: (z) => <Text variant="data" numberOfLines={1}>{`${z.center.latitude.toFixed(4)}, ${z.center.longitude.toFixed(4)}`}</Text> },
    { key: 'count', title: 'Incidentes', width: 92, align: 'right', render: (z) => <Text variant="data">{z.count}</Text> },
    { key: 'score', title: 'Puntaje', width: 80, align: 'right', render: (z) => <Text variant="body_strong">{z.score}</Text> },
  ];
  const ranked = critical.map((z, i) => ({ ...z, rank: i + 1 }));

  return (
    <Page
      title="Zonas críticas"
      description="Celdas de unos 500 m donde se concentran más incidentes, ponderados por gravedad."
      actions={is_desktop ? <Button label="Comparar periodos" variant="secondary" icon="git-compare-outline" onPress={() => router.navigate('/comparacion')} /> : undefined}
    >
      <ChoiceGroup label="Periodo" options={PERIODS} value={period} onChange={set_period} />
      <SyntheticBanner />
      {data.length < MIN_INCIDENTS ? (
        <Banner tone="warning" title="Datos insuficientes">
          {`Solo hay ${data.length} incidentes en este periodo. Con menos de ${MIN_INCIDENTS} las zonas no son confiables.`}
        </Banner>
      ) : null}
      <Columns ratio={[1.4, 1]}>
        <View style={styles.stack}>
          <IncidentMap incidents={data} zones={zones} show_incidents={false} show_zones focus={focus} height={is_phone ? 300 : 520} label="Mapa de zonas críticas" />
          <MapLegend direction="row" show_points={false} />
        </View>
        <View style={styles.stack}>
          <Panel title={`${critical.length} zonas críticas`} description="Ordenadas por puntaje. Selecciona una para centrar el mapa." padded={false}>
            {ranked.length === 0 ? (
              <EmptyState icon="leaf-outline" title="Ninguna zona cumple el criterio" body="Ninguna celda llega al percentil 80 con al menos 5 incidentes en este periodo." />
            ) : (
              <DataTable caption="Zonas críticas" columns={columns} rows={ranked.slice(0, 12)} row_key={(z) => z.key} selected_key={selected} on_row_press={(z) => set_selected(z.key)} />
            )}
          </Panel>
          <Panel title="Cómo se calcula">
            <Text variant="small" tone="muted">
              {`El bosque se divide en celdas de unos 500 m por lado. Cada incidente suma 1, 2 o 3 puntos según su gravedad. Una celda es crítica cuando su puntaje está en el 20% más alto y tiene al menos ${MIN_INCIDENTS} incidentes; si tiene menos, se marca como de pocos datos.`}
            </Text>
            <Badge label="Pendiente de validación escrita por el socio" tone="warning" />
          </Panel>
        </View>
      </Columns>
      {!is_desktop ? <Button label="Comparar periodos" variant="secondary" icon="git-compare-outline" onPress={() => router.navigate('/comparacion')} /> : null}
    </Page>
  );
}

const styles = StyleSheet.create({
  stack: { gap: space[4] },
});
