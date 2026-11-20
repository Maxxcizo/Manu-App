import React, { useEffect, useState } from 'react';
import { Animated, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBreakpoint } from '../hooks/use_breakpoint';
import { useReducedMotion } from '../hooks/use_reduced_motion';
import { colors, duration, easing, radius, shadow, space } from '../theme';
import { Button, IconButton } from './Button';
import { Text } from './Text';

// Phone: bottom sheet. Tablet/desktop: centered dialog. Same API on Android and web.
// Android hardware back closes it (onRequestClose); Escape closes it on web (RNW Modal).
export function Sheet({
  visible,
  title,
  onClose,
  children,
  footer,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const { is_phone, height } = useBreakpoint();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const [progress] = useState(() => new Animated.Value(0)); // stable animated value, not a ref
  const [mounted, set_mounted] = useState(visible);
  const native = Platform.OS !== 'web';

  if (visible && !mounted) set_mounted(true);

  useEffect(() => {
    if (!mounted) return;
    Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: reduced ? 0 : visible ? duration.enter : duration.exit,
      easing: visible ? easing.enter : easing.exit,
      useNativeDriver: native,
    }).start(({ finished }) => {
      if (finished && !visible) set_mounted(false);
    });
  }, [visible, mounted, progress, reduced, native]);

  if (!mounted) return null;

  const offset = progress.interpolate({ inputRange: [0, 1], outputRange: [reduced ? 0 : is_phone ? 40 : 12, 0] });

  return (
    <Modal transparent visible animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.scrim, opacity: progress }]}>
          <Pressable style={styles.fill} onPress={onClose} accessibilityLabel="Cerrar" accessibilityRole="button" />
        </Animated.View>
        <View style={[styles.fill, is_phone ? styles.align_bottom : styles.align_center]} pointerEvents="box-none">
          <Animated.View
            role="dialog"
            aria-modal
            aria-label={title}
            style={[
              styles.panel,
              shadow.overlay,
              is_phone
                ? [styles.panel_phone, { paddingBottom: insets.bottom + space[4], maxHeight: height * 0.88 }]
                : [styles.panel_dialog, { maxHeight: height * 0.85 }],
              { opacity: progress, transform: [{ translateY: offset }] },
            ]}
          >
            {is_phone ? <View style={styles.grabber} aria-hidden /> : null}
            <View style={styles.header}>
              <Text variant="subheading" heading={2} style={styles.title}>
                {title}
              </Text>
              <IconButton icon="close" label="Cerrar" onPress={onClose} />
            </View>
            <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
              {children}
            </ScrollView>
            {footer ? <View style={styles.footer}>{footer}</View> : null}
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function ConfirmDialog({
  visible,
  title,
  message,
  confirm_label,
  tone = 'primary',
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  message: string;
  confirm_label: string;
  tone?: 'primary' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Sheet
      visible={visible}
      title={title}
      onClose={onCancel}
      footer={
        <>
          <Button label="Cancelar" variant="secondary" onPress={onCancel} />
          <Button label={confirm_label} variant={tone} onPress={onConfirm} />
        </>
      }
    >
      <Text tone="muted">{message}</Text>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  align_bottom: { justifyContent: 'flex-end' },
  align_center: { justifyContent: 'center', alignItems: 'center', padding: space[6] },
  panel: { backgroundColor: colors.surface, overflow: 'hidden' },
  panel_phone: { borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet },
  panel_dialog: { borderRadius: radius.sheet, width: '100%', maxWidth: 520 },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.line, marginTop: space[2] },
  header: { flexDirection: 'row', alignItems: 'center', paddingLeft: space[5], paddingRight: space[2], paddingTop: space[2] },
  title: { flex: 1 },
  body: { paddingHorizontal: space[5], paddingBottom: space[4], gap: space[4] },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: space[3],
    paddingHorizontal: space[5],
    paddingTop: space[3],
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
});
