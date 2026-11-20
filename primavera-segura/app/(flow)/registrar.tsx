import { useRouter } from 'expo-router';
import React from 'react';
import { IncidentForm } from '../../src/components/IncidentForm';
import { Button, Muted, Screen } from '../../src/components/ui';
import { useApp } from '../../src/data/app_context';

export default function Registrar() {
  const { repo, refresh } = useApp();
  const router = useRouter();
  return (
    <Screen embedded title="Registrar incidente" subtitle="Tipo, fecha, gravedad y ubicación">
      <IncidentForm
        onSubmit={async (incident) => {
          await repo.create_incident(incident);
          await refresh();
        }}
      />
      <Muted>No captures nombres, teléfonos ni datos médicos de pacientes: la aplicación no los almacena.</Muted>
      <Button label="Ver incidentes" variant="secondary" onPress={() => router.navigate('/incidentes')} />
    </Screen>
  );
}
