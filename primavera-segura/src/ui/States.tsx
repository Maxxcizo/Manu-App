import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Animated, Platform, StyleSheet, View, type DimensionValue } from 'react-native';
import { useReducedMotion } from '../hooks/use_reduced_motion';
import { colors, radius, space } from '../theme';
import { Text } from './Text';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export function EmptyState({ icon = 'search-outline', title, body, action }: { icon?: IconName; title: string; body?: string; action?: React.ReactNode }) {
  return (
    <View style={styles.empty} role="status">
      <View style={styles.empty_icon}>
        <Ionicons name={icon} size={24} color={colors.bosque} aria-hidden />
      </View>
      <Text variant="subheading" align="center">
        {title}
      </Text>
      {body ? (
        <Text tone="muted" align="center" style={styles.measure}>
          {body}
        </Text>
      ) : null}
      {action}
    </View>
  );
}

export function Skeleton({ width = '100%', height = 16, radius_value = 6 }: { width?: DimensionValue; height?: number; radius_value?: number }) {
  const reduced = useReducedMotion();
  const [pulse] = useState(() => new Animated.Value(0.55)); // stable animated value, not a ref
  useEffect(() => {
    if (reduced) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(pulse, { toValue: 0.55, duration: 700, useNativeDriver: Platform.OS !== 'web' }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, reduced]);
  return <Animated.View aria-hidden style={{ width, height, borderRadius: radius_value, backgroundColor: colors.surface_sunken, opacity: pulse }} />;
}

export function LoadingList({ rows = 5 }: { rows?: number }) {
  return (
    <View style={styles.loading} accessibilityLabel="Cargando" role="progressbar">
      {Array.from({ length: rows }, (_, i) => (
        <View key={i} style={styles.loading_row}>
          <Skeleton width={72} height={22} radius_value={radius.pill} />
          <View style={{ flex: 1, gap: space[2] }}>
            <Skeleton width="60%" />
            <Skeleton width="35%" height={12} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: 'center', gap: space[3], paddingVertical: space[10], paddingHorizontal: space[6] },
  empty_icon: { width: 48, height: 48, borderRadius: radius.pill, backgroundColor: colors.bosque_tint, alignItems: 'center', justifyContent: 'center' },
  measure: { maxWidth: 420 },
  loading: { gap: space[1] },
  loading_row: { flexDirection: 'row', alignItems: 'center', gap: space[4], paddingVertical: space[3] },
});
