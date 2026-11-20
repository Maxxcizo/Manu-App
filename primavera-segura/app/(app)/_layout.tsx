import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, Platform, View } from 'react-native';
import { AppShell } from '../../src/components/AppShell';
import { useApp } from '../../src/data/app_context';
import { useReducedMotion } from '../../src/hooks/use_reduced_motion';
import { colors } from '../../src/theme';

// Every signed-in screen lives in one Stack wrapped by the navigation shell. Using a Stack (not Tabs)
// keeps all routes reachable, gives Android a real back stack, and lets the shell adapt per breakpoint.
export default function AppLayout() {
  const { user, ready } = useApp();
  const reduced = useReducedMotion();
  if (ready && !user) return <Redirect href="/login" />;
  if (!user)
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.canvas }}>
        <ActivityIndicator color={colors.bosque} />
      </View>
    );
  const native = Platform.OS !== 'web' && !reduced;
  return (
    <AppShell role={user.role}>
      <Stack screenOptions={{ headerShown: false, animation: native ? 'fade' : 'none', contentStyle: { backgroundColor: colors.canvas } }}>
        <Stack.Screen name="incidente/[id]" options={{ animation: native ? 'slide_from_right' : 'none' }} />
        <Stack.Screen name="registrar" options={{ animation: native ? 'slide_from_bottom' : 'none' }} />
      </Stack>
    </AppShell>
  );
}
