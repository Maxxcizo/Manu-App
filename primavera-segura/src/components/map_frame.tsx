import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, StyleSheet, View, type ViewStyle } from 'react-native';
import type { MapData } from '../lib/map_html';
import { colors, radius, space } from '../theme';
import { Button, Text } from '../ui';

export interface IncidentMapProps extends MapData {
  mode?: 'view' | 'pick';
  on_select?: (id: string) => void;
  on_pick?: (point: { lat: number; lng: number }) => void;
  label?: string;
  height?: number; // fixed height; omit to fill the parent
  rounded?: boolean;
  style?: ViewStyle;
}

// Shared chrome for the native WebView and web iframe maps: container, loading and error states.
export function MapFrame({
  children,
  status,
  on_retry,
  height,
  rounded = true,
  style,
  label,
}: IncidentMapProps & { children: React.ReactNode; status: 'loading' | 'ready' | 'error'; on_retry: () => void }) {
  return (
    <View
      style={[styles.frame, height ? { height } : styles.fill, rounded && styles.rounded, style]}
      accessibilityLabel={label ?? 'Mapa de incidentes'}
    >
      {children}
      {status === 'loading' ? (
        <View style={[StyleSheet.absoluteFill, styles.overlay]} role="progressbar" accessibilityLabel="Cargando mapa">
          <ActivityIndicator color={colors.bosque} />
          <Text variant="small" tone="muted">
            Cargando mapa
          </Text>
        </View>
      ) : null}
      {status === 'error' ? (
        <View style={[StyleSheet.absoluteFill, styles.overlay]} role="alert">
          <Ionicons name="cloud-offline-outline" size={28} color={colors.ink_muted} aria-hidden />
          <Text variant="body_strong" align="center">
            No se pudo cargar el mapa
          </Text>
          <Text variant="small" tone="muted" align="center" style={{ maxWidth: 280 }}>
            Revisa tu conexión. Los incidentes siguen disponibles en la lista.
          </Text>
          <Button label="Reintentar" variant="secondary" icon="refresh" onPress={on_retry} compact />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { backgroundColor: colors.map_ground, overflow: 'hidden' },
  fill: { flex: 1 },
  rounded: { borderRadius: radius.panel, borderWidth: 1, borderColor: colors.line },
  overlay: { alignItems: 'center', justifyContent: 'center', gap: space[2], backgroundColor: colors.map_overlay, padding: space[6] },
});
