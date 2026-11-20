import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Platform, StyleSheet, TextInput, View, type TextInputProps, type ViewStyle } from 'react-native';
import { colors, control_height, font_family, radius, space } from '../theme';
import { Text } from './Text';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  hint?: string;
  error?: string;
  invalid?: boolean; // red border without repeating a message shown elsewhere
  required?: boolean;
  icon?: IconName;
  hide_label?: boolean; // label stays as accessible name (search bars)
  grow?: boolean; // share a row with sibling fields (flex basis 0); never use in a column
  container_style?: ViewStyle;
}

export function TextField({ label, hint, error, invalid, required, icon, hide_label, grow, container_style, testID, onFocus, onBlur, ...input }: TextFieldProps) {
  const [focused, set_focused] = useState(false);
  const border = error || invalid ? colors.danger : focused ? colors.bosque : colors.line_strong;
  return (
    <View style={[styles.wrap, grow && styles.grow, container_style]}>
      {hide_label ? null : (
        <Text variant="small_strong">
          {label}
          {required ? <Text variant="small" tone="muted"> (obligatorio)</Text> : null}
        </Text>
      )}
      <View style={[styles.field, { borderColor: border }, focused && styles.focused]}>
        {icon ? <Ionicons name={icon} size={20} color={colors.ink_muted} aria-hidden /> : null}
        <TextInput
          {...input}
          testID={testID}
          accessibilityLabel={label}
          aria-invalid={!!error || !!invalid}
          aria-required={required}
          accessibilityHint={hint}
          placeholderTextColor={colors.ink_subtle}
          onFocus={(e) => {
            set_focused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            set_focused(false);
            onBlur?.(e);
          }}
          style={[styles.input, Platform.OS === 'web' && ({ outlineStyle: 'none' } as object)]}
        />
      </View>
      {error ? (
        <View style={styles.message} testID={testID ? `error-${testID}` : undefined} accessibilityLiveRegion="polite">
          <Ionicons name="alert-circle" size={16} color={colors.danger_text} aria-hidden />
          <Text variant="small" tone="danger" style={styles.message_text}>
            {error}
          </Text>
        </View>
      ) : hint ? (
        <Text variant="small" tone="muted">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space[2] },
  grow: { flexGrow: 1, flexBasis: 0, minWidth: 140 },
  field: {
    minHeight: control_height,
    borderWidth: 1,
    borderRadius: radius.control,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space[3],
    gap: space[2],
  },
  focused: { borderWidth: 2, paddingHorizontal: space[3] - 1 },
  input: { flex: 1, minHeight: control_height - 2, fontFamily: font_family.regular, fontSize: 16, color: colors.ink },
  message: { flexDirection: 'row', gap: space[1], alignItems: 'flex-start' },
  message_text: { flex: 1 },
});
