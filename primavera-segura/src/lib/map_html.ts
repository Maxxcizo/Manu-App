import { INCIDENT_TYPES, type Incident, type Zone } from './types';
import { severity_color } from '../theme';

export function escape_html(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

// Embeds JSON inside a <script> safely (no "</script>" or HTML comment breakouts).
function safe_json(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
}

export interface MapData {
  incidents: Incident[];
  zones: Zone[];
  show_incidents: boolean;
  show_zones: boolean;
}

export function build_map_html({ incidents, zones, show_incidents, show_zones }: MapData): string {
  const label = (code: string) => INCIDENT_TYPES.find((t) => t.code === code)?.label ?? 'Otro';
  const points = show_incidents
    ? incidents.map((i) => ({
        lat: i.latitude,
        lon: i.longitude,
        color: severity_color[i.severity],
        popup: `<b>${escape_html(label(i.type))}</b><br>${escape_html(i.occurred_on)} · gravedad ${escape_html(i.severity)}`,
      }))
    : [];
  const cells = show_zones
    ? zones.map((z) => ({ bounds: z.bounds, critical: z.critical, low: z.low_confidence, popup: `Puntaje ${z.score} · ${z.count} incidentes` }))
    : [];

  // Leaflet is pinned to 1.9.4 with SRI hashes; no API key is needed (C03, C10).
  return `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: https://tile.openstreetmap.org https://unpkg.com; style-src 'unsafe-inline' https://unpkg.com; script-src 'unsafe-inline' https://unpkg.com; connect-src 'none'">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="">
<style>html,body,#map{height:100%;margin:0}</style></head><body><div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
<script>
var points=${safe_json(points)}, cells=${safe_json(cells)};
var map=L.map('map').setView([20.68,-103.55],11);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:17,attribution:'© OpenStreetMap'}).addTo(map);
L.rectangle([[20.60,-103.67],[20.78,-103.45]],{color:'#175b47',weight:2,fill:false,dashArray:'6'}).addTo(map);
cells.forEach(function(c){L.rectangle(c.bounds,{color:c.critical?'#b93e34':'#98601e',weight:1,fillOpacity:c.critical?0.35:0.12,dashArray:c.low?'4':null}).bindPopup(c.popup).addTo(map);});
points.forEach(function(p){L.circleMarker([p.lat,p.lon],{radius:6,color:'#fff',weight:1,fillColor:p.color,fillOpacity:0.9}).bindPopup(p.popup).addTo(map);});
</script></body></html>`;
}
