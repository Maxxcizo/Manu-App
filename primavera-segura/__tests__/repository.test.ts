import { create_demo_repository, ForbiddenError } from '../src/data/repository';

const NEW = { type: 'caida', severity: 'media', occurred_on: '2026-11-01', latitude: 20.68, longitude: -103.55 };

describe('demo repository access control (C01, C02)', () => {
  test('unauthenticated calls are denied', async () => {
    const repo = create_demo_repository();
    await expect(repo.list_incidents()).rejects.toBeInstanceOf(ForbiddenError);
    await expect(repo.create_incident(NEW)).rejects.toBeInstanceOf(ForbiddenError);
  });

  test('wrong password is rejected, logout clears the session', async () => {
    const repo = create_demo_repository();
    await expect(repo.sign_in('rescatista@demo.mx', 'nope')).rejects.toThrow(/incorrectos/);
    await repo.sign_in('rescatista@demo.mx', 'demo');
    expect(await repo.restore_session()).not.toBeNull();
    await repo.sign_out();
    expect(await repo.restore_session()).toBeNull();
  });

  test('a rescatista can create incidents but not manage users or statuses', async () => {
    const repo = create_demo_repository();
    await repo.sign_in('rescatista@demo.mx', 'demo');
    const created = await repo.create_incident(NEW);
    expect(created.status).toBe('pendiente');
    expect((await repo.list_incidents())[0].id).toBe(created.id);
    await expect(repo.list_users()).rejects.toBeInstanceOf(ForbiddenError);
    await expect(repo.set_user_role('u1', 'administrador', true)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(repo.set_incident_status(created.id, 'cerrado')).rejects.toBeInstanceOf(ForbiddenError);
  });

  test('server-side validation rejects a bad location', async () => {
    const repo = create_demo_repository();
    await repo.sign_in('rescatista@demo.mx', 'demo');
    await expect(repo.create_incident({ ...NEW, latitude: 20.6597, longitude: -103.3496 })).rejects.toThrow(/dentro de La Primavera/);
  });

  test('coordinator validates incidents; administrator manages roles', async () => {
    const repo = create_demo_repository();
    await repo.sign_in('coordinador@demo.mx', 'demo');
    const first = (await repo.list_incidents())[0];
    await repo.set_incident_status(first.id, 'validado');
    expect((await repo.get_incident(first.id))!.status).toBe('validado');
    await expect(repo.list_users()).rejects.toBeInstanceOf(ForbiddenError);
    await repo.sign_out();
    await repo.sign_in('admin@demo.mx', 'demo');
    await repo.set_user_role('u1', 'coordinador', false);
    expect((await repo.list_users()).find((u) => u.id === 'u1')).toMatchObject({ role: 'coordinador', is_active: false });
    await repo.sign_out();
    await expect(repo.sign_in('rescatista@demo.mx', 'demo')).rejects.toThrow();
  });
});
