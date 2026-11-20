import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBreakpoint } from '../hooks/use_breakpoint';
import { TRAILS } from '../lib/catalog';
import { iso_day } from '../lib/filters';
import { INCIDENT_TYPES, SEVERITIES, type NewIncident } from '../lib/types';
import { validate_incident } from '../lib/validation';
import { colors, radius, severity, space } from '../theme';
import { Banner, Button, Chip, Columns, Select, SeverityGlyph, Text, TextField } from '../ui';
import { IncidentMap } from './IncidentMap';

type Values = { type: string; severity: string; occurred_on: string; latitude: string; longitude: string; trail: string };

// Field registration. Types and severities stay visible as large chips (one tap, usable with gloves);
// location can be tapped on the map or typed. The submit bar is fixed at the bottom of the screen.
export function IncidentForm({
  onSubmit,
  today = new Date(),
  header,
  on_view_list,
}: {
  onSubmit: (incident: NewIncident) => Promise<void> | void;
  today?: Date;
  header?: React.ReactNode;
  on_view_list?: () => void;
}) {
  const { is_phone, gutter } = useBreakpoint();
  const insets = useSafeAreaInsets();
  const blank: Values = { type: '', severity: '', occurred_on: iso_day(today), latitude: '', longitude: '', trail: '' };
  const [values, set_values] = useState<Values>(blank);
  const [errors, set_errors] = useState<Record<string, string>>({});
  const [saving, set_saving] = useState(false);
  const [saved, set_saved] = useState(false);
  const [failure, set_failure] = useState<string | null>(null);
  const set = (k: keyof Values) => (v: string) => set_values((p) => ({ ...p, [k]: v }));

  const pick = useMemo(() => {
    const lat = Number(values.latitude);
    const lng = Number(values.longitude);
    return values.latitude && values.longitude && Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  }, [values.latitude, values.longitude]);

  async function submit() {
    set_failure(null);
    const result = validate_incident(values, today);
    set_errors(result.errors);
    if (!result.valid) return;
    set_saving(true);
    try {
      await onSubmit({
        type: values.type,
        severity: values.severity,
        occurred_on: values.occurred_on,
        latitude: Number(values.latitude),
        longitude: Number(values.longitude),
        trail: values.trail || null,
      });
      set_saved(true);
    } catch (e) {
      set_failure((e as Error).message);
    } finally {
      set_saving(false);
    }
  }

  if (saved) {
    return (
      <ScrollView contentContainerStyle={[styles.scroll, { paddingHorizontal: gutter }]}>
        {header}
        <View style={styles.success} role="status">
          <View style={styles.success_icon}>
            <Ionicons name="checkmark" size={32} color={colors.ink_inverse} aria-hidden />
          </View>
          <Text variant="heading" heading={2} align="center">
            Incidente registrado
          </Text>
          <Text tone="muted" align="center" style={styles.measure}>
            Quedó pendiente de validar por coordinación y ya aparece en el mapa y en la lista.
          </Text>
          <View style={styles.success_actions}>
            <Button
              label="Registrar otro"
              icon="add"
              onPress={() => {
                set_values(blank);
                set_errors({});
                set_saved(false);
              }}
            />
            {on_view_list ? <Button label="Ver incidentes" variant="secondary" onPress={on_view_list} /> : null}
          </View>
        </View>
      </ScrollView>
    );
  }

  const what = (
    <View style={styles.section}>
      <Text variant="subheading" heading={2}>
        Qué pasó
      </Text>
      <View style={styles.group} role="radiogroup" aria-label="Tipo de incidente">
        <Text variant="small_strong">
          Tipo de incidente<Text variant="small" tone="muted"> (obligatorio)</Text>
        </Text>
        <View style={styles.chips}>
          {INCIDENT_TYPES.map((t) => (
            <Chip key={t.code} label={t.label} selected={values.type === t.code} onPress={() => set('type')(t.code)} />
          ))}
        </View>
        {errors.type ? <FieldError message={errors.type} /> : null}
      </View>
      <View style={styles.group} role="radiogroup" aria-label="Gravedad">
        <Text variant="small_strong">
          Gravedad<Text variant="small" tone="muted"> (obligatorio)</Text>
        </Text>
        <View style={styles.chips}>
          {SEVERITIES.map((s) => (
            <Chip
              key={s}
              label={severity[s].label}
              selected={values.severity === s}
              onPress={() => set('severity')(s)}
              accessory={<SeverityGlyph level={severity[s].level} color={values.severity === s ? colors.ink_inverse : severity[s].text} size={14} />}
            />
          ))}
        </View>
        {errors.severity ? <FieldError message={errors.severity} /> : null}
      </View>
      <View style={styles.group}>
        <TextField
          label="Fecha"
          required
          hint="Formato AAAA-MM-DD. No puede ser una fecha futura."
          value={values.occurred_on}
          onChangeText={set('occurred_on')}
          error={errors.date}
          testID="input-date"
          inputMode="numeric"
        />
        <View style={styles.chips}>
          <Chip label="Hoy" selected={values.occurred_on === iso_day(today)} onPress={() => set('occurred_on')(iso_day(today))} />
          <Chip
            label="Ayer"
            selected={values.occurred_on === iso_day(new Date(today.getTime() - 86400000))}
            onPress={() => set('occurred_on')(iso_day(new Date(today.getTime() - 86400000)))}
          />
        </View>
      </View>
    </View>
  );

  const where = (
    <View style={styles.section}>
      <Text variant="subheading" heading={2}>
        Dónde
      </Text>
      <Text variant="small" tone="muted">
        Toca el mapa para marcar el punto o escribe las coordenadas.
      </Text>
      <IncidentMap
        mode="pick"
        incidents={[]}
        zones={[]}
        show_incidents={false}
        show_zones={false}
        pick={pick}
        on_pick={(p) => set_values((v) => ({ ...v, latitude: String(p.lat), longitude: String(p.lng) }))}
        height={is_phone ? 240 : 320}
        label="Mapa para elegir la ubicación del incidente"
      />
      <View style={styles.coords}>
        <TextField grow label="Latitud" required invalid={!!errors.location} value={values.latitude} onChangeText={set('latitude')} keyboardType="numeric" placeholder="Ej. 20.68000" testID="input-latitude" />
        <TextField grow label="Longitud" required value={values.longitude} onChangeText={set('longitude')} keyboardType="numeric" placeholder="Ej. -103.55000" testID="input-longitude" error={errors.location} />
      </View>
      <Select label="Sendero" placeholder="Sin sendero" value={values.trail} options={TRAILS.map((t) => ({ value: t, label: t }))} onChange={set('trail')} />
    </View>
  );

  return (
    <View style={styles.fill}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingHorizontal: gutter }]} keyboardShouldPersistTaps="handled">
        {header}
        <Columns ratio={[1, 1.1]} gap={space[8]}>
          {what}
          {where}
        </Columns>
        <Text variant="small" tone="muted" style={styles.measure}>
          No escribas nombres, teléfonos ni datos médicos de las personas atendidas. La aplicación no los guarda.
        </Text>
        {failure ? <Banner tone="danger" title="No se pudo registrar">{failure}</Banner> : null}
      </ScrollView>
      <View style={[styles.footer, { paddingHorizontal: gutter, paddingBottom: space[3] + insets.bottom }]}>
        <View style={[styles.footer_inner, is_phone && styles.footer_phone]}>
          {Object.keys(errors).length > 0 ? (
            <Text variant="small" tone="danger" style={styles.footer_note} accessibilityLiveRegion="polite">
              Revisa los campos marcados.
            </Text>
          ) : null}
          <Button label="Registrar incidente" icon="checkmark" onPress={submit} loading={saving} full_width />
        </View>
      </View>
    </View>
  );
}

