import React from 'react';
import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';
import { colors, type_scale, type TypeVariant } from '../theme';

const tones = {
  default: colors.ink,
  muted: colors.ink_muted,
  subtle: colors.ink_subtle,
  inverse: colors.ink_inverse,
  brand: colors.bosque,
  danger: colors.danger_text,
  info: colors.agua,
} as const;

export type Tone = keyof typeof tones;

export interface TextProps extends RNTextProps {
  variant?: TypeVariant;
  tone?: Tone;
  align?: TextStyle['textAlign'];
  heading?: 1 | 2 | 3; // exposes a heading role (aria-level on web)
}

export function Text({ variant = 'body', tone = 'default', align, heading, style, ...rest }: TextProps) {
  return (
    <RNText
      {...rest}
      role={heading ? 'heading' : rest.role}
      aria-level={heading}
      style={[type_scale[variant], { color: tones[tone] }, align ? { textAlign: align } : null, style]}
    />
  );
}
