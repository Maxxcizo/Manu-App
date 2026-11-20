import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FilterControls } from '../../src/components/FilterControls';
import { IncidentDetail } from '../../src/components/IncidentDetail';
import { IncidentMap } from '../../src/components/IncidentMap';
import { MapLegend } from '../../src/components/MapLegend';
import { SyntheticBanner } from '../../src/components/SyntheticBanner';
import { useApp } from '../../src/data/app_context';
import { useBreakpoint } from '../../src/hooks/use_breakpoint';
import { useIncidentFilters } from '../../src/hooks/use_incident_filters';
import { format_date, type_label } from '../../src/lib/labels';
import { critical_zones } from '../../src/lib/zones';
import { colors, radius, shadow, space } from '../../src/theme';
import { Button, Chip, IconButton, Divider, Sheet, SeverityBadge, Text } from '../../src/ui';

export default function Mapa() {
  const { incidents } = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { is_phone, gutter } = useBreakpoint();
  const api = useIncidentFilters(incidents);
  const [show_incidents, set_show_incidents] = useState(true);
  const [show_zones, set_show_zones] = useState(false);
  const [selected_id, set_selected_id] = useState<string | null>(null);
  const [sheet, set_sheet] = useState<'filters' | 'legend' | null>(null);
  const zones = useMemo(() => critical_zones(api.filtered), [api.filtered]);
  const selected = api.filtered.find((i) => i.id === selected_id) ?? null;
  const on_select = useCallback((id: string) => set_selected_id(id), []);

  const layers = (
    <View style={styles.layers} role="group" aria-label="Capas del mapa">
      <Chip label="Incidentes" selected={show_incidents} onPress={() => set_show_incidents((v) => !v)} count={api.filtered.length} />
      <Chip label="Zonas críticas" selected={show_zones} onPress={() => set_show_zones((v) => !v)} />
    </View>
  );

  const map = (
    <IncidentMap
      incidents={api.filtered}
      zones={zones}
      show_incidents={show_incidents}
      show_zones={show_zones}
      selected_id={selected_id}
      on_select={on_select}
      rounded={!is_phone}
      label="Mapa de incidentes y zonas críticas"
    />
  );

  if (is_phone) {
    return (
      <View style={[styles.fill, { paddingTop: insets.top }]}>
        <View style={[styles.phone_head, { paddingHorizontal: gutter }]}>
          <Text variant="heading" heading={1} style={styles.fill}>
            Mapa
          </Text>
          <IconButton icon="information-circle-outline" label="Leyenda del mapa" onPress={() => set_sheet('legend')} />
          <IconButton icon="options-outline" label={api.active_count ? `Filtros, ${api.active_count} ${api.active_count === 1 ? 'activo' : 'activos'}` : 'Filtros'} onPress={() => set_sheet('filters')} selected={api.active_count > 0} />
        </View>
        <View style={[styles.phone_layers, { paddingHorizontal: gutter }]}>{layers}</View>
        <View style={styles.fill}>
          {map}
          {selected ? (
            <View style={[styles.selected_card, shadow.overlay, { left: gutter, right: gutter }]} role="dialog" aria-label="Incidente seleccionado">
              <View style={styles.selected_head}>
                <View style={styles.fill}>
                  <Text variant="body_strong">{type_label(selected.type)}</Text>
                  <Text variant="small" tone="muted">
                    {`${selected.trail ?? 'Sin sendero'}, ${format_date(selected.occurred_on)}`}
                  </Text>
                </View>
                <IconButton icon="close" label="Quitar selección" onPress={() => set_selected_id(null)} />
              </View>
              <View style={styles.selected_row}>
                <SeverityBadge value={selected.severity} />
                <Button label="Ver detalle" variant="secondary" compact onPress={() => router.navigate({ pathname: '/incidente/[id]', params: { id: selected.id } })} />
              </View>
            </View>
          ) : null}
        </View>
        <Sheet visible={sheet === 'filters'} title="Filtrar el mapa" onClose={() => set_sheet(null)} footer={<><Button label="Quitar filtros" variant="tertiary" onPress={api.reset} /><Button label={`Ver ${api.filtered.length} incidentes`} onPress={() => set_sheet(null)} /></>}>
          <FilterControls api={api} />
        </Sheet>
        <Sheet visible={sheet === 'legend'} title="Leyenda" onClose={() => set_sheet(null)}>
          <MapLegend />
          <Text variant="small" tone="muted">
            El tamaño del punto también indica la gravedad. Para leer los incidentes uno por uno usa la pestaña Incidentes.
          </Text>
        </Sheet>
      </View>
    );
  }

  return (
    <View style={[styles.fill, styles.desktop]}>
      <View style={[styles.fill, { padding: gutter, paddingRight: 0, gap: space[4] }]}>
        <View style={styles.desktop_head}>
          <View style={styles.fill}>
            <Text variant="title" heading={1}>
              Mapa
            </Text>
            <Text tone="muted">Selecciona un punto para ver su detalle. El tamaño y el color indican la gravedad.</Text>
          </View>
          {layers}
        </View>
        {map}
      </View>
      <ScrollView style={styles.side} contentContainerStyle={[styles.side_body, { padding: gutter }]}>
        <SyntheticBanner />
        {selected ? (
          <View style={styles.section}>
            <View style={styles.selected_head}>
              <Text variant="small_strong" tone="muted" style={styles.fill}>
                Incidente seleccionado
              </Text>
              <IconButton icon="close" label="Quitar selección" onPress={() => set_selected_id(null)} />
            </View>
            <IncidentDetail incident={selected} show_map={false} />
          </View>
        ) : (
          <View style={styles.hint}>
            <Text variant="small" tone="muted">
              {`${api.filtered.length} incidentes en el mapa. Selecciona uno para ver fecha, sendero y acciones.`}
            </Text>
            <Button label="Ver como lista" variant="tertiary" compact icon="list-outline" onPress={() => router.navigate('/incidentes')} />
          </View>
        )}
        <Divider />
        <View style={styles.section}>
          <Text variant="subheading" heading={2}>
            Filtros
          </Text>
          <FilterControls api={api} />
          {api.active_count ? <Button label="Quitar filtros" variant="tertiary" icon="close" compact onPress={api.reset} /> : null}
        </View>
        <Divider />
        <View style={styles.section}>
          <Text variant="subheading" heading={2}>
            Leyenda
          </Text>
          <MapLegend />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, minWidth: 0 },
  desktop: { flexDirection: 'row' },
  desktop_head: { flexDirection: 'row', alignItems: 'flex-end', gap: space[4], flexWrap: 'wrap', paddingTop: space[4] },
  side: { width: 380, flexGrow: 0, borderLeftWidth: 1, borderLeftColor: colors.line, backgroundColor: colors.surface },
  side_body: { gap: space[5] },
  section: { gap: space[4] },
  hint: { gap: space[2], alignItems: 'flex-start' },
  layers: { flexDirection: 'row', gap: space[2], flexWrap: 'wrap' },
  phone_head: { flexDirection: 'row', alignItems: 'center', paddingTop: space[2] },
  phone_layers: { paddingVertical: space[3] },
  selected_card: {
    position: 'absolute',
    bottom: space[4],
    backgroundColor: colors.surface,
    borderRadius: radius.panel,
    padding: space[4],
    paddingRight: space[2],
    gap: space[3],
  },
  selected_head: { flexDirection: 'row', alignItems: 'flex-start', gap: space[2] },
  selected_row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space[3], paddingRight: space[2] },
});
