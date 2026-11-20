import { Platform, type ViewStyle } from 'react-native';

// Panels use 1px borders. Shadows are reserved for layers that float above content.
const make = (y: number, blur: number, opacity: number, elevation: number): ViewStyle =>
  Platform.select<ViewStyle>({
    web: { boxShadow: `0 ${y}px ${blur}px rgba(15, 42, 34, ${opacity})` } as ViewStyle,
    default: {
      shadowColor: '#0F2A22',
      shadowOffset: { width: 0, height: y },
      shadowOpacity: opacity,
      shadowRadius: blur / 2,
      elevation,
    },
  });

export const shadow = {
  floating: make(4, 16, 0.14, 4), // map controls, menus
  overlay: make(12, 40, 0.22, 12), // sheets, dialogs, toasts
} as const;
