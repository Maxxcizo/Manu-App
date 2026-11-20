import * as Print from 'expo-print';
import React, { useState } from 'react';
import { Platform, Share } from 'react-native';
import { RequireRole } from '../../src/components/RequireRole';
import { Button, Card, Muted, Notice, Screen } from '../../src/components/ui';
import { useApp } from '../../src/data/app_context';
import { to_csv, to_geojson, to_report_html } from '../../src/lib/export';

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

export default function Reportes() {
  const { incidents } = useApp();
  const [message, set_message] = useState<string | null>(null);
  const run = (fn: () => Promise<void>) => async () => {
    try {
      await fn();
      set_message('Exportación lista.');
    } catch {
      set_message('No se pudo exportar. Intenta de nuevo.');
    }
  };

  return (
    <RequireRole roles={['coordinador', 'administrador']}>
      <Screen title="Reportes" subtitle="Exportaciones y base de datos reutilizable">
        <Card>
          <Muted>{`${incidents.length} incidentes disponibles. Las exportaciones omiten datos personales.`}</Muted>
          <Button label="Generar reporte PDF" onPress={run(() => Print.printAsync({ html: to_report_html(incidents, 'Reporte de incidentes · La Primavera') }))} />
          <Button label="Exportar CSV" variant="secondary" onPress={run(() => deliver('incidentes.csv', 'text/csv', to_csv(incidents)))} />
          <Button label="Exportar GeoJSON" variant="secondary" onPress={run(() => deliver('incidentes.geojson', 'application/geo+json', to_geojson(incidents)))} />
        </Card>
        {message ? <Notice>{message}</Notice> : null}
      </Screen>
    </RequireRole>
  );
}
