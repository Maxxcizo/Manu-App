import { useRouter } from 'expo-router';
import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBreakpoint } from '../hooks/use_breakpoint';
import { colors, radius, space } from '../theme';
import { IconButton } from './Button';
import { Text } from './Text';

const MAX_CONTENT = 1280;

// Page scaffold. Phones: safe-area aware, compact header, optional sticky footer (form actions).
// Desktop: generous gutters, max width, header with actions on the right.
export function Page({
  title,
  description,
  actions,
  back,
  children,
  footer,
  scroll = true,
  flush,
  testID,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  back?: boolean | string; // true = router.back(), string = fallback href
  children: React.ReactNode;
  footer?: React.ReactNode;
  scroll?: boolean;
  flush?: boolean; // full-bleed content (map screens)
  testID?: string;
}) {
  const layout = useBreakpoint();
  const insets = useSafeAreaInsets();
  const pad = layout.gutter;
  const header = <PageHeader title={title} description={description} actions={actions} back={back} />;
  const body = (
    <View style={[styles.inner, !flush && { paddingHorizontal: pad, paddingBottom: space[8] }]}>
      {flush ? null : header}
      {children}
    </View>
  );
  return (
    <KeyboardAvoidingView
      style={[styles.page, layout.is_phone && { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      testID={testID}
    >
      {flush ? <View style={{ paddingHorizontal: pad }}>{header}</View> : null}
      {scroll ? (
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {body}
        </ScrollView>
      ) : (
        <View style={styles.fill}>{body}</View>
      )}
      {footer ? (
        <View style={[styles.footer, { paddingHorizontal: pad, paddingBottom: layout.is_phone ? space[3] : space[4] }]}>
          <View style={styles.footer_inner}>{footer}</View>
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

export function PageHeader({ title, description, actions, back }: { title: string; description?: string; actions?: React.ReactNode; back?: boolean | string }) {
  const router = useRouter();
  const { is_phone, is_desktop } = useBreakpoint();
  const go_back = () => {
    if (router.canGoBack()) router.back();
    else router.replace((typeof back === 'string' ? back : '/home') as never);
  };
  return (
    <View style={[styles.header, is_desktop && styles.header_desktop]}>
      <View style={styles.header_title}>
        {back ? (
          <View style={styles.back}>
            <IconButton icon="arrow-back" label="Volver" onPress={go_back} />
          </View>
        ) : null}
        <View style={styles.header_text}>
          <Text variant={is_phone ? 'heading' : 'title'} heading={1}>
            {title}
          </Text>
          {description ? (
            <Text tone="muted" style={styles.measure}>
              {description}
            </Text>
          ) : null}
        </View>
      </View>
      {actions ? <View style={[styles.actions, is_phone && styles.actions_phone]}>{actions}</View> : null}
    </View>
  );
}

export function Panel({
  title,
  description,
  actions,
  children,
  padded = true,
  style,
}: {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  padded?: boolean;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.panel, style]}>
      {title ? (
        <View style={[styles.panel_header, !padded && styles.panel_header_flush]}>
          <View style={styles.header_text}>
            <Text variant="subheading" heading={2}>
              {title}
            </Text>
            {description ? (
              <Text variant="small" tone="muted">
                {description}
              </Text>
            ) : null}
          </View>
          {actions}
        </View>
      ) : null}
      <View style={padded ? styles.panel_body : undefined}>{children}</View>
    </View>
  );
}

// Responsive columns: stacks on phones, splits on wider screens.
export function Columns({ children, ratio = [1, 1], gap = space[6], breakpoint = 1024 }: { children: React.ReactNode; ratio?: number[]; gap?: number; breakpoint?: number }) {
  const { width } = useBreakpoint();
  const split = width >= breakpoint;
  const items = React.Children.toArray(children);
  return (
    <View style={{ flexDirection: split ? 'row' : 'column', gap, alignItems: split ? 'flex-start' : 'stretch' }}>
      {items.map((child, i) => (
        <View key={i} style={split ? { flex: ratio[i] ?? 1, minWidth: 0 } : undefined}>
          {child}
        </View>
      ))}
    </View>
  );
}

export function Divider({ inset = 0 }: { inset?: number }) {
  return <View style={{ height: 1, backgroundColor: colors.line, marginLeft: inset }} />;
}

// Label / value pairs; rows on wide screens, stacked on phones.
export function KeyValue({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <View style={styles.kv}>
      <Text variant="small" tone="muted" style={styles.kv_label}>
        {label}
      </Text>
      <View style={styles.kv_value}>{children ?? <Text variant="body">{value}</Text>}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.canvas },
  scroll: { flexGrow: 1 },
  fill: { flex: 1 },
  inner: { width: '100%', maxWidth: MAX_CONTENT, alignSelf: 'center', gap: space[6], flexGrow: 1 },
  header: { paddingTop: space[4], gap: space[4] },
  header_desktop: { paddingTop: space[8], flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap' },
  header_title: { flexDirection: 'row', alignItems: 'flex-start', gap: space[2], flexShrink: 1 },
  back: { marginLeft: -space[3], marginTop: -space[2] },
  header_text: { gap: space[1], flexShrink: 1 },
  measure: { maxWidth: 640 },
  actions: { flexDirection: 'row', gap: space[3], alignItems: 'center', flexWrap: 'wrap' },
  actions_phone: { alignSelf: 'stretch' },
  panel: { backgroundColor: colors.surface, borderRadius: radius.panel, borderWidth: 1, borderColor: colors.line, overflow: 'hidden' },
  panel_header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space[3], paddingHorizontal: space[5], paddingTop: space[4] },
  panel_header_flush: { paddingBottom: space[3], borderBottomWidth: 1, borderBottomColor: colors.line },
  panel_body: { padding: space[5], gap: space[4] },
  footer: { borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.surface, paddingTop: space[3] },
  footer_inner: { width: '100%', maxWidth: MAX_CONTENT, alignSelf: 'center', flexDirection: 'row', gap: space[3], justifyContent: 'flex-end' },
  kv: { flexDirection: 'row', flexWrap: 'wrap', gap: space[1], paddingVertical: space[3], borderBottomWidth: 1, borderBottomColor: colors.line },
  kv_label: { width: 168, paddingTop: 2 },
  kv_value: { flex: 1, minWidth: 160 },
});
