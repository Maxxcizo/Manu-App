import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useApp } from '../src/data/app_context';

export default function Index() {
  const { ready, user } = useApp();
  if (!ready)
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  return <Redirect href={user ? '/home' : '/login'} />;
}