function FieldError({ message }: { message: string }) {
  return (
    <View style={styles.error} accessibilityLiveRegion="polite">
      <Ionicons name="alert-circle" size={16} color={colors.danger_text} aria-hidden />
      <Text variant="small" tone="danger">
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.canvas },
  scroll: { gap: space[6], paddingBottom: space[8], width: '100%', maxWidth: 1280, alignSelf: 'center' },
  section: { gap: space[4] },
  group: { gap: space[2] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2] },
  coords: { flexDirection: 'row', flexWrap: 'wrap', gap: space[3] },
  error: { flexDirection: 'row', gap: space[1], alignItems: 'center' },
  measure: { maxWidth: 640 },
  footer: { borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.surface, paddingVertical: space[3] },
  footer_inner: { width: '100%', maxWidth: 1280, alignSelf: 'center', flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: space[4] },
  footer_phone: { flexDirection: 'column', alignItems: 'stretch', gap: space[2] },
  footer_note: { flexShrink: 1 },
  success: { alignItems: 'center', gap: space[4], paddingVertical: space[12] },
  success_icon: { width: 64, height: 64, borderRadius: radius.pill, backgroundColor: colors.bosque, alignItems: 'center', justifyContent: 'center' },
  success_actions: { flexDirection: 'row', gap: space[3], flexWrap: 'wrap', justifyContent: 'center' },
});
