import { is_inside_forest, validate_incident } from '../src/lib/validation';

const TODAY = new Date('2026-11-06');
const VALID = {
  type: 'fractura',
  severity: 'media',
  occurred_on: '2026-11-01',
  latitude: 20.68,
  longitude: -103.55,
};

describe('validate_incident (PB-11)', () => {
  test('UT-01 complete incident inside the forest is valid', () => {
    expect(validate_incident(VALID, TODAY)).toEqual({ valid: true, errors: {} });
  });

  test('UT-02..04 required fields are reported', () => {
    const r = validate_incident({ ...VALID, type: '', occurred_on: '', severity: '' }, TODAY);
    expect(r.valid).toBe(false);
    expect(r.errors.type).toMatch(/obligatorio/);
    expect(r.errors.date).toMatch(/obligatoria/);
    expect(r.errors.severity).toMatch(/obligatoria/);
  });

  test('UT-05 missing location', () => {
    const r = validate_incident({ ...VALID, latitude: '', longitude: '' }, TODAY);
    expect(r.errors.location).toMatch(/obligatoria/);
  });

  test('UT-06 location outside the forest (downtown Guadalajara)', () => {
    const r = validate_incident({ ...VALID, latitude: 20.6597, longitude: -103.3496 }, TODAY);
    expect(r.errors.location).toMatch(/dentro de La Primavera/);
  });

  test('UT-07 non-numeric coordinates', () => {
    const r = validate_incident({ ...VALID, latitude: 'abc' }, TODAY);
    expect(r.errors.location).toMatch(/números/);
  });

  test('UT-08 future date', () => {
    const r = validate_incident({ ...VALID, occurred_on: '2026-12-31' }, TODAY);
    expect(r.errors.date).toMatch(/futura/);
  });

  test('UT-09 forest boundaries', () => {
    expect(is_inside_forest(20.6, -103.67)).toBe(true);
    expect(is_inside_forest(20.59, -103.55)).toBe(false);
  });

  test('rejects unknown type, unknown severity and impossible dates', () => {
    const r = validate_incident({ ...VALID, type: 'x', severity: 'critica', occurred_on: '2026-02-31' }, TODAY);
    expect(r.errors.type).toMatch(/no es válido/);
    expect(r.errors.severity).toMatch(/no es válida/);
    expect(r.errors.date).toMatch(/formato/);
  });

  test('hostile text never becomes a valid type (C06)', () => {
    expect(validate_incident({ ...VALID, type: "'; DROP TABLE incidents;--" }, TODAY).valid).toBe(false);
    expect(validate_incident({ ...VALID, type: '<script>alert(1)</script>' }, TODAY).valid).toBe(false);
  });
});
