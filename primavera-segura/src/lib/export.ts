import { type_label } from './labels';
import { escape_html } from './map_html';
import type { Incident } from './types';

// Spreadsheet formula injection guard: prefix risky leading characters (C06).
const csv_cell = (v: string) => (/^[=+\-@\t\r]/.test(v) ? `'${v}` : v).replace(/"/g, '""');

export function to_csv(incidents: Incident[]): string {
  const header = 'id,tipo,gravedad,fecha,latitud,longitud,precision,sendero,estado';
  const rows = incidents.map((i) =>
    [i.id, type_label(i.type), i.severity, i.occurred_on, i.latitude, i.longitude, i.location_precision, i.trail ?? '', i.status]
      .map((c) => `"${csv_cell(String(c))}"`)
      .join(','),
  );
  return [header, ...rows].join('\n');
}

export function to_geojson(incidents: Incident[]): string {
  return JSON.stringify({
    type: 'FeatureCollection',
    features: incidents.map((i) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [i.longitude, i.latitude] },
      properties: { id: i.id, tipo: i.type, gravedad: i.severity, fecha: i.occurred_on, precision: i.location_precision, sendero: i.trail, estado: i.status },
    })),
  });
}

export function to_report_html(incidents: Incident[], title: string): string {
  const rows = incidents
    .slice(0, 200)
    .map((i) => `<tr><td>${escape_html(i.occurred_on)}</td><td>${escape_html(type_label(i.type))}</td><td>${escape_html(i.severity)}</td><td>${escape_html(i.trail ?? '')}</td></tr>`)
    .join('');
  return `<html><body style="font-family:sans-serif"><h1>${escape_html(title)}</h1><p>${incidents.length} incidentes. Las exportaciones omiten datos personales.</p><table border="1" cellpadding="4" cellspacing="0"><tr><th>Fecha</th><th>Tipo</th><th>Gravedad</th><th>Sendero</th></tr>${rows}</table></body></html>`;
}
