import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

// Works on Android and web (react-native-web maps it to prefers-reduced-motion).
export function useReducedMotion(): boolean {
  const [reduced, set_reduced] = useState(false);
  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => active && set_reduced(value))
      .catch(() => undefined);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', set_reduced);
    return () => {
      active = false;
      sub.remove();
    };
  }, []);
  return reduced;
}
