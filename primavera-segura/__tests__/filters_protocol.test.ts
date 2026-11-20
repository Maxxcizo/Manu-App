import { layout_for } from '../src/hooks/use_breakpoint';
import {
  active_filter_count,
  apply_filters,
  EMPTY_FILTERS,
  paginate,
  period_range,
  search_incidents,
  sort_incidents,
  to_incident_filters,
} from '../src/lib/filters';
import { format_coords, format_date } from '../src/lib/labels';
import { parse_map_message } from '../src/lib/map_protocol';
import type { Incident } from '../src/lib/types';
import { go_to_section, phone_tabs, items_for, is_active } from '../src/components/nav_config';

const inc = (over: Partial<Incident>): Incident => ({
  id: 'a', type: 'caida', severity: 'baja', occurred_on: '2026-11-01', latitude: 20.68, longitude: -103.55,
  location_precision: 'exacta', trail: 'El Colli', status: 'pendiente', source: 'app', created_by: null, ...over,
});
const TODAY = new Date('2026-11-20T12:00:00Z');
const DATA = [
  inc({ id: 'a', occurred_on: '2026-11-19', severity: 'alta', type: 'humo', trail: 'Río Caliente', status: 'validado' }),
  inc({ id: 'b', occurred_on: '2026-11-10', severity: 'baja' }),
  inc({ id: 'c', occurred_on: '2026-09-01', severity: 'media', type: 'fractura', trail: 'Las Planillas', status: 'cerrado' }),
];

describe('filters', () => {
  test('period presets are inclusive day ranges ending today', () => {
    expect(period_range('7d', TODAY)).toEqual({ from: '2026-11-14', to: '2026-11-20' });
    expect(period_range('all', TODAY)).toEqual({});
  });

  test('search ignores accents and case and matches type, trail and id', () => {
    expect(search_incidents(DATA, 'rio').map((i) => i.id)).toEqual(['a']);
    expect(search_incidents(DATA, 'HUMO').map((i) => i.id)).toEqual(['a']);
    expect(search_incidents(DATA, 'c')).toHaveLength(3); // 'c' appears in several fields
    expect(search_incidents(DATA, '   ')).toHaveLength(3);
  });

  test('sorting by severity, status and text; ties keep newest first', () => {
    expect(sort_incidents(DATA, 'severity', 'desc').map((i) => i.id)).toEqual(['a', 'c', 'b']);
    expect(sort_incidents(DATA, 'status', 'asc').map((i) => i.id)).toEqual(['b', 'a', 'c']);
    expect(sort_incidents(DATA, 'trail', 'asc').map((i) => i.id)).toEqual(['b', 'c', 'a']);
    expect(sort_incidents(DATA, 'occurred_on', 'asc').map((i) => i.id)).toEqual(['c', 'b', 'a']);
    expect(sort_incidents(DATA, 'type', 'asc')[0].type).toBe('humo');
  });

  test('pagination clamps the page and reports the visible range', () => {
    const items = Array.from({ length: 45 }, (_, i) => i);
    expect(paginate(items, 3, 20)).toMatchObject({ page: 3, pages: 3, start: 41, end: 45, total: 45 });
    expect(paginate(items, 99, 20).page).toBe(3);
    expect(paginate([], 1, 20)).toMatchObject({ page: 1, pages: 1, start: 0, end: 0 });
  });

  test('apply_filters combines period, severity and search; custom ranges use the typed dates', () => {
    expect(apply_filters(DATA, { ...EMPTY_FILTERS, period: '30d' }, TODAY).map((i) => i.id)).toEqual(['a', 'b']);
    expect(apply_filters(DATA, { ...EMPTY_FILTERS, severity: 'alta', query: 'humo' }, TODAY)).toHaveLength(1);
    expect(to_incident_filters({ ...EMPTY_FILTERS, period: 'custom', from: '2026-09-01', to: '' }, TODAY)).toMatchObject({ from: '2026-09-01', to: undefined });
    expect(active_filter_count({ ...EMPTY_FILTERS, severity: 'baja', period: '7d', query: 'x' })).toBe(2);
  });
});

