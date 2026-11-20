import { to_csv, to_geojson, to_report_html } from '../src/lib/export';
import { build_map_html, escape_html } from '../src/lib/map_html';
import type { Incident } from '../src/lib/types';

const incident = (over: Partial<Incident> = {}): Incident => ({
  id: 'x1', type: 'caida', severity: 'alta', occurred_on: '2026-11-01', latitude: 20.68, longitude: -103.55,
  location_precision: 'exacta', trail: 'El Colli', status: 'pendiente', source: 'app', created_by: null, ...over,
});

describe('exports (C06, C08)', () => {
  test('CSV neutralises spreadsheet formulas and has no personal fields', () => {
    const csv = to_csv([incident({ trail: '=HYPERLINK("http://evil")' })]);
    expect(csv).toContain(`"'=HYPERLINK(""http://evil"")"`);
    expect(csv.split('\n')[0]).toBe('id,tipo,gravedad,fecha,latitud,longitud,precision,sendero,estado');
  });
  test('GeoJSON uses [lon, lat]', () => {
    const geo = JSON.parse(to_geojson([incident()]));
    expect(geo.features[0].geometry.coordinates).toEqual([-103.55, 20.68]);
  });
  test('PDF html escapes content', () => {
    expect(to_report_html([incident({ trail: '<img src=x onerror=alert(1)>' })], '<b>t</b>')).not.toContain('<img src=x');
  });
});

describe('map html (C06)', () => {
  test('escape_html', () => {
    expect(escape_html(`<a href="x">'&</a>`)).toBe('&lt;a href=&quot;x&quot;&gt;&#39;&amp;&lt;/a&gt;');
  });
  test('data cannot break out of the script block and SRI is present', () => {
    const html = build_map_html({
      incidents: [incident({ occurred_on: '</script><script>alert(1)</script>' })],
      zones: [{ key: 'k', center: { latitude: 1, longitude: 1 }, bounds: [[0, 0], [1, 1]], count: 1, score: 1, critical: false, low_confidence: true }],
      show_incidents: true,
      show_zones: true,
    });
    expect(html).not.toContain('</script><script>alert(1)');
    expect(html).toContain('integrity="sha256-');
    expect(html).toContain('leaflet@1.9.4');
  });
  test('hidden layers are not embedded', () => {
    const html = build_map_html({ incidents: [incident()], zones: [], show_incidents: false, show_zones: false });
    expect(html).toContain('var points=[], cells=[]');
  });
});
