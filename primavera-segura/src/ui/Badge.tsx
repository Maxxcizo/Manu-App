import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { status_label } from '../lib/labels';
import type { IncidentStatus } from '../lib/types';
import { colors, radius, severity, space, type Severity } from '../theme';
import { Text } from './Text';

// Severity is never color-only: a 1-2-3 bar glyph plus the word (WCAG 1.4.1).
export function SeverityGlyph({ level, color, size = 14 }: { level: number; color: string; size?: number }) {
  const bar = size / 4.2;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
      {[1, 2, 3].map((n) => {
        const h = (size * (n + 1)) / 4;
        return (
          <Rect
            key={n}
            x={(n - 1) * (bar + bar / 2.4)}
            y={size - h}
            width={bar}
            height={h}
            rx={1}
            fill={n <= level ? color : 'transparent'}
            stroke={color}
            strokeWidth={n <= level ? 0 : 1}
          />
        );
      })}
    </Svg>
  );
}

export function SeverityBadge({ value, size = 'md' }: { value: Severity; size?: 'sm' | 'md' }) {
  const s = severity[value];
  return (
    <View style={[styles.badge, { backgroundColor: s.tint }, size === 'sm' && styles.sm]} accessibilityLabel={`Gravedad ${s.label.toLowerCase()}`}>
      <SeverityGlyph level={s.level} color={s.text} size={size === 'sm' ? 12 : 14} />
      <Text variant={size === 'sm' ? 'caption' : 'small_strong'} style={{ color: s.text }}>
        {s.label}
      </Text>
    </View>
  );
}

const STATUS: Record<IncidentStatus, { icon: React.ComponentProps<typeof Ionicons>['name']; fg: string; bg: string }> = {
  pendiente: { icon: 'time-outline', fg: colors.warning_text, bg: colors.warning_tint },
  validado: { icon: 'checkmark-circle-outline', fg: colors.bosque, bg: colors.bosque_tint },
  cerrado: { icon: 'lock-closed-outline', fg: colors.ink_muted, bg: colors.surface_sunken },
};

export function StatusBadge({ value }: { value: IncidentStatus }) {
  const s = STATUS[value];
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }]}>
      <Ionicons name={s.icon} size={14} color={s.fg} aria-hidden />
      <Text variant="small_strong" style={{ color: s.fg }}>
        {status_label[value]}
      </Text>
    </View>
  );
}

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'brand' | 'info' | 'warning' | 'danger' }) {
  const map = {
    neutral: [colors.surface_sunken, colors.ink_muted],
    brand: [colors.bosque_tint, colors.bosque],
    info: [colors.agua_tint, colors.agua],
    warning: [colors.warning_tint, colors.warning_text],
    danger: [colors.danger_tint, colors.danger_text],
  } as const;
  const [bg, fg] = map[tone];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text variant="small_strong" style={{ color: fg }}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: space[1] + 2,
    borderRadius: radius.pill,
    paddingHorizontal: space[3],
    paddingVertical: 3,
  },
  sm: { paddingHorizontal: space[2], paddingVertical: 2, gap: space[1] },
});
