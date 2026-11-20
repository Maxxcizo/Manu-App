import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { colors, control_height, radius, space, touch_target } from '../theme';
import { focus_ring, web_pointer, type PressState } from './interaction';
import { Text } from './Text';

type Variant = 'primary' | 'secondary' | 'tertiary' | 'danger';
type IconName = React.ComponentProps<typeof Ionicons>['name'];

const palette: Record<Variant, { bg: string; bg_active: string; fg: string; border: string; ripple: string }> = {
  primary: { bg: colors.bosque, bg_active: colors.bosque_pressed, fg: colors.ink_inverse, border: colors.bosque, ripple: colors.ripple_on_fill },
  secondary: { bg: colors.surface, bg_active: colors.surface_sunken, fg: colors.ink, border: colors.line_strong, ripple: colors.ripple },
  tertiary: { bg: 'transparent', bg_active: colors.surface_sunken, fg: colors.bosque, border: 'transparent', ripple: colors.ripple },
  danger: { bg: colors.danger, bg_active: colors.danger_pressed, fg: colors.ink_inverse, border: colors.danger, ripple: colors.ripple_on_fill },
};

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: IconName;
  icon_after?: IconName;
  loading?: boolean;
  disabled?: boolean;
  full_width?: boolean;
  compact?: boolean; // 40px on pointer devices only; touch keeps 48dp
  testID?: string;
  accessibilityHint?: string;
}

export function Button({ label, onPress, variant = 'primary', icon, icon_after, loading, disabled, full_width, compact, testID, accessibilityHint }: ButtonProps) {
  const p = palette[variant];
  const height = compact && Platform.OS === 'web' ? 36 : control_height;
  const inactive = disabled || loading;
  return (
    <Pressable
      testID={testID}
      role="button"
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      disabled={inactive}
      onPress={onPress}
      android_ripple={{ color: p.ripple }}
      style={(state) => {
        const s = state as PressState;
        const active = s.pressed || s.hovered;
        return [
          styles.base,
          { minHeight: height, backgroundColor: active && !inactive ? p.bg_active : p.bg, borderColor: p.border },
          variant === 'tertiary' && styles.tertiary,
          full_width && styles.full,
          inactive && styles.disabled,
          web_pointer,
          focus_ring(s),
        ] as ViewStyle[];
      }}
    >
      {loading ? (
        <ActivityIndicator color={p.fg} />
      ) : (
        <View style={styles.content}>
          {icon ? <Ionicons name={icon} size={20} color={p.fg} aria-hidden /> : null}
          <Text variant="body_strong" style={{ color: p.fg }} numberOfLines={1}>
            {label}
          </Text>
          {icon_after ? <Ionicons name={icon_after} size={18} color={p.fg} aria-hidden /> : null}
        </View>
      )}
    </Pressable>
  );
}

export interface IconButtonProps {
  icon: IconName;
  label: string; // accessible name, also used as web tooltip
  onPress: () => void;
  tone?: 'default' | 'inverse' | 'brand';
  selected?: boolean;
  testID?: string;
}

export function IconButton({ icon, label, onPress, tone = 'default', selected, testID }: IconButtonProps) {
  const fg = tone === 'inverse' ? colors.ink_inverse : tone === 'brand' ? colors.bosque : colors.ink;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={selected === undefined ? undefined : { selected }}
      onPress={onPress}
      hitSlop={4}
      android_ripple={{ color: colors.ripple, borderless: true, radius: 24 }}
      {...(Platform.OS === 'web' ? ({ title: label } as object) : null)}
      style={(state) => {
        const s = state as PressState;
        return [
          styles.icon_button,
          (s.pressed || s.hovered || selected) && { backgroundColor: tone === 'inverse' ? colors.inverse_hover : colors.surface_sunken },
          web_pointer,
          focus_ring(s, 0, tone === 'inverse'),
        ] as ViewStyle[];
      }}
    >
      <Ionicons name={icon} size={22} color={fg} aria-hidden />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.control,
    borderWidth: 1,
    paddingHorizontal: space[5],
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  tertiary: { paddingHorizontal: space[3] },
  full: { alignSelf: 'stretch' },
  disabled: { opacity: 0.45 },
  content: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  icon_button: {
    width: touch_target,
    height: touch_target,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