describe('map protocol (messages from the sandboxed map are untrusted)', () => {
  const msg = (o: object) => JSON.stringify({ source: 'primavera-map', ...o });
  test('accepts well-formed messages', () => {
    expect(parse_map_message(msg({ type: 'ready' }))).toEqual({ type: 'ready' });
    expect(parse_map_message(msg({ type: 'select', id: 'seed-001' }))).toEqual({ type: 'select', id: 'seed-001' });
    expect(parse_map_message(msg({ type: 'pick', lat: 20.123456789, lng: -103.5 }))).toEqual({ type: 'pick', lat: 20.123457, lng: -103.5 });
    expect(parse_map_message({ source: 'primavera-map', type: 'error', reason: 'cdn' })).toEqual({ type: 'error', reason: 'cdn' });
  });
  test('rejects foreign, malformed or hostile messages', () => {
    expect(parse_map_message(JSON.stringify({ type: 'ready' }))).toBeNull();
    expect(parse_map_message('not json')).toBeNull();
    expect(parse_map_message(msg({ type: 'select', id: '<img onerror=x>' }))).toBeNull();
    expect(parse_map_message(msg({ type: 'pick', lat: 'x', lng: 1 }))).toBeNull();
    expect(parse_map_message(msg({ type: 'pick', lat: 200, lng: 1 }))).toBeNull();
    expect(parse_map_message(msg({ type: 'error', reason: 'other' }))).toBeNull();
    expect(parse_map_message(msg({ type: 'navigate', url: 'https://evil' }))).toBeNull();
    expect(parse_map_message('x'.repeat(600))).toBeNull();
    expect(parse_map_message(null)).toBeNull();
  });
});

describe('labels and layout', () => {
  test('dates and coordinates', () => {
    expect(format_date('2026-11-08')).toBe('8 nov 2026');
    expect(format_date('2026-11-08', false)).toBe('8 nov');
    expect(format_date('bad')).toBe('bad');
    expect(format_coords(20.6, -103.5)).toBe('20.60000, -103.50000');
  });
  test('breakpoints follow the brief', () => {
    expect(layout_for(320, 568)).toMatchObject({ bp: 'xs', is_phone: true, gutter: 16 });
    expect(layout_for(430, 932).bp).toBe('sm');
    expect(layout_for(768, 1024)).toMatchObject({ bp: 'lg', is_tablet: true });
    expect(layout_for(1280, 800)).toMatchObject({ bp: 'xl', is_desktop: true });
    expect(layout_for(1440, 900).bp).toBe('xxl');
  });
});

describe('navigation by role', () => {
  test('phones never get more than 5 destinations', () => {
    for (const role of ['rescatista', 'coordinador', 'administrador'] as const) expect(phone_tabs(role).length).toBeLessThanOrEqual(5);
  });
  test('field responders get the report action; only admins see users', () => {
    expect(phone_tabs('rescatista').some((t) => t.primary && t.href === '/registrar')).toBe(true);
    expect(items_for('rescatista').map((i) => i.href)).not.toContain('/zonas');
    expect(items_for('coordinador').map((i) => i.href)).not.toContain('/admin');
    expect(items_for('administrador').map((i) => i.href)).toContain('/admin');
  });
  test('active matching includes nested routes', () => {
    expect(is_active('/incidente/abc', ['/incidentes', '/incidente'])).toBe(true);
    expect(is_active('/incidentes', ['/incidente'])).toBe(false);
  });
});

describe('go_to_section keeps the stack bounded', () => {
  const make = () => ({ push: jest.fn(), dismissTo: jest.fn() });
  test('home pushes a section; sections swap; home pops back', () => {
    const r = make();
    go_to_section(r, '/home', '/mapa');
    expect(r.push).toHaveBeenCalledWith('/mapa');
    go_to_section(r, '/mapa', '/zonas');
    expect(r.dismissTo).toHaveBeenCalledWith('/zonas');
    go_to_section(r, '/zonas', '/home');
    expect(r.dismissTo).toHaveBeenLastCalledWith('/home');
    go_to_section(r, '/zonas', '/zonas');
    expect(r.push).toHaveBeenCalledTimes(1);
  });
});
