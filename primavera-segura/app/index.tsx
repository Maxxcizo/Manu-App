import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useApp } from '../src/data/app_context';
import { colors } from '../src/theme';

export default function Index() {
  const { ready, user } = useApp();
  if (!ready)
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.canvas }}>
        <ActivityIndicator color={colors.bosque} />
      </View>
    );
  return <Redirect href={user ? '/home' : '/login'} />;
}
