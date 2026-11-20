import { Platform, type ViewStyle } from 'react-native';
import { colors } from '../theme';

// react-native-web adds hovered/focused to the Pressable state; Android only reports pressed.
export interface PressState {
  pressed: boolean;
  hovered?: boolean;
  focused?: boolean;
}

// :focus-visible equivalent: show the ring only when focus came from the keyboard, not a click.
let keyboard_modality = false;
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab' || e.key.startsWith('Arrow') || e.key === 'Enter' || e.key === ' ') keyboard_modality = true;
  }, true);
  document.addEventListener('pointerdown', () => (keyboard_modality = false), true);
}

// on_dark: use the light ring on the pine sidebar/rail (blue on pine would be ~2:1).
export function focus_ring(state: PressState, offset = 2, on_dark = false): ViewStyle | null {
  if (Platform.OS !== 'web' || !state.focused || !keyboard_modality) return null;
  return { outlineColor: on_dark ? colors.focus_on_dark : colors.focus, outlineStyle: 'solid', outlineWidth: 2, outlineOffset: offset };
}

export const web_pointer: ViewStyle | null = Platform.OS === 'web' ? ({ cursor: 'pointer' } as ViewStyle) : null;
