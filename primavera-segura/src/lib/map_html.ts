import { type_label, format_date, severity_label } from './labels';
import type { Incident, Zone } from './types';
import { FOREST_BOUNDS } from './validation';
import { severity } from '../theme/colors';

export function escape_html(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

// Embeds JSON inside a <script> safely (no "</script>" or HTML comment breakouts).
export function safe_json(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
}

export interface MapData {
  incidents: Incident[];
  zones: Zone[];
  show_incidents: boolean;
  show_zones: boolean;
  selected_id?: string | null;
  pick?: { lat: number; lng: number } | null;
  focus?: { lat: number; lng: number } | null;
}

export interface MapPayload {
  points: { id: string; lat: number; lon: number; level: number; color: string; tip: string }[];
  cells: { bounds: Zone['bounds']; critical: boolean; low: boolean; tip: string }[];
  selected: string | null;
  pick: { lat: number; lng: number } | null;
  focus: { lat: number; lng: number } | null;
}

// Only the fields the map needs; tooltip text is escaped because Leaflet renders it as HTML.
export function map_payload(data: MapData): MapPayload {
  return {
    points: data.show_incidents
      ? data.incidents.map((i) => ({
          id: i.id,
          lat: i.latitude,
          lon: i.longitude,
          level: severity[i.severity].level,
          color: severity[i.severity].fill,
          tip: `<strong>${escape_html(type_label(i.type))}</strong><br>${escape_html(format_date(i.occurred_on))}, gravedad ${escape_html(severity_label[i.severity].toLowerCase())}`,
        }))
      : [],
    cells: data.show_zones
      ? data.zones.map((z) => ({
          bounds: z.bounds,
          critical: z.critical,
          low: z.low_confidence,
          tip: escape_html(`${z.critical ? 'Zona crítica' : 'Zona con incidentes'}: ${z.count} incidentes, puntaje ${z.score}${z.low_confidence ? ' (pocos datos)' : ''}`),
        }))
      : [],
    selected: data.selected_id ?? null,
    pick: data.pick ?? null,
    focus: data.focus ?? null,
  };
}

export const EMPTY_PAYLOAD: MapPayload = { points: [], cells: [], selected: null, pick: null, focus: null };

const B = FOREST_BOUNDS;

// Leaflet is pinned to 1.9.4 with SRI hashes; no API key is needed (C03, C10).
// The document is built once per mode; data updates arrive through messages so the view is kept.
export function build_map_html(mode: 'view' | 'pick', initial: MapPayload): string {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=5">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: https://tile.openstreetmap.org https://unpkg.com; style-src 'unsafe-inline' https://unpkg.com; script-src 'unsafe-inline' https://unpkg.com; connect-src 'none'">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="">
<style>
html,body,#map{height:100%;margin:0;background:#E6EBE6;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
.leaflet-tile-pane{filter:saturate(.55) contrast(.96)}
.leaflet-bar{border:1px solid #D9E0DB!important;border-radius:10px!important;overflow:hidden;box-shadow:0 4px 16px rgba(15,42,34,.14)!important}
.leaflet-bar a{width:44px!important;height:44px!important;line-height:44px!important;font-size:20px!important;color:#17251F!important}
.leaflet-bar a:focus-visible{outline:2px solid #24617F;outline-offset:-2px}
.leaflet-control-attribution{font-size:11px;background:rgba(255,255,255,.85)!important}
.leaflet-tooltip{font-size:13px;line-height:1.35;color:#17251F;border:1px solid #D9E0DB;border-radius:8px;padding:6px 8px;box-shadow:0 4px 16px rgba(15,42,34,.14)}
.err{margin:0;padding:24px;color:#4F5F58;font-size:15px;line-height:1.5}
</style></head><body><div id="map" role="application" aria-label="Mapa de incidentes del Bosque La Primavera"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
<script>
(function(){
var MODE=${safe_json(mode)}, initial=${safe_json(initial)};
function send(m){m.source='primavera-map';var s=JSON.stringify(m);
  if(window.ReactNativeWebView){window.ReactNativeWebView.postMessage(s);}else if(window.parent!==window){window.parent.postMessage(s,'*');}}
if(typeof L==='undefined'){document.getElementById('map').innerHTML='<p class="err">No se pudo cargar el mapa. Revisa tu conexión e inténtalo de nuevo.</p>';send({type:'error',reason:'cdn'});return;}
var map=L.map('map',{zoomControl:false}).setView([20.68,-103.55],11);
L.control.zoom({position:'bottomright',zoomInTitle:'Acercar',zoomOutTitle:'Alejar'}).addTo(map);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:17,attribution:'&copy; OpenStreetMap'}).addTo(map);
L.rectangle([[${B.lat_min},${B.lon_min}],[${B.lat_max},${B.lon_max}]],{color:'#175B47',weight:1.5,fill:false,dashArray:'6 6',interactive:false}).addTo(map);
var cells=L.layerGroup().addTo(map),points=L.layerGroup().addTo(map),picked=L.layerGroup().addTo(map);
var RADIUS=[0,6,7.5,9.5];
function render(p){
  cells.clearLayers();points.clearLayers();picked.clearLayers();
  p.cells.forEach(function(c){
    L.rectangle(c.bounds,{color:c.critical?'#B3222A':'#D9661A',weight:c.critical?1.5:1,fillOpacity:c.critical?0.3:0.12,dashArray:c.low?'4 4':null})
      .bindTooltip(c.tip,{sticky:true}).addTo(cells);
  });
  var chosen=null;
  p.points.forEach(function(pt){
    var sel=pt.id===p.selected;
    var m=L.circleMarker([pt.lat,pt.lon],{radius:RADIUS[pt.level]+(sel?4:0),color:sel?'#FFFFFF':'#17251F',weight:sel?3:1.5,fillColor:pt.color,fillOpacity:.95});
    m.bindTooltip(pt.tip,{direction:'top',offset:[0,-6]});
    m.on('click',function(e){L.DomEvent.stopPropagation(e);send({type:'select',id:pt.id});});
    m.addTo(points);if(sel){chosen=m;}
  });
  if(chosen){chosen.bringToFront();}
  if(p.pick){L.circleMarker([p.pick.lat,p.pick.lng],{radius:10,color:'#FFFFFF',weight:3,fillColor:'#175B47',fillOpacity:1,interactive:false}).addTo(picked);}
  if(p.focus){map.setView([p.focus.lat,p.focus.lng],Math.max(map.getZoom(),14));}
}
window.__ps_update=function(p){try{render(p);}catch(e){}};
window.addEventListener('message',function(e){
  if(e.source!==window.parent){return;}
  var d=e.data;if(!d||d.source!=='primavera-app'||d.type!=='update'||!d.payload){return;}
  window.__ps_update(d.payload);
});
if(MODE==='pick'){map.getContainer().style.cursor='crosshair';map.on('click',function(e){send({type:'pick',lat:e.latlng.lat,lng:e.latlng.lng});});}
render(initial);send({type:'ready'});
})();
</script></body></html>`;
}
