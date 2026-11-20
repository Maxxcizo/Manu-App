import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { colors, control_height, radius, space } from '../theme';
import { focus_ring, type PressState } from './interaction';
import { Sheet } from './Sheet';
import { Text } from './Text';
import type { SelectProps } from './select_types';

// Android: field that opens a bottom sheet with a radio list (the web build uses Select.web.tsx).
export function Select<T extends string>({ label, value, options, onChange, placeholder = 'Seleccionar', error, required, testID, hide_label, grow }: SelectProps<T>) {
  const [open, set_open] = useState(false);
  const current = options.find((o) => o.value === value);
  return (
    <View style={[styles.wrap, grow && styles.grow]}>
      {hide_label ? null : (
        <Text variant="small_strong">
          {label}
          {required ? <Text variant="small" tone="muted"> (obligatorio)</Text> : null}
        </Text>
      )}
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${current?.label ?? placeholder}`}
        accessibilityState={{ expanded: open }}
        onPress={() => set_open(true)}
        android_ripple={{ color: colors.ripple }}
        style={(s) => [styles.field, { borderColor: error ? colors.danger : colors.line_strong }, focus_ring(s as PressState)] as ViewStyle[]}
      >
        <Text style={styles.value} tone={current ? 'default' : 'subtle'} numberOfLines={1}>
          {current?.label ?? placeholder}
        </Text>
        <Ionicons name="chevron-down" size={20} color={colors.ink_muted} aria-hidden />
      </Pressable>
      {error ? (
        <Text variant="small" tone="danger">
          {error}
        </Text>
      ) : null}
      <Sheet visible={open} title={label} onClose={() => set_open(false)}>
        <View role="radiogroup">
          {options.map((o) => {
            const selected = o.value === value;
            return (
              <Pressable
                key={o.value}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                onPress={() => {
                  onChange(o.value);
                  set_open(false);
                }}
                android_ripple={{ color: colors.ripple }}
                style={styles.option}
              >
                <Text variant={selected ? 'body_strong' : 'body'} style={styles.value}>
                  {o.label}
                </Text>
                {selected ? <Ionicons name="checkmark" size={22} color={colors.bosque} aria-hidden /> : null}
              </Pressable>
            );
          })}
        </View>
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space[2] },
  grow: { flexGrow: 1, flexBasis: 0, minWidth: 160 },
  field: {
    minHeight: control_height,
    borderWidth: 1,
    borderRadius: radius.control,
    backgroundColor: colors.surface,
    paddingHorizontal: space[3],
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    overflow: 'hidden',
  },
  value: { flex: 1 },
  option: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
});
