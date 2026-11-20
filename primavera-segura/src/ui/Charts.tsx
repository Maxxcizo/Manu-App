import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radius, space } from '../theme';
import { Text } from './Text';

// Horizontal bars with the value printed (never read off the bar alone).
export function BarList({ items, caption }: { items: { label: string; value: number }[]; caption: string }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <View style={styles.list} accessibilityLabel={caption}>
      {items.map((item) => (
        <View key={item.label} style={styles.bar_row} accessibilityLabel={`${item.label}: ${item.value}`}>
          <View style={styles.bar_head}>
            <Text variant="small" numberOfLines={1} style={styles.bar_label}>
              {item.label}
            </Text>
            <Text variant="data" tone="muted">
              {item.value}
            </Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${(item.value / max) * 100}%` }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

// Vertical columns (e.g. incidents by weekday); the peak column is emphasized.
export function ColumnChart({ items, caption, height = 120 }: { items: { label: string; value: number }[]; caption: string; height?: number }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <View accessibilityLabel={`${caption}. ${items.map((i) => `${i.label} ${i.value}`).join(', ')}`}>
      <View style={[styles.columns, { height }]} aria-hidden>
        {items.map((item) => {
          const peak = item.value === max && max > 0;
          return (
            <View key={item.label} style={styles.column}>
              <Text variant="caption" tone={peak ? 'default' : 'muted'}>
                {item.value}
              </Text>
              <View style={[styles.column_bar, { height: Math.max(2, ((height - 24) * item.value) / max), backgroundColor: peak ? colors.bosque : colors.chart_muted }]} />
            </View>
          );
        })}
      </View>
      <View style={styles.axis} aria-hidden>
        {items.map((item) => (
          <Text key={item.label} variant="caption" tone="muted" style={styles.axis_label}>
            {item.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: space[3] },
  bar_row: { gap: space[1] + 2 },
  bar_head: { flexDirection: 'row', justifyContent: 'space-between', gap: space[3] },
  bar_label: { flex: 1 },
  track: { height: 8, borderRadius: radius.pill, backgroundColor: colors.surface_sunken, overflow: 'hidden' },
  fill: { height: 8, borderRadius: radius.pill, backgroundColor: colors.bosque },
  columns: { flexDirection: 'row', alignItems: 'flex-end', gap: space[2] },
  column: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: space[1] },
  column_bar: { width: '100%', maxWidth: 36, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  axis: { flexDirection: 'row', gap: space[2], borderTopWidth: 1, borderTopColor: colors.line, paddingTop: space[1] },
  axis_label: { flex: 1, textAlign: 'center' },
});
