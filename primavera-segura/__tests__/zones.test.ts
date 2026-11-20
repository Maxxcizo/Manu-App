import { build_seed } from '../src/data/seed';
import {
  cell_key,
  compare_periods,
  critical_zones,
  filter_incidents,
  period_confidence,
  stats_by,
  stats_by_weekday,
} from '../src/lib/zones';
import type { Incident } from '../src/lib/types';

function make(n: number, lat: number, lon: number, severity: Incident['severity'], date = '2026-10-01'): Incident[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `t-${lat}-${lon}-${i}`,
    type: 'caida' as const,
    severity,
    occurred_on: date,
    latitude: lat,
    longitude: lon,
    location_precision: 'exacta' as const,
    trail: 'Las Planillas',
    status: 'cerrado' as const,
    source: 'sintetico' as const,
    created_by: null,
  }));
}

describe('seed', () => {
  test('is deterministic and labelled synthetic', () => {
    const a = build_seed(50);
    expect(a).toEqual(build_seed(50));
    expect(a.every((i) => i.source === 'sintetico')).toBe(true);
  });
});

describe('filter_incidents (PB-09)', () => {
  const data = [...make(2, 20.62, -103.52, 'alta', '2026-10-01'), ...make(3, 20.65, -103.5, 'baja', '2026-11-01')];
  test('combines period, severity and trail', () => {
    expect(filter_incidents(data, { from: '2026-10-15' })).toHaveLength(3);
    expect(filter_incidents(data, { severity: 'alta' })).toHaveLength(2);
    expect(filter_incidents(data, { from: '2026-10-15', severity: 'alta' })).toHaveLength(0);
    expect(filter_incidents(data, { trail: 'El Colli' })).toHaveLength(0);
    expect(filter_incidents(data, { type: 'caida', to: '2026-10-31' })).toHaveLength(2);
  });
});

describe('critical_zones (PB-07, PB-16)', () => {
  test('flags the hottest cell and marks sparse cells as low confidence', () => {
    const data = [
      ...make(8, 20.62, -103.52, 'alta'), // score 24
      ...make(6, 20.7, -103.6, 'baja'), // score 6
      ...make(1, 20.66, -103.58, 'baja'), // 1 incident
    ];
    const zones = critical_zones(data);
    expect(zones[0].critical).toBe(true);
    expect(zones[0].score).toBe(24);
    const sparse = zones.find((z) => z.count === 1)!;
    expect(sparse.low_confidence).toBe(true);
    expect(sparse.critical).toBe(false);
  });

  test('empty input gives no zones', () => {
    expect(critical_zones([])).toEqual([]);
  });

  test('cell_key groups nearby points', () => {
    expect(cell_key(20.6201, -103.5201)).toBe(cell_key(20.6202, -103.5202));
  });
});

describe('compare_periods (PB-10)', () => {
  const a = { from: '2026-09-01', to: '2026-09-30' };
  const b = { from: '2026-10-01', to: '2026-10-31' };
  const data = [
    ...make(2, 20.62, -103.52, 'media', '2026-09-10'),
    ...make(6, 20.62, -103.52, 'media', '2026-10-10'),
    ...make(5, 20.7, -103.6, 'baja', '2026-09-12'),
  ];

  test('detects worsening and improving zones', () => {
    const deltas = compare_periods(data, a, b);
    const worse = deltas.find((d) => d.trend === 'empeora')!;
    const better = deltas.find((d) => d.trend === 'mejora')!;
    expect(worse.delta).toBe(8);
    expect(better.delta).toBe(-5);
    expect(compare_periods(data, a, a).every((d) => d.trend === 'igual')).toBe(true);
  });

  test('period_confidence warns when data is insufficient', () => {
    expect(period_confidence(data, a)).toEqual({ count: 7, low_confidence: false });
    expect(period_confidence(data, { from: '2026-01-01', to: '2026-01-31' }).low_confidence).toBe(true);
  });
});

describe('statistics (PB-19)', () => {
  test('groups by field and by weekday', () => {
    const data = make(3, 20.62, -103.52, 'alta', '2026-11-02'); // Monday
    expect(stats_by(data, 'severity')).toEqual([['alta', 3]]);
    expect(stats_by_weekday(data).find((d) => d.name === 'Lun')!.count).toBe(3);
  });
});
