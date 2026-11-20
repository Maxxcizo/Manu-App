import React from 'react';
import { StyleSheet, View } from 'react-native';
import { TRAILS } from '../lib/catalog';
import type { IncidentFiltersApi } from '../hooks/use_incident_filters';
import { PERIOD_PRESETS, type PeriodPreset } from '../lib/filters';
import { INCIDENT_TYPES, SEVERITIES, type IncidentTypeCode, type Severity } from '../lib/types';
import { severity as severity_tokens, space } from '../theme';
import { Button, ChoiceGroup, Select, SeverityGlyph, TextField } from '../ui';

const PERIODS = [...PERIOD_PRESETS.map((p) => ({ value: p.value as PeriodPreset, label: p.label })), { value: 'custom' as PeriodPreset, label: 'Personalizado' }];
const SEVERITY_OPTIONS: { value: Severity | 'todas'; label: string; accessory?: React.ReactNode }[] = [
  { value: 'todas', label: 'Todas' },
  ...SEVERITIES.map((s) => ({ value: s, label: severity_tokens[s].label, accessory: <SeverityGlyph level={severity_tokens[s].level} color={severity_tokens[s].text} size={12} /> })),
];

export function SearchField({ api }: { api: IncidentFiltersApi }) {
  return (
    <TextField
      label="Buscar incidentes"
      hide_label
      icon="search"
      placeholder="Buscar tipo, sendero o ID"
      value={api.filters.query}
      onChangeText={(query) => api.update({ query })}
      returnKeyType="search"
      testID="search"
    />
  );
}

// layout "toolbar": compact rows for desktop. "stacked": one control per row (sheet / side panel).
export function FilterControls({ api, layout = 'stacked', show_search = false }: { api: IncidentFiltersApi; layout?: 'toolbar' | 'stacked'; show_search?: boolean }) {
  const f = api.filters;
  const severity = (
    <ChoiceGroup label="Gravedad" options={SEVERITY_OPTIONS} value={f.severity || 'todas'} onChange={(v) => api.update({ severity: v === 'todas' ? '' : v })} />
  );
  const period = <ChoiceGroup label="Periodo" options={PERIODS} value={f.period} onChange={(period) => api.update({ period })} />;
  const selects = (
    <View style={styles.row}>
      <Select
        grow
        label="Tipo"
        placeholder="Todos los tipos"
        value={f.type ?? ''}
        options={INCIDENT_TYPES.map((t) => ({ value: t.code as IncidentTypeCode, label: t.label }))}
        onChange={(type) => api.update({ type })}
      />
      <Select grow label="Sendero" placeholder="Todos los senderos" value={f.trail} options={TRAILS.map((t) => ({ value: t, label: t }))} onChange={(trail) => api.update({ trail })} />
    </View>
  );
  const custom =
    f.period === 'custom' ? (
      <View style={styles.row}>
        <TextField grow label="Desde" placeholder="AAAA-MM-DD" hint="Formato AAAA-MM-DD" value={f.from} onChangeText={(from) => api.update({ from })} testID="from" />
        <TextField grow label="Hasta" placeholder="AAAA-MM-DD" value={f.to} onChangeText={(to) => api.update({ to })} testID="to" />
      </View>
    ) : null;

  if (layout === 'toolbar') {
    return (
      <View style={styles.toolbar}>
        <View style={styles.row}>
          {show_search ? (
            <View style={{ flex: 2, minWidth: 260 }}>
              <SearchField api={api} />
            </View>
          ) : null}
          <View style={[styles.row, { flex: 2 }]}>{selects}</View>
        </View>
        <View style={[styles.row, styles.toolbar_chips]}>
          <View style={{ flexShrink: 1 }}>{severity}</View>
          <View style={{ flexShrink: 1 }}>{period}</View>
          {api.active_count > 0 ? (
            <View style={styles.clear}>
              <Button label="Quitar filtros" variant="tertiary" icon="close" onPress={api.reset} compact />
            </View>
          ) : null}
        </View>
        {custom}
      </View>
    );
  }
  return (
    <View style={styles.stacked}>
      {show_search ? <SearchField api={api} /> : null}
      {severity}
      {period}
      {custom}
      {selects}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space[3], alignItems: 'flex-end' },
  toolbar: { gap: space[4] },
  toolbar_chips: { columnGap: space[8], alignItems: 'flex-start' },
  clear: { alignSelf: 'flex-end' },
  stacked: { gap: space[5] },
});
