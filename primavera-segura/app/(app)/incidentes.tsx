import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { FilterControls, SearchField } from '../../src/components/FilterControls';
import { IncidentDetail } from '../../src/components/IncidentDetail';
import { IncidentListItem } from '../../src/components/IncidentListItem';
import { SyntheticBanner } from '../../src/components/SyntheticBanner';
import { useApp } from '../../src/data/app_context';
import { useBreakpoint } from '../../src/hooks/use_breakpoint';
import { useIncidentFilters } from '../../src/hooks/use_incident_filters';
import type { SortKey } from '../../src/lib/filters';
import { format_date, type_label } from '../../src/lib/labels';
import type { Incident } from '../../src/lib/types';
import { colors, space } from '../../src/theme';
import { Banner, Button, DataTable, EmptyState, IconButton, LoadingList, Page, Pagination, Panel, SeverityBadge, Sheet, StatusBadge, Text, type Column } from '../../src/ui';

export default function Incidentes() {
  const { incidents, loading, error, refresh } = useApp();
  const router = useRouter();
  const { is_phone, is_desktop, width } = useBreakpoint();
  const api = useIncidentFilters(incidents, { page_size: is_phone ? 15 : 20 });
  const [filters_open, set_filters_open] = useState(false);
  const [selected_id, set_selected_id] = useState<string | null>(null);
  const master_detail = width >= 1360;
  const selected = master_detail ? api.filtered.find((i) => i.id === selected_id) ?? null : null;
  const open = (i: Incident) => (master_detail ? set_selected_id(i.id) : router.navigate({ pathname: '/incidente/[id]', params: { id: i.id } }));

  const columns: Column<Incident, SortKey>[] = [
    { key: 'occurred_on', title: 'Fecha', width: 108, sortable: true, render: (i) => <Text variant="data">{format_date(i.occurred_on)}</Text> },
    { key: 'type', title: 'Tipo', flex: 1.4, sortable: true, render: (i) => <Text variant="small_strong" numberOfLines={2}>{type_label(i.type)}</Text> },
    { key: 'severity', title: 'Gravedad', width: 104, sortable: true, render: (i) => <SeverityBadge value={i.severity} size="sm" /> },
    { key: 'trail', title: 'Sendero', flex: 1.2, sortable: true, render: (i) => <Text variant="small" numberOfLines={2}>{i.trail ?? 'Sin sendero'}</Text> },
    { key: 'status', title: 'Estado', width: 178, sortable: true, render: (i) => <StatusBadge value={i.status} /> },
  ];

  const empty = (
    <EmptyState
      title={incidents.length ? 'Ningún incidente coincide' : 'Aún no hay incidentes'}
      body={incidents.length ? 'Cambia la búsqueda o quita algún filtro.' : 'Los incidentes registrados aparecerán aquí.'}
      action={api.active_count || api.filters.query ? <Button label="Quitar filtros" variant="secondary" onPress={api.reset} /> : undefined}
    />
  );

  const results = loading ? (
    <View style={{ padding: space[4] }}>
      <LoadingList rows={6} />
    </View>
  ) : api.paged.total === 0 ? (
    empty
  ) : is_phone ? (
    api.paged.items.map((i) => <IncidentListItem key={i.id} incident={i} onPress={() => open(i)} />)
  ) : (
    <DataTable
      caption="Incidentes"
      columns={columns}
      rows={api.paged.items}
      row_key={(i) => i.id}
      on_row_press={open}
      selected_key={selected?.id}
      sort={api.sort}
      on_sort={api.toggle_sort}
    />
  );

  return (
    <Page
      title="Incidentes"
      description={`${api.filtered.length} de ${incidents.length} incidentes${api.active_count || api.filters.query ? ' con los filtros actuales' : ''}.`}
      actions={is_desktop ? <Button label="Registrar incidente" icon="add" onPress={() => router.navigate('/registrar')} /> : undefined}
    >
      <SyntheticBanner />
      {error ? (
        <Banner tone="danger" action={<Button label="Reintentar" variant="secondary" compact onPress={refresh} />}>
          {error}
        </Banner>
      ) : null}
      {is_phone ? (
        <View style={styles.phone_tools}>
          <View style={{ flex: 1 }}>
            <SearchField api={api} />
          </View>
          <IconButton icon="options-outline" label={api.active_count ? `Filtros, ${api.active_count} ${api.active_count === 1 ? 'activo' : 'activos'}` : 'Filtros'} selected={api.active_count > 0} onPress={() => set_filters_open(true)} />
        </View>
      ) : (
        <FilterControls api={api} layout="toolbar" show_search />
      )}
      <View style={[styles.split, !master_detail && styles.stack]}>
        <Panel padded={false} style={styles.results}>
          {results}
          {api.paged.total > 0 ? <Pagination {...api.paged} on_change={api.set_page} /> : null}
        </Panel>
        {master_detail ? (
          <View style={styles.detail}>
            {selected ? (
              <ScrollView contentContainerStyle={{ padding: space[5] }}>
                <IncidentDetail incident={selected} />
              </ScrollView>
            ) : (
              <EmptyState icon="hand-left-outline" title="Selecciona un incidente" body="Su ubicación, datos y acciones aparecen aquí." />
            )}
          </View>
        ) : null}
      </View>
      <Sheet
        visible={filters_open}
        title="Filtrar incidentes"
        onClose={() => set_filters_open(false)}
        footer={
          <>
            <Button label="Quitar filtros" variant="tertiary" onPress={api.reset} />
            <Button label={`Ver ${api.filtered.length} resultados`} onPress={() => set_filters_open(false)} />
          </>
        }
      >
        <FilterControls api={api} />
      </Sheet>
    </Page>
  );
}

const styles = StyleSheet.create({
  phone_tools: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  split: { flexDirection: 'row', gap: space[6], alignItems: 'flex-start' },
  stack: { flexDirection: 'column', alignItems: 'stretch' },
  results: { flex: 1, minWidth: 0 },
  detail: {
    width: 380,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    minHeight: 420,
  },
});
