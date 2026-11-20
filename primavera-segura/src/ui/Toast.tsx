import { Ionicons } from '@expo/vector-icons';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBreakpoint } from '../hooks/use_breakpoint';
import { useReducedMotion } from '../hooks/use_reduced_motion';
import { colors, duration, easing, radius, shadow, space } from '../theme';
import { Text } from './Text';

type ToastTone = 'success' | 'danger' | 'info';
interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}

const Ctx = createContext<{ show: (message: string, tone?: ToastTone) => void } | null>(null);

export function useToast() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}

// Offset so toasts clear the phone bottom bar.
export function ToastProvider({ children, bottom_offset = 72 }: { children: React.ReactNode; bottom_offset?: number }) {
  const [toast, set_toast] = useState<ToastItem | null>(null);
  const counter = useRef(0);
  const show = useCallback((message: string, tone: ToastTone = 'success') => {
    counter.current += 1;
    set_toast({ id: counter.current, message, tone });
  }, []);
  const value = useMemo(() => ({ show }), [show]);
  return (
    <Ctx.Provider value={value}>
      {children}
      {toast ? <ToastView key={toast.id} item={toast} bottom_offset={bottom_offset} on_done={() => set_toast(null)} /> : null}
    </Ctx.Provider>
  );
}

const ICONS = { success: 'checkmark-circle', danger: 'alert-circle', info: 'information-circle' } as const;

function ToastView({ item, on_done, bottom_offset }: { item: ToastItem; on_done: () => void; bottom_offset: number }) {
  const reduced = useReducedMotion();
  const insets = useSafeAreaInsets();
  const { is_phone } = useBreakpoint();
  const [progress] = useState(() => new Animated.Value(0)); // stable animated value, not a ref
  const native = Platform.OS !== 'web';

  useEffect(() => {
    const enter = Animated.timing(progress, { toValue: 1, duration: reduced ? 0 : duration.enter, easing: easing.enter, useNativeDriver: native });
    const exit = Animated.timing(progress, { toValue: 0, duration: reduced ? 0 : duration.exit, easing: easing.exit, useNativeDriver: native });
    const seq = Animated.sequence([enter, Animated.delay(item.tone === 'danger' ? 5000 : 3200), exit]);
    seq.start(({ finished }) => finished && on_done());
    return () => seq.stop();
  }, [item, on_done, progress, reduced, native]);

  const fg = item.tone === 'danger' ? colors.toast_danger : item.tone === 'info' ? colors.toast_info : colors.toast_success;
  return (
    <View
      pointerEvents="box-none"
      style={[styles.layer, is_phone ? { left: space[4], right: space[4], bottom: insets.bottom + bottom_offset } : { right: space[8], bottom: space[8] }]}
    >
      <Animated.View
        role={item.tone === 'danger' ? 'alert' : 'status'}
        accessibilityLiveRegion="polite"
        style={[
          styles.toast,
          shadow.overlay,
          { opacity: progress, transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [reduced ? 0 : 12, 0] }) }] },
        ]}
      >
        <Ionicons name={ICONS[item.tone]} size={20} color={fg} aria-hidden />
        <Text variant="small_strong" tone="inverse" style={styles.text}>
          {item.message}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: { position: 'absolute', zIndex: 1000 },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    backgroundColor: colors.pino,
    borderRadius: radius.control,
    paddingVertical: space[3],
    paddingHorizontal: space[4],
    maxWidth: 420,
  },
  text: { flexShrink: 1 },
});
