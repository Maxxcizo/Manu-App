import { Platform, type TextStyle } from 'react-native';

// Atkinson Hyperlegible Next: built for character distinction in low-vision / adverse conditions
// (field use under direct sunlight). One family, three weights.
export const font_family = {
  regular: 'AtkinsonHyperlegibleNext_400Regular',
  semibold: 'AtkinsonHyperlegibleNext_600SemiBold',
  bold: 'AtkinsonHyperlegibleNext_700Bold',
} as const;

const tabular: TextStyle = Platform.select({ web: { fontVariant: ['tabular-nums'] }, default: { fontVariant: ['tabular-nums'] } });

export const type_scale = {
  display: { fontFamily: font_family.bold, fontSize: 36, lineHeight: 42, letterSpacing: -0.6 },
  title: { fontFamily: font_family.bold, fontSize: 28, lineHeight: 34, letterSpacing: -0.4 },
  heading: { fontFamily: font_family.bold, fontSize: 22, lineHeight: 28, letterSpacing: -0.2 },
  subheading: { fontFamily: font_family.semibold, fontSize: 18, lineHeight: 24 },
  body: { fontFamily: font_family.regular, fontSize: 16, lineHeight: 24 },
  body_strong: { fontFamily: font_family.semibold, fontSize: 16, lineHeight: 24 },
  small: { fontFamily: font_family.regular, fontSize: 14, lineHeight: 20 },
  small_strong: { fontFamily: font_family.semibold, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: font_family.regular, fontSize: 12, lineHeight: 16 },
  figure: { fontFamily: font_family.bold, fontSize: 28, lineHeight: 32, ...tabular },
  data: { fontFamily: font_family.regular, fontSize: 14, lineHeight: 20, ...tabular },
} as const satisfies Record<string, TextStyle>;

export type TypeVariant = keyof typeof type_scale;
