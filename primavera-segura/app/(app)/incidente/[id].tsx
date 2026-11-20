import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { IncidentDetail } from '../../../src/components/IncidentDetail';
import { useApp } from '../../../src/data/app_context';
import { useBreakpoint } from '../../../src/hooks/use_breakpoint';
import { format_date, type_label } from '../../../src/lib/labels';
import { Button, Columns, EmptyState, LoadingList, Page, Panel } from '../../../src/ui';
import { IncidentMap } from '../../../src/components/IncidentMap';

export default function IncidentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { incidents, loading } = useApp();
  const router = useRouter();
  const { is_desktop } = useBreakpoint();
  const incident = incidents.find((i) => i.id === id);
  const list = useMemo(() => (incident ? [incident] : []), [incident]);
  const focus = useMemo(() => (incident ? { lat: incident.latitude, lng: incident.longitude } : null), [incident]);

  if (loading)
    return (
      <Page title="Incidente" back="/incidentes">
        <LoadingList rows={3} />
      </Page>
    );

  if (!incident)
    return (
      <Page title="Incidente" back="/incidentes">
        <EmptyState
          icon="help-circle-outline"
          title="No encontramos este incidente"
          body="Puede que el enlace sea incorrecto o que el registro ya no esté disponible para tu cuenta."
          action={<Button label="Ir a incidentes" onPress={() => router.replace('/incidentes')} />}
        />
      </Page>
    );

  return (
    <Page title={type_label(incident.type)} description={`${incident.trail ?? 'Sin sendero'}, ${format_date(incident.occurred_on)}`} back="/incidentes">
      {is_desktop ? (
        <Columns ratio={[1, 1]}>
          <Panel>
            <IncidentDetail incident={incident} show_map={false} heading={false} />
          </Panel>
          <IncidentMap incidents={list} zones={[]} show_incidents show_zones={false} selected_id={incident.id} focus={focus} height={460} label={`Ubicación de ${type_label(incident.type)}`} />
        </Columns>
      ) : (
        <IncidentDetail incident={incident} heading={false} />
      )}
    </Page>
  );
}
