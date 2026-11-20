import { Ionicons } from '@expo/vector-icons';
import React, { useId, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, control_height, font_family, radius, space } from '../theme';
import { Text } from './Text';
import type { SelectProps } from './select_types';

// Web: a real <select> keeps keyboard, screen reader and type-ahead behavior for free.
export function Select<T extends string>({ label, value, options, onChange, placeholder = 'Seleccionar', error, required, testID, hide_label, grow }: SelectProps<T>) {
  const id = useId();
  const [focused, set_focused] = useState(false);
  return (
    <View style={[styles.wrap, grow && styles.grow]}>
      {hide_label ? null : (
        <label htmlFor={id} style={{ display: 'block' }}>
          <Text variant="small_strong">
            {label}
            {required ? <Text variant="small" tone="muted"> (obligatorio)</Text> : null}
          </Text>
        </label>
      )}
      <View style={styles.field_wrap}>
        <select
          id={id}
          data-testid={testID}
          aria-label={hide_label ? label : undefined}
          aria-invalid={!!error}
          value={value}
          onFocus={() => set_focused(true)}
          onBlur={() => set_focused(false)}
          onChange={(e) => onChange(e.target.value as T)}
          style={{
            appearance: 'none',
            WebkitAppearance: 'none',
            width: '100%',
            height: control_height,
            padding: `0 ${space[10]}px 0 ${space[3]}px`,
            borderRadius: radius.control,
            border: `${focused ? 2 : 1}px solid ${error ? colors.danger : focused ? colors.bosque : colors.line_strong}`,
            background: colors.surface,
            color: value ? colors.ink : colors.ink_subtle,
            fontFamily: font_family.regular,
            fontSize: 15,
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          <option value="">{placeholder}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <View style={styles.chevron} pointerEvents="none">
          <Ionicons name="chevron-down" size={18} color={colors.ink_muted} aria-hidden />
        </View>
      </View>
      {error ? (
        <Text variant="small" tone="danger">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space[2] },
  grow: { flexGrow: 1, flexBasis: 0, minWidth: 160 },
  field_wrap: { position: 'relative', justifyContent: 'center' },
  chevron: { position: 'absolute', right: space[3] },
});
