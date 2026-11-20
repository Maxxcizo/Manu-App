import { useCallback, useMemo, useState } from 'react';
import { active_filter_count, apply_filters, EMPTY_FILTERS, paginate, sort_incidents, type FilterState, type SortDir, type SortKey } from '../lib/filters';
import type { Incident } from '../lib/types';

// One filter model for the list, map and dashboard so every screen behaves the same.
export function useIncidentFilters(incidents: Incident[], { page_size = 20, initial }: { page_size?: number; initial?: Partial<FilterState> } = {}) {
  const [filters, set_filters] = useState<FilterState>({ ...EMPTY_FILTERS, ...initial });
  const [sort, set_sort] = useState<{ key: SortKey; dir: SortDir }>({ key: 'occurred_on', dir: 'desc' });
  const [page, set_page] = useState(1);

  const filtered = useMemo(() => apply_filters(incidents, filters), [incidents, filters]);
  const sorted = useMemo(() => sort_incidents(filtered, sort.key, sort.dir), [filtered, sort]);
  const paged = useMemo(() => paginate(sorted, page, page_size), [sorted, page, page_size]);

  const update = useCallback((patch: Partial<FilterState>) => {
    set_filters((f) => ({ ...f, ...patch }));
    set_page(1);
  }, []);
  const reset = useCallback(() => {
    set_filters(EMPTY_FILTERS);
    set_page(1);
  }, []);
  const toggle_sort = useCallback((key: SortKey) => {
    set_sort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: key === 'occurred_on' || key === 'severity' ? 'desc' : 'asc' }));
    set_page(1);
  }, []);

  return { filters, update, reset, filtered, sorted, paged, page, set_page, sort, toggle_sort, active_count: active_filter_count(filters) };
}

export type IncidentFiltersApi = ReturnType<typeof useIncidentFilters>;
