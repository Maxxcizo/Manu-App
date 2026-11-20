import { SEVERITIES, type Incident, type IncidentTypeCode, type Severity } from '../lib/types';

// SYNTHETIC data, used only until Más Bosque Manu delivers the real records (milestone H1/H2).
// Every row carries source = 'sintetico' and the UI shows a banner while they are loaded.

export const TRAILS = [
  'Las Planillas',
  'El Colli',
  'Río Caliente',
  'La Cebada',
  'Cerro El Tecolote',
  'Arroyo Seco',
] as const;

const CLUSTERS = [
  { trail: 'Las Planillas', lat: 20.6189, lon: -103.5281, weight: 5 },
  { trail: 'El Colli', lat: 20.6491, lon: -103.5094, weight: 4 },
  { trail: 'Río Caliente', lat: 20.7054, lon: -103.5732, weight: 3 },
  { trail: 'La Cebada', lat: 20.6712, lon: -103.6121, weight: 2 },
  { trail: 'Cerro El Tecolote', lat: 20.6903, lon: -103.5301, weight: 2 },
  { trail: 'Arroyo Seco', lat: 20.6402, lon: -103.5604, weight: 1 },
] as const;

const TYPES: IncidentTypeCode[] = [
  'caida',
  'caida',
  'fractura',
  'desorientacion',
  'deshidratacion',
  'picadura',
  'humo',
  'otro',
];

// Small deterministic PRNG so tests and demos are reproducible.
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function build_seed(count = 140): Incident[] {
  const random = mulberry32(2026);
  const pool = CLUSTERS.flatMap((c) => Array(c.weight).fill(c));
  const start = Date.UTC(2026, 8, 1); // 2026-09-01
  const span = 80; // days until 2026-11-20
  const incidents: Incident[] = [];

  for (let n = 0; n < count; n++) {
    const cluster = pool[Math.floor(random() * pool.length)];
    // Later period gets slightly more incidents around Las Planillas so comparison shows a trend.
    const day = Math.floor(random() * span);
    const date = new Date(start + day * 86400000).toISOString().slice(0, 10);
    const roll = random();
    const severity: Severity = roll < 0.5 ? SEVERITIES[0] : roll < 0.85 ? SEVERITIES[1] : SEVERITIES[2];
    incidents.push({
      id: `seed-${String(n + 1).padStart(3, '0')}`,
      type: TYPES[Math.floor(random() * TYPES.length)],
      severity,
      occurred_on: date,
      latitude: Number((cluster.lat + (random() - 0.5) * 0.02).toFixed(5)),
      longitude: Number((cluster.lon + (random() - 0.5) * 0.02).toFixed(5)),
      location_precision: random() < 0.8 ? 'exacta' : random() < 0.5 ? 'sendero' : 'kilometro',
      trail: cluster.trail,
      status: day < span - 7 ? 'cerrado' : random() < 0.5 ? 'validado' : 'pendiente',
      source: 'sintetico',
      created_by: null,
    });
  }
  return incidents.sort((a, b) => b.occurred_on.localeCompare(a.occurred_on));
}
