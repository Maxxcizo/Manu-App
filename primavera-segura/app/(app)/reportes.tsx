import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import React, { useMemo, useState } from 'react';
import { Platform, Share, StyleSheet, View } from 'react-native';
import { RequireRole } from '../../src/components/RequireRole';
import { useApp } from '../../src/data/app_context';
import { to_csv, to_geojson, to_report_html } from '../../src/lib/export';
import { PERIOD_PRESETS, period_range, type PeriodPreset } from '../../src/lib/filters';
import { filter_incidents } from '../../src/lib/zones';
import { colors, radius, space } from '../../src/theme';
import { Banner, Button, ChoiceGroup, Page, Text, useToast } from '../../src/ui';

async function deliver(name: string, mime: string, content: string) {
  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([content], { type: mime }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  } else {
    await Share.share({ title: name, message: content });
  }
}

const PERIODS = PERIOD_PRESETS.map((p) => ({ value: p.value as PeriodPreset, label: p.label }));
type Format = 'pdf' | 'csv' | 'geojson';

const FORMATS: { key: Format; title: string; body: string; icon: React.ComponentProps<typeof Ionicons>['name']; action: string }[] = [
  { key: 'pdf', title: 'Reporte PDF', body: 'Tabla de incidentes lista para imprimir o compartir con el socio.', icon: 'document-text-outline', action: 'Generar PDF' },
  { key: 'csv', title: 'Datos en CSV', body: 'Para hojas de cálculo. Protegido contra fórmulas peligrosas.', icon: 'grid-outline', action: 'Descargar CSV' },
  { key: 'geojson', title: 'Capa GeoJSON', body: 'Para abrir los puntos en QGIS u otra herramienta de mapas.', icon: 'map-outline', action: 'Descargar GeoJSON' },
];

export default function Reportes() {
  return (
    <RequireRole roles={['coordinador', 'administrador']}>
      <ReportesScreen />
    </RequireRole>
  );
}

function ReportesScreen() {
  const { incidents } = useApp();
  const toast = useToast();
  const [period, set_period] = useState<PeriodPreset>('all');
  const [busy, set_busy] = useState<Format | null>(null);
  const data = useMemo(() => filter_incidents(incidents, period_range(period)), [incidents, period]);

  async function run(format: Format) {
    set_busy(format);
    try {
      if (format === 'pdf') await Print.printAsync({ html: to_report_html(data, 'Reporte de incidentes, Bosque La Primavera') });
      if (format === 'csv') await deliver('incidentes.csv', 'text/csv', to_csv(data));
      if (format === 'geojson') await deliver('incidentes.geojson', 'application/geo+json', to_geojson(data));
      toast.show(format === 'pdf' ? 'Reporte PDF generado' : 'Archivo descargado');
    } catch {
      toast.show('No se pudo exportar. Inténtalo de nuevo.', 'danger');
    } finally {
      set_busy(null);
    }
  }

  return (
    <Page title="Informes" description="Exporta los incidentes del periodo elegido. Las exportaciones nunca incluyen datos personales.">
      <ChoiceGroup label="Periodo" options={PERIODS} value={period} onChange={set_period} />
      <Text tone="muted">{`${data.length} incidentes se incluirán en la exportación.`}</Text>
      {data.length === 0 ? <Banner tone="warning">No hay incidentes en este periodo. Elige uno más amplio.</Banner> : null}
      <View style={styles.grid}>
        {FORMATS.map((f) => (
          <View key={f.key} style={styles.card}>
            <View style={styles.icon}>
              <Ionicons name={f.icon} size={22} color={colors.bosque} aria-hidden />
            </View>
            <View style={{ gap: space[1], flex: 1 }}>
              <Text variant="subheading" heading={2}>
                {f.title}
              </Text>
              <Text variant="small" tone="muted">
                {f.body}
              </Text>
            </View>
            <Button label={f.action} variant="secondary" icon="download-outline" disabled={data.length === 0} loading={busy === f.key} onPress={() => run(f.key)} />
          </View>
        ))}
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space[4] },
  card: {
    flexGrow: 1,
    flexBasis: 260,
    gap: space[4],
    padding: space[5],
    backgroundColor: colors.surface,
    borderRadius: radius.panel,
    borderWidth: 1,
    borderColor: colors.line,
  },
  icon: { width: 44, height: 44, borderRadius: radius.control, backgroundColor: colors.bosque_tint, alignItems: 'center', justifyContent: 'center' },
});
