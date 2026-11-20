import { to_csv, to_geojson, to_report_html } from '../src/lib/export';
import { build_map_html, EMPTY_PAYLOAD, escape_html, map_payload } from '../src/lib/map_html';
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

  test('payload escapes tooltip text and only includes visible layers', () => {
    const payload = map_payload({
      incidents: [incident({ type: 'humo' })],
      zones: [{ key: 'k', center: { latitude: 1, longitude: 1 }, bounds: [[0, 0], [1, 1]], count: 1, score: 1, critical: false, low_confidence: true }],
      show_incidents: true,
      show_zones: false,
      selected_id: 'x1',
    });
    expect(payload.points).toHaveLength(1);
    expect(payload.points[0]).toMatchObject({ id: 'x1', level: 3 });
    expect(payload.cells).toHaveLength(0);
    expect(payload.selected).toBe('x1');
  });

  test('initial data cannot break out of the script block and SRI + CSP are present', () => {
    const payload = { ...EMPTY_PAYLOAD, points: [{ id: 'a', lat: 1, lon: 1, level: 1, color: '#000', tip: '</script><script>alert(1)</script>' }] };
    const html = build_map_html('view', payload);
    expect(html).not.toContain('</script><script>alert(1)');
    expect(html).toContain('integrity="sha256-');
    expect(html).toContain('leaflet@1.9.4');
    expect(html).toContain("connect-src 'none'");
  });

  test('pick mode is embedded as data, and messages are validated on the way in', () => {
    expect(build_map_html('pick', EMPTY_PAYLOAD)).toContain('var MODE="pick"');
    expect(build_map_html('view', EMPTY_PAYLOAD)).toContain("e.source!==window.parent");
  });
});
