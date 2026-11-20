import { type_label } from './labels';
import type { Incident, IncidentFilters, Severity } from './types';
import { SEVERITY_WEIGHT } from './types';
import { filter_incidents } from './zones';

export type PeriodPreset = '7d' | '30d' | '90d' | 'all' | 'custom';

export const PERIOD_PRESETS: { value: Exclude<PeriodPreset, 'custom'>; label: string; days: number | null }[] = [
  { value: '7d', label: '7 días', days: 7 },
  { value: '30d', label: '30 días', days: 30 },
  { value: '90d', label: '90 días', days: 90 },
  { value: 'all', label: 'Todo', days: null },
];

export function iso_day(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function period_range(preset: PeriodPreset, today: Date = new Date()): { from?: string; to?: string } {
  const found = PERIOD_PRESETS.find((p) => p.value === preset);
  if (!found || found.days === null) return {};
  const from = new Date(today.getTime() - (found.days - 1) * 86400000);
  return { from: iso_day(from), to: iso_day(today) };
}

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

export function search_incidents(incidents: Incident[], query: string): Incident[] {
  const q = normalize(query);
  if (!q) return incidents;
  return incidents.filter((i) =>
    [i.id, type_label(i.type), i.trail ?? '', i.occurred_on].some((field) => normalize(field).includes(q)),
  );
}

export type SortKey = 'occurred_on' | 'severity' | 'type' | 'trail' | 'status';
export type SortDir = 'asc' | 'desc';

const STATUS_ORDER = { pendiente: 0, validado: 1, cerrado: 2 } as const;

export function sort_incidents(incidents: Incident[], key: SortKey, dir: SortDir): Incident[] {
  const factor = dir === 'asc' ? 1 : -1;
  const value = (i: Incident): string | number => {
    switch (key) {
      case 'severity':
        return SEVERITY_WEIGHT[i.severity];
      case 'type':
        return type_label(i.type);
      case 'trail':
        return i.trail ?? '';
      case 'status':
        return STATUS_ORDER[i.status];
      default:
        return i.occurred_on;
    }
  };
  // Stable: ties keep the newest first.
  return [...incidents].sort((a, b) => {
    const va = value(a);
    const vb = value(b);
    if (va < vb) return -1 * factor;
    if (va > vb) return 1 * factor;
    return b.occurred_on.localeCompare(a.occurred_on);
  });
}

export interface Page<T> {
  items: T[];
  page: number;
  pages: number;
  total: number;
  start: number; // 1-based index of the first item, 0 when empty
  end: number;
}

export function paginate<T>(items: T[], page: number, size: number): Page<T> {
  const pages = Math.max(1, Math.ceil(items.length / size));
  const current = Math.min(Math.max(1, page), pages);
  const start_index = (current - 1) * size;
  const slice = items.slice(start_index, start_index + size);
  return {
    items: slice,
    page: current,
    pages,
    total: items.length,
    start: slice.length ? start_index + 1 : 0,
    end: start_index + slice.length,
  };
}

export interface FilterState {
  query: string;
  severity: Severity | '';
  type: IncidentFilters['type'];
  trail: string;
  period: PeriodPreset;
  from: string;
  to: string;
}

export const EMPTY_FILTERS: FilterState = { query: '', severity: '', type: '', trail: '', period: 'all', from: '', to: '' };

export function to_incident_filters(state: FilterState, today: Date = new Date()): IncidentFilters {
  const range = state.period === 'custom' ? { from: state.from || undefined, to: state.to || undefined } : period_range(state.period, today);
  return { ...range, severity: state.severity, type: state.type, trail: state.trail || undefined };
}

export function apply_filters(incidents: Incident[], state: FilterState, today: Date = new Date()): Incident[] {
  return search_incidents(filter_incidents(incidents, to_incident_filters(state, today)), state.query);
}

export function active_filter_count(state: FilterState): number {
  return [state.severity, state.type, state.trail, state.period !== 'all' ? state.period : ''].filter(Boolean).length;
}
