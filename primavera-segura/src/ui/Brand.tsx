import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';
import { colors } from '../theme';
import { Text } from './Text';

// Contour lines traced from the Figma prototype asset (assets/map/curvas-de-nivel.svg).
// The brand's one memorable element: used only on the login panel and the sidebar header.
const CONTOUR_D =
  'M0.149992 40.1833C89.15 4.18332 203.15 46.1833 243.15 119.183C283.15 192.183 276.15 254.183 213.15 289.183C150.15 324.183 68.15 254.183 6.14999 314.183M3.14999 64.1833C82.15 20.1833 192.15 62.1833 222.15 123.183C252.15 184.183 259.15 232.183 196.15 263.183C133.15 294.183 82.15 235.183 1.14999 288.183M4.14999 88.1833C75.15 42.1833 176.15 76.1833 202.15 129.183C228.15 182.183 234.15 209.183 185.15 236.183C136.15 263.183 81.15 212.183 7.14999 260.183M27.15 109.183C82.15 64.1833 159.15 93.1833 181.15 135.183C203.15 177.183 200.15 189.183 160.15 208.183C120.15 227.183 84.15 188.183 27.15 219.183M53.15 129.183C95.15 91.1833 139.15 117.183 152.15 145.183C165.15 173.183 138.15 186.183 99.15 168.183M281.15 0.183316C248.15 64.1833 307.15 95.1833 293.15 157.183C279.15 219.183 275.15 251.183 317.15 304.183C359.15 357.183 380.15 394.183 443.15 372.183M303.15 0.183316C271.15 66.1833 331.15 104.183 315.15 163.183C299.15 222.183 302.15 246.183 339.15 291.183C376.15 336.183 394.15 371.183 447.15 347.183M329.15 3.18332C300.15 61.1833 354.15 104.183 341.15 168.183C328.15 232.183 327.15 240.183 363.15 278.183C399.15 316.183 417.15 348.183 450.15 316.183M5.14999 390.183C82.15 332.183 168.15 381.183 200.15 435.183C232.15 489.183 219.15 513.183 267.15 533.183M6.14999 415.183C83.15 361.183 145.15 397.183 176.15 451.183C207.15 505.183 193.15 513.183 226.15 536.183M5.14999 444.183C72.15 390.183 123.15 422.183 151.15 471.183C179.15 520.183 157.15 519.183 185.15 543.183';

export function Contours({ color = colors.pino_line, opacity = 1, style, stroke = 1 }: { color?: string; opacity?: number; style?: ViewStyle; stroke?: number }) {
  return (
    <View style={[StyleSheet.absoluteFill, style]} pointerEvents="none" aria-hidden>
      <Svg width="100%" height="100%" viewBox="0 0 450 543" preserveAspectRatio="xMidYMid slice" opacity={opacity}>
        <G fill="none" stroke={color} strokeWidth={stroke}>
          <Path d={CONTOUR_D} />
          <Path d={CONTOUR_D} transform="translate(450 543) rotate(180)" />
        </G>
      </Svg>
    </View>
  );
}

// Mark: three nested contour rings around a survey point.
export function LogoMark({ size = 32, inverse }: { size?: number; inverse?: boolean }) {
  const fg = inverse ? colors.pino_text : colors.bosque;
  const bg = inverse ? colors.brand_mark_bg : colors.bosque_tint;
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <Rect width={32} height={32} rx={9} fill={bg} />
      <G fill="none" stroke={fg} strokeWidth={1.6}>
        <Path d="M6 20c3-7 9-11 15-10s6 7 1 10-10 3-16 0Z" opacity={0.45} />
        <Path d="M10 19c2-4 6-6 9-5.5s3.4 4 .4 5.6-6 1.4-9.4-.1Z" opacity={0.75} />
      </G>
      <Circle cx={16.5} cy={17.2} r={2.3} fill={fg} />
    </Svg>
  );
}

export function Wordmark({ inverse, size = 'md' }: { inverse?: boolean; size?: 'md' | 'lg' }) {
  return (
    <View style={styles.wordmark} accessibilityRole="header" accessibilityLabel="Primavera Segura">
      <LogoMark inverse={inverse} size={size === 'lg' ? 40 : 32} />
      <Text variant={size === 'lg' ? 'heading' : 'subheading'} style={{ color: inverse ? colors.pino_text : colors.ink }} aria-hidden>
        Primavera Segura
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wordmark: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
