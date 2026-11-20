import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { colors, space } from '../theme';
import { focus_ring, web_pointer, type PressState } from './interaction';
import { Text } from './Text';
import { IconButton } from './Button';

export interface Column<T, K extends string = string> {
  key: K;
  title: string;
  flex?: number;
  width?: number;
  sortable?: boolean;
  align?: 'left' | 'right';
  render: (row: T) => React.ReactNode;
}

// Desktop/tablet table. Header sorts; rows are keyboard focusable and open the row on Enter/click.
export function DataTable<T, K extends string>({
  columns,
  rows,
  row_key,
  on_row_press,
  selected_key,
  sort,
  on_sort,
  caption,
}: {
  columns: Column<T, K>[];
  rows: T[];
  row_key: (row: T) => string;
  on_row_press?: (row: T) => void;
  selected_key?: string | null;
  sort?: { key: K; dir: 'asc' | 'desc' };
  on_sort?: (key: K) => void;
  caption: string;
}) {
  const cell = (c: Column<T, K>): ViewStyle => (c.width ? { width: c.width } : { flex: c.flex ?? 1, minWidth: 0 });
  return (
    <View role="table" aria-label={caption}>
      <View style={[styles.row, styles.head]} role="row">
        {columns.map((c) => {
          const active = sort?.key === c.key;
          const content = (
            <>
              <Text variant="small_strong" tone={active ? 'default' : 'muted'}>
                {c.title}
              </Text>
              {c.sortable ? (
                <Ionicons name={active ? (sort!.dir === 'asc' ? 'arrow-up' : 'arrow-down') : 'swap-vertical'} size={14} color={active ? colors.ink : colors.ink_subtle} aria-hidden />
              ) : null}
            </>
          );
          return (
            <View key={c.key} style={[styles.cell, cell(c), c.align === 'right' && styles.right]} role="columnheader" aria-sort={active ? (sort!.dir === 'asc' ? 'ascending' : 'descending') : undefined}>
              {c.sortable && on_sort ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Ordenar por ${c.title.toLowerCase()}`}
                  onPress={() => on_sort(c.key)}
                  style={(s) => [styles.sort, web_pointer, focus_ring(s as PressState)] as ViewStyle[]}
                >
                  {content}
                </Pressable>
              ) : (
                <View style={styles.sort}>{content}</View>
              )}
            </View>
          );
        })}
      </View>
      {rows.map((row) => {
        const key = row_key(row);
        const selected = key === selected_key;
        return (
          <Pressable
            key={key}
            role="row"
            accessibilityState={{ selected }}
            disabled={!on_row_press}
            onPress={() => on_row_press?.(row)}
            style={(state) => {
              const s = state as PressState;
              return [
                styles.row,
                styles.body_row,
                (s.hovered || s.pressed) && styles.hover,
                selected && styles.selected,
                on_row_press ? web_pointer : null,
                focus_ring(s, -2),
              ] as ViewStyle[];
            }}
          >
            {selected ? <View style={styles.selected_bar} /> : null}
            {columns.map((c) => (
              <View key={c.key} style={[styles.cell, cell(c), c.align === 'right' && styles.right]} role="cell">
                {c.render(row)}
              </View>
            ))}
          </Pressable>
        );
      })}
    </View>
  );
}

export function Pagination({ page, pages, start, end, total, on_change, noun = 'incidentes' }: { page: number; pages: number; start: number; end: number; total: number; on_change: (page: number) => void; noun?: string }) {
  return (
    <View style={styles.pagination} role="navigation" aria-label="Paginación">
      <Text variant="small" tone="muted" style={{ flex: 1 }}>
        {total === 0 ? `Sin ${noun}` : `${start}–${end} de ${total} ${noun}`}
      </Text>
      <IconButton icon="chevron-back" label="Página anterior" onPress={() => page > 1 && on_change(page - 1)} />
      <Text variant="small_strong" accessibilityLabel={`Página ${page} de ${pages}`}>
        {page} / {pages}
      </Text>
      <IconButton icon="chevron-forward" label="Página siguiente" onPress={() => page < pages && on_change(page + 1)} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space[4], gap: space[3] },
  head: { minHeight: 44, backgroundColor: colors.surface_sunken, borderBottomWidth: 1, borderBottomColor: colors.line },
  body_row: { minHeight: 56, borderBottomWidth: 1, borderBottomColor: colors.line, backgroundColor: colors.surface },
  hover: { backgroundColor: colors.surface_hover },
  selected: { backgroundColor: colors.bosque_tint },
  selected_bar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: colors.bosque },
  cell: { paddingVertical: space[3] },
  right: { alignItems: 'flex-end' },
  sort: { flexDirection: 'row', alignItems: 'center', gap: space[1], minHeight: 28 },
  pagination: { flexDirection: 'row', alignItems: 'center', gap: space[2], paddingHorizontal: space[5], paddingVertical: space[2] },
});
