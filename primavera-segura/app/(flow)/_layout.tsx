import { Redirect, Stack } from 'expo-router';
import { useApp } from '../../src/data/app_context';
import { colors } from '../../src/theme';

// Screens opened on top of the tabs (form, detail, comparison). Same session guard as (app).
export default function FlowLayout() {
  const { user, ready } = useApp();
  if (ready && !user) return <Redirect href="/login" />;
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
        headerBackTitle: 'Atrás',
      }}
    >
      <Stack.Screen name="registrar" options={{ title: 'Registrar incidente' }} />
      <Stack.Screen name="comparacion" options={{ title: 'Comparación' }} />
      <Stack.Screen name="incidente/[id]" options={{ title: 'Incidente' }} />
    </Stack>
  );
}
