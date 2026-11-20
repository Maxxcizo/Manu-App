import {
  SEVERITY_WEIGHT,
  type Incident,
  type IncidentFilters,
  type Zone,
  type ZoneDelta,
} from './types';

// ~500 m cells at this latitude (mirrors ST_SquareGrid in supabase/migrations/0001_schema.sql).
export const CELL_LAT = 0.0045;
export const CELL_LON = 0.0048;
export const MIN_INCIDENTS = 5; // below this a zone / period is flagged as low confidence (PB-16)
export const CRITICAL_PERCENTILE = 0.8;

export function cell_key(latitude: number, longitude: number): string {
  return `${Math.floor(latitude / CELL_LAT)}:${Math.floor(longitude / CELL_LON)}`;
}

function cell_geometry(key: string) {
  const [row, col] = key.split(':').map(Number);
  const south = row * CELL_LAT;
  const west = col * CELL_LON;
  return {
    center: { latitude: south + CELL_LAT / 2, longitude: west + CELL_LON / 2 },
    bounds: [
      [south, west],
      [south + CELL_LAT, west + CELL_LON],
    ] as [[number, number], [number, number]],
  };
}

export function filter_incidents(incidents: Incident[], filters: IncidentFilters = {}): Incident[] {
  return incidents.filter(
    (i) =>
      (!filters.from || i.occurred_on >= filters.from) &&
      (!filters.to || i.occurred_on <= filters.to) &&
      (!filters.type || i.type === filters.type) &&
      (!filters.severity || i.severity === filters.severity) &&
      (!filters.trail || i.trail === filters.trail),
  );
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return Infinity;
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(p * sorted.length) - 1));
  return sorted[index];
}

export function score_cells(incidents: Incident[]): Map<string, { count: number; score: number }> {
  const cells = new Map<string, { count: number; score: number }>();
  for (const incident of incidents) {
    const key = cell_key(incident.latitude, incident.longitude);
    const cell = cells.get(key) ?? { count: 0, score: 0 };
    cell.count += 1;
    cell.score += SEVERITY_WEIGHT[incident.severity];
    cells.set(key, cell);
  }
  return cells;
}

// Critical zone = score at or above the 80th percentile AND at least MIN_INCIDENTS incidents.
export function critical_zones(incidents: Incident[]): Zone[] {
  const cells = score_cells(incidents);
  const scores = [...cells.values()].map((c) => c.score).sort((a, b) => a - b);
  const threshold = percentile(scores, CRITICAL_PERCENTILE);
  return [...cells.entries()]
    .map(([key, cell]) => ({
      key,
      ...cell_geometry(key),
      count: cell.count,
      score: cell.score,
      critical: cell.score >= threshold && cell.count >= MIN_INCIDENTS,
      low_confidence: cell.count < MIN_INCIDENTS,
    }))
    .sort((a, b) => b.score - a.score);
}

export function compare_periods(
  incidents: Incident[],
  a: { from: string; to: string },
  b: { from: string; to: string },
): ZoneDelta[] {
  const cells_a = score_cells(filter_incidents(incidents, a));
  const cells_b = score_cells(filter_incidents(incidents, b));
  const keys = new Set([...cells_a.keys(), ...cells_b.keys()]);
  return [...keys]
    .map((key) => {
      const ca = cells_a.get(key) ?? { count: 0, score: 0 };
      const cb = cells_b.get(key) ?? { count: 0, score: 0 };
      const delta = cb.score - ca.score;
      return {
        key,
        center: cell_geometry(key).center,
        score_a: ca.score,
        score_b: cb.score,
        delta,
        trend: delta > 0 ? ('empeora' as const) : delta < 0 ? ('mejora' as const) : ('igual' as const),
        low_confidence: ca.count + cb.count < MIN_INCIDENTS,
      };
    })
    .sort((x, y) => Math.abs(y.delta) - Math.abs(x.delta));
}

export function period_confidence(incidents: Incident[], period: { from: string; to: string }) {
  const count = filter_incidents(incidents, period).length;
  return { count, low_confidence: count < MIN_INCIDENTS };
}

export function stats_by<K extends keyof Incident>(incidents: Incident[], field: K) {
  const result = new Map<string, number>();
  for (const incident of incidents) {
    const value = String(incident[field] ?? 'sin dato');
    result.set(value, (result.get(value) ?? 0) + 1);
  }
  return [...result.entries()].sort((a, b) => b[1] - a[1]);
}

export function stats_by_weekday(incidents: Incident[]) {
  const names = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const counts = new Array(7).fill(0);
  for (const incident of incidents) counts[new Date(`${incident.occurred_on}T12:00:00Z`).getUTCDay()] += 1;
  return names.map((name, i) => ({ name, count: counts[i] as number }));
}
