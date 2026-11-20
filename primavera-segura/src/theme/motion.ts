import { Easing } from 'react-native';

// Exit is faster than enter. Durations collapse to 0 when the system asks to reduce motion.
export const duration = { press: 120, enter: 200, exit: 160, page: 220 } as const;
export const easing = {
  enter: Easing.bezier(0.2, 0, 0, 1),
  exit: Easing.bezier(0.4, 0, 1, 1),
} as const;
