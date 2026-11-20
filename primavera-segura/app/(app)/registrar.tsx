import { useRouter } from 'expo-router';
import React from 'react';
import { IncidentForm } from '../../src/components/IncidentForm';
import { useApp } from '../../src/data/app_context';
import { useBreakpoint } from '../../src/hooks/use_breakpoint';
import { PageHeader, useToast } from '../../src/ui';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../src/theme';

export default function Registrar() {
  const { repo, refresh } = useApp();
  const router = useRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { is_phone } = useBreakpoint();
  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas, paddingTop: is_phone ? insets.top : 0 }}>
      <IncidentForm
        header={<PageHeader title="Registrar incidente" description="Tipo, gravedad, fecha y ubicación. Coordinación lo valida después." back="/home" />}
        on_view_list={() => router.navigate('/incidentes')}
        onSubmit={async (incident) => {
          await repo.create_incident(incident);
          await refresh();
          toast.show('Incidente registrado');
        }}
      />
    </View>
  );
}
