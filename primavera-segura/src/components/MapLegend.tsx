import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, severity, space, type Severity } from '../theme';
import { SeverityGlyph, Text } from '../ui';

// Legend mirrors the map encoding: marker size + color + glyph per severity, outlined cells for zones.
export function MapLegend({ show_zones = true, show_points = true, direction = 'column' }: { show_zones?: boolean; show_points?: boolean; direction?: 'row' | 'column' }) {
  return (
    <View style={[styles.wrap, direction === 'row' && styles.row]} accessibilityLabel="Leyenda del mapa">
      {(show_points ? (['baja', 'media', 'alta'] as Severity[]) : []).map((s) => (
        <View key={s} style={styles.item}>
          <View style={[styles.dot, { width: 8 + severity[s].level * 3, height: 8 + severity[s].level * 3, backgroundColor: severity[s].fill }]} />
          <SeverityGlyph level={severity[s].level} color={severity[s].text} size={12} />
          <Text variant="small">Gravedad {severity[s].label.toLowerCase()}</Text>
        </View>
      ))}
      {show_zones ? (
        <>
          <View style={styles.item}>
            <View style={[styles.cell, { backgroundColor: colors.zone_critical_fill, borderColor: colors.danger }]} />
            <Text variant="small">Zona crítica</Text>
          </View>
          <View style={styles.item}>
            <View style={[styles.cell, { borderStyle: 'dashed', borderColor: severity.media.fill }]} />
            <Text variant="small">Pocos datos</Text>
          </View>
        </>
      ) : null}
      <View style={styles.item}>
        <View style={[styles.cell, { borderStyle: 'dashed', borderColor: colors.bosque, backgroundColor: 'transparent' }]} />
        <Text variant="small">Límite aproximado del bosque</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space[2] },
  row: { flexDirection: 'row', flexWrap: 'wrap', columnGap: space[5] },
  item: { flexDirection: 'row', alignItems: 'center', gap: space[2], minHeight: 24 },
  dot: { borderRadius: 999, borderWidth: 1.5, borderColor: colors.ink },
  cell: { width: 16, height: 12, borderWidth: 1.5, borderRadius: 2 },
});
