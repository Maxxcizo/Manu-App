import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radius, space } from '../theme';
import { Text } from './Text';

type Tone = 'info' | 'warning' | 'danger' | 'success';

const tones: Record<Tone, { bg: string; fg: string; border: string; icon: React.ComponentProps<typeof Ionicons>['name'] }> = {
  info: { bg: colors.agua_tint, fg: colors.agua, border: colors.info_line, icon: 'information-circle-outline' },
  warning: { bg: colors.warning_tint, fg: colors.warning_text, border: colors.warning_line, icon: 'warning-outline' },
  danger: { bg: colors.danger_tint, fg: colors.danger_text, border: colors.danger_line, icon: 'alert-circle-outline' },
  success: { bg: colors.bosque_tint, fg: colors.bosque, border: colors.success_line, icon: 'checkmark-circle-outline' },
};

// Inline, persistent message tied to the current screen (toasts are for transient confirmations).
export function Banner({ tone = 'info', title, children, action }: { tone?: Tone; title?: string; children?: React.ReactNode; action?: React.ReactNode }) {
  const t = tones[tone];
  return (
    <View style={[styles.wrap, { backgroundColor: t.bg, borderColor: t.border }]} role={tone === 'danger' ? 'alert' : 'status'}>
      <Ionicons name={t.icon} size={20} color={t.fg} aria-hidden style={styles.icon} />
      <View style={styles.body}>
        {title ? (
          <Text variant="small_strong" style={{ color: t.fg }}>
            {title}
          </Text>
        ) : null}
        {children ? (
          <Text variant="small" style={{ color: t.fg }}>
            {children}
          </Text>
        ) : null}
        {action}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', gap: space[3], borderRadius: radius.control, borderWidth: 1, padding: space[3] },
  icon: { marginTop: 1 },
  body: { flex: 1, gap: space[1] },
});
