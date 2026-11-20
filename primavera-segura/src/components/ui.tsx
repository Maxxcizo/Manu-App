import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { colors, radius } from '../theme';

export function Screen({
  title,
  subtitle,
  children,
  embedded,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  embedded?: boolean; // inside a native Stack header: skip our own header bar
}) {
  if (embedded)
    return (
      <View style={s.screen}>
        <ScrollView contentContainerStyle={s.content}>
          {subtitle ? <Text style={s.muted}>{subtitle}</Text> : null}
          {children}
        </ScrollView>
      </View>
    );
  return (
    <View style={s.screen}>
      <View style={s.header}>
        <Text style={s.eyebrow}>LA PRIMAVERA</Text>
        <Text style={s.title} accessibilityRole="header">
          {title}
        </Text>
        {subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}
      </View>
      <ScrollView contentContainerStyle={s.content}>{children}</ScrollView>
    </View>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function H({ children }: { children: React.ReactNode }) {
  return <Text style={s.h}>{children}</Text>;
}

export function Muted({ children, style }: { children: React.ReactNode; style?: object }) {
  return <Text style={[s.muted, style]}>{children}</Text>;
}

type Tone = 'success' | 'warning' | 'danger' | 'info';
const tones: Record<Tone, [string, string]> = {
  success: [colors.primary_soft, colors.primary],
  warning: [colors.warning_soft, colors.warning],
  danger: [colors.danger_soft, colors.danger],
  info: [colors.info_soft, colors.info],
};

export function Tag({ label, tone = 'info' }: { label: string; tone?: Tone }) {
  const [bg, fg] = tones[tone];
  return (
    <View style={[s.tag, { backgroundColor: bg }]}>
      <Text style={[s.tag_text, { color: fg }]}>{label}</Text>
    </View>
  );
}

export function Notice({ children, tone = 'info' }: { children: React.ReactNode; tone?: Tone }) {
  const [bg, fg] = tones[tone];
  return (
    <View style={[s.notice, { backgroundColor: bg }]} accessibilityRole="alert">
      <Text style={{ color: fg, fontSize: 13, lineHeight: 19 }}>{children}</Text>
    </View>
  );
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  loading?: boolean;
}) {
  const bg = variant === 'primary' ? colors.primary : variant === 'danger' ? colors.danger : colors.surface;
  const fg = variant === 'secondary' ? colors.primary : '#fff';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled || loading}
      onPress={onPress}
      style={[s.button, { backgroundColor: bg, borderColor: colors.primary, opacity: disabled ? 0.5 : 1 }]}
    >
      {loading ? <ActivityIndicator color={fg} /> : <Text style={[s.button_text, { color: fg }]}>{label}</Text>}
    </Pressable>
  );
}

export function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[s.chip, active && { backgroundColor: colors.primary, borderColor: colors.primary }]}
    >
      <Text style={[s.chip_text, active && { color: '#fff' }]}>{label}</Text>
    </Pressable>
  );
}

export function Field({
  label,
  error,
  testID,
  ...input
}: TextInputProps & { label: string; error?: string; testID?: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        {...input}
        testID={testID}
        accessibilityLabel={label}
        placeholderTextColor={colors.muted}
        style={[s.input, error ? { borderColor: colors.danger } : null]}
      />
      {error ? (
        <Text testID={testID ? `error-${testID}` : undefined} style={{ color: colors.danger, fontSize: 12 }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

export function Row({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' }, style]}>{children}</View>;
}

export function Bar({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <View style={{ gap: 4 }}>
      <Row style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
        <Text style={s.label}>{label}</Text>
        <Text style={s.muted}>{value}</Text>
      </Row>
      <View style={s.bar_track}>
        <View style={[s.bar_fill, { width: `${max ? (value / max) * 100 : 0}%` }]} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.primary, paddingTop: 44, paddingBottom: 16, paddingHorizontal: 20, gap: 2 },
  eyebrow: { color: '#cfe6da', fontSize: 11, fontWeight: '600', letterSpacing: 1 },
  title: { color: '#fff', fontSize: 24, fontWeight: '800' },
  subtitle: { color: '#e7f1eb', fontSize: 13 },
  content: { padding: 16, gap: 14, maxWidth: 760, width: '100%', alignSelf: 'center' },
  card: { backgroundColor: colors.surface, borderRadius: radius.card, padding: 16, gap: 10, borderWidth: 1, borderColor: colors.border },
  h: { color: colors.ink, fontSize: 17, fontWeight: '800' },
  muted: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  label: { color: colors.ink, fontSize: 13, fontWeight: '600' },
  tag: { alignSelf: 'flex-start', borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  tag_text: { fontSize: 12, fontWeight: '700' },
  notice: { borderRadius: radius.field, padding: 12 },
  button: { minHeight: 48, borderRadius: radius.field, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  button_text: { fontSize: 15, fontWeight: '700' },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: colors.surface },
  chip_text: { color: colors.ink, fontSize: 13, fontWeight: '600' },
  input: { minHeight: 48, borderWidth: 1, borderColor: colors.border, borderRadius: radius.field, paddingHorizontal: 12, backgroundColor: colors.surface, color: colors.ink, fontSize: 15 },
  bar_track: { height: 8, borderRadius: 4, backgroundColor: colors.primary_soft },
  bar_fill: { height: 8, borderRadius: 4, backgroundColor: colors.primary },
});
