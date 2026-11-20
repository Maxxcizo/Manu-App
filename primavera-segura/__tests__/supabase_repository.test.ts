import { create_supabase_repository } from '../src/data/supabase_repository';
import { ForbiddenError } from '../src/data/repository';

const mock_rpc = jest.fn();
const mock_auth = {
  signInWithPassword: jest.fn(),
  signOut: jest.fn(),
  getUser: jest.fn(),
};
const mock_single = jest.fn();
const mock_from = jest.fn(() => ({ select: () => ({ eq: () => ({ single: mock_single }) }) }));

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({ rpc: (...a: unknown[]) => mock_rpc(...a), auth: mock_auth, from: () => mock_from() })),
}));
jest.mock('expo-secure-store', () => ({ getItemAsync: jest.fn(), setItemAsync: jest.fn(), deleteItemAsync: jest.fn() }));

const ROW = { id: 'a', type_code: 'caida', severity: 'alta', occurred_on: '2026-11-01', latitude: 20.7, longitude: -103.5, location_precision: 'exacta', trail: null, status: 'pendiente', source: 'app' };

beforeEach(() => jest.clearAllMocks());

describe('supabase repository', () => {
  const repo = create_supabase_repository('https://x.supabase.co', 'anon');

  test('list_incidents sends filters to the RPC and maps rows', async () => {
    mock_rpc.mockResolvedValue({ data: [ROW], error: null });
    const result = await repo.list_incidents({ severity: 'alta', from: '2026-10-01' });
    expect(mock_rpc).toHaveBeenCalledWith('get_incidents', { p_from: '2026-10-01', p_to: null, p_type: null, p_severity: 'alta', p_trail: null });
    expect(result[0]).toMatchObject({ id: 'a', type: 'caida', severity: 'alta' });
  });

  test('create_incident calls the server-validated RPC', async () => {
    mock_rpc.mockResolvedValue({ data: 'new-id', error: null });
    const created = await repo.create_incident({ type: 'caida', severity: 'baja', occurred_on: '2026-11-01', latitude: '20.68', longitude: '-103.55' });
    expect(mock_rpc).toHaveBeenCalledWith('create_incident', { p_type: 'caida', p_severity: 'baja', p_occurred_on: '2026-11-01', p_lat: 20.68, p_lon: -103.55, p_trail: null });
    expect(created.id).toBe('new-id');
  });

  test('database permission error (42501) becomes ForbiddenError', async () => {
    mock_rpc.mockResolvedValue({ data: null, error: { code: '42501', message: 'forbidden' } });
    await expect(repo.set_incident_status('a', 'cerrado')).rejects.toBeInstanceOf(ForbiddenError);
    await expect(repo.set_user_role('u', 'administrador', true)).rejects.toBeInstanceOf(ForbiddenError);
  });

  test('other errors surface their message', async () => {
    mock_rpc.mockResolvedValue({ data: null, error: { code: '22023', message: 'location outside forest' } });
    await expect(repo.create_incident({ type: 'caida', severity: 'baja', occurred_on: '2026-11-01', latitude: 1, longitude: 1 })).rejects.toThrow('location outside forest');
  });

  test('sign_in hides the real auth error and rejects inactive accounts', async () => {
    mock_auth.signInWithPassword.mockResolvedValue({ error: { message: 'Invalid login credentials' } });
    await expect(repo.sign_in('a@b.c', 'x')).rejects.toThrow('Correo o contraseña incorrectos.');

    mock_auth.signInWithPassword.mockResolvedValue({ error: null });
    mock_auth.getUser.mockResolvedValue({ data: { user: { id: 'u', email: 'a@b.c' } } });
    mock_single.mockResolvedValue({ data: { id: 'u', full_name: 'Ana', role: 'rescatista', brigade: null, is_active: false }, error: null });
    await expect(repo.sign_in('a@b.c', 'x')).rejects.toThrow('desactivada');

    mock_single.mockResolvedValue({ data: { id: 'u', full_name: 'Ana', role: 'rescatista', brigade: null, is_active: true }, error: null });
    await expect(repo.sign_in('a@b.c', 'x')).resolves.toMatchObject({ role: 'rescatista', email: 'a@b.c' });
  });

  test('restore_session returns null without a user; sign_out calls the client', async () => {
    mock_auth.getUser.mockResolvedValue({ data: { user: null } });
    expect(await repo.restore_session()).toBeNull();
    await repo.sign_out();
    expect(mock_auth.signOut).toHaveBeenCalled();
  });
});
