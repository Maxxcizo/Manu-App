import { Platform } from 'react-native';

// 4pt grid.
export const space = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

export const touch_target = 48; // Android 48dp, also >= 44pt iOS
// One height for inputs, selects and buttons so they align in toolbars. Pointer devices can be denser.
export const control_height = Platform.OS === 'web' ? 44 : touch_target;
