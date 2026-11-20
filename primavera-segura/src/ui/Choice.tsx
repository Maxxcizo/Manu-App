import React from 'react';
import { Platform, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { colors, radius, space } from '../theme';
import { focus_ring, web_pointer, type PressState } from './interaction';
import { Text } from './Text';

export interface ChoiceOption<T extends string> {
  value: T;
  label: string;
  accessory?: React.ReactNode;
}

// Single-select group of chips. Wraps on narrow screens; used for severity, periods, layers.
export function ChoiceGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  error,
  hide_label,
  testID,
}: {
  label: string;
  options: ChoiceOption<T>[];
  value: T | '';
  onChange: (value: T) => void;
  error?: string;
  hide_label?: boolean;
  testID?: string;
}) {
  return (
    <View style={styles.group} role="radiogroup" aria-label={label} testID={testID}>
      {hide_label ? null : <Text variant="small_strong">{label}</Text>}
      <View style={styles.row}>
        {options.map((o) => (
          <Chip key={o.value} label={o.label} selected={value === o.value} onPress={() => onChange(o.value)} accessory={o.accessory} />
        ))}
      </View>
      {error ? (
        <Text variant="small" tone="danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  accessory,
  count,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  accessory?: React.ReactNode;
  count?: number;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      hitSlop={Platform.OS === 'web' ? 0 : 4}
      android_ripple={{ color: colors.ripple }}
      style={(state) => {
        const s = state as PressState;
        return [
          styles.chip,
          selected ? styles.chip_selected : (s.hovered || s.pressed) && styles.chip_hover,
          web_pointer,
          focus_ring(s),
        ] as ViewStyle[];
      }}
    >
      {accessory}
      <Text variant="small_strong" style={{ color: selected ? colors.ink_inverse : colors.ink }}>
        {label}
      </Text>
      {count !== undefined ? (
        <Text variant="caption" style={{ color: selected ? colors.bosque_tint : colors.ink_muted }}>
          {count}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  group: { gap: space[2] },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2] },
  chip: {
    minHeight: Platform.OS === 'web' ? 40 : 44, // + hitSlop 4 = 48dp touch target
    paddingHorizontal: space[4],
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line_strong,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    overflow: 'hidden',
  },
  chip_hover: { backgroundColor: colors.surface_sunken },
  chip_selected: { backgroundColor: colors.bosque, borderColor: colors.bosque },
});
