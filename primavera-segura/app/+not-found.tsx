import { useRouter } from 'expo-router';
import { Button, EmptyState, Page } from '../src/ui';

export default function NotFound() {
  const router = useRouter();
  return (
    <Page title="Página no encontrada">
      <EmptyState
        icon="compass-outline"
        title="Esta dirección no existe"
        body="Puede que el enlace esté incompleto o que la sección haya cambiado de lugar."
        action={<Button label="Ir al inicio" onPress={() => router.replace('/')} />}
      />
    </Page>
  );
}
