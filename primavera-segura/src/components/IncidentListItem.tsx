import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { format_date, type_label } from '../lib/labels';
import type { Incident } from '../lib/types';
import { colors, space } from '../theme';
import { SeverityBadge, StatusBadge, Text } from '../ui';
import { focus_ring, web_pointer, type PressState } from '../ui/interaction';

export function IncidentListItem({ incident, onPress, selected }: { incident: Incident; onPress: () => void; selected?: boolean }) {
  const title = type_label(incident.type);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${incident.trail ?? 'sin sendero'}, ${format_date(incident.occurred_on)}, gravedad ${incident.severity}`}
      accessibilityState={selected === undefined ? undefined : { selected }}
      onPress={onPress}
      android_ripple={{ color: colors.ripple }}
      style={(state) => {
        const s = state as PressState;
        return [styles.row, (s.hovered || s.pressed) && styles.hover, selected && styles.selected, web_pointer, focus_ring(s, -2)] as ViewStyle[];
      }}
    >
      <View style={styles.main}>
        <View style={styles.line}>
          <Text variant="body_strong" style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text variant="data" tone="muted">
            {format_date(incident.occurred_on, false)}
          </Text>
        </View>
        <View style={styles.line}>
          <View style={styles.meta}>
            <Ionicons name="trail-sign-outline" size={14} color={colors.ink_muted} aria-hidden />
            <Text variant="small" tone="muted" numberOfLines={1}>
              {incident.trail ?? 'Sin sendero'}
            </Text>
          </View>
        </View>
        <View style={styles.badges}>
          <SeverityBadge value={incident.severity} size="sm" />
          {incident.status === 'pendiente' ? <StatusBadge value="pendiente" /> : null}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.ink_subtle} aria-hidden />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    paddingVertical: space[3],
    paddingHorizontal: space[4],
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  hover: { backgroundColor: colors.surface_hover },
  selected: { backgroundColor: colors.bosque_tint },
  main: { flex: 1, gap: space[1] },
  line: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space[3] },
  title: { flex: 1 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: space[1], flex: 1 },
  badges: { flexDirection: 'row', gap: space[2], flexWrap: 'wrap', marginTop: space[1] },
});
