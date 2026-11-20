import React, { useState } from 'react';
import { INCIDENT_TYPES, SEVERITIES, type NewIncident } from '../lib/types';
import { validate_incident } from '../lib/validation';
import { Button, Card, Chip, Field, Muted, Notice, Row } from './ui';

export function IncidentForm({
  onSubmit,
  today = new Date(),
}: {
  onSubmit: (incident: NewIncident) => Promise<void> | void;
  today?: Date;
}) {
  const [values, set_values] = useState({ type: '', severity: '', occurred_on: today.toISOString().slice(0, 10), latitude: '', longitude: '' });
  const [errors, set_errors] = useState<Record<string, string>>({});
  const [saved, set_saved] = useState(false);
  const [failure, set_failure] = useState<string | null>(null);
  const set = (k: keyof typeof values) => (v: string) => set_values((p) => ({ ...p, [k]: v }));

  async function submit() {
    set_saved(false);
    set_failure(null);
    const result = validate_incident(values, today);
    set_errors(result.errors);
    if (!result.valid) return;
    try {
      await onSubmit({ ...values, latitude: Number(values.latitude), longitude: Number(values.longitude) });
      set_saved(true);
    } catch (e) {
      set_failure((e as Error).message);
    }
  }

  return (
    <Card>
      <Muted>Tipo de incidente</Muted>
      <Row>
        {INCIDENT_TYPES.map((t) => (
          <Chip key={t.code} label={t.label} active={values.type === t.code} onPress={() => set('type')(t.code)} />
        ))}
      </Row>
      {errors.type ? <Notice tone="danger"><Muted>{errors.type}</Muted></Notice> : null}
      <Muted>Gravedad</Muted>
      <Row>
        {SEVERITIES.map((s) => (
          <Chip key={s} label={s} active={values.severity === s} onPress={() => set('severity')(s)} />
        ))}
      </Row>
      {errors.severity ? <Notice tone="danger"><Muted>{errors.severity}</Muted></Notice> : null}
      <Field label="Fecha (AAAA-MM-DD)" value={values.occurred_on} onChangeText={set('occurred_on')} error={errors.date} testID="input-date" />
      <Field label="Latitud" value={values.latitude} onChangeText={set('latitude')} keyboardType="numeric" testID="input-latitude" />
      <Field label="Longitud" value={values.longitude} onChangeText={set('longitude')} keyboardType="numeric" error={errors.location} testID="input-longitude" />
      {failure ? <Notice tone="danger">{failure}</Notice> : null}
      {saved ? <Notice tone="success">Incidente guardado.</Notice> : null}
      <Button label="Registrar incidente" onPress={submit} />
    </Card>
  );
}
