import { normalizeProfileRoles, selectActiveRole } from '../src/domain/auth';

describe('canonical account roles', () => {
  test('migrates a legacy assistant role without changing identity', () => {
    const profile = { uid: 'user-1', nama: 'Akun Utama', role: 'asisten' };
    expect(normalizeProfileRoles(profile)).toEqual(['asisten']);
    expect(profile.nama).toBe('Akun Utama');
  });

  test('deduplicates and rejects unknown roles', () => {
    expect(normalizeProfileRoles({ roles: ['praktikan', 'praktikan', 'admin', 'asisten'] }))
      .toEqual(['praktikan', 'asisten']);
  });

  test('uses a stored role only while it is still authorized', () => {
    expect(selectActiveRole(['praktikan', 'asisten'], 'asisten')).toBe('asisten');
    expect(selectActiveRole(['praktikan'], 'asisten')).toBe('praktikan');
    expect(selectActiveRole([], 'praktikan')).toBeNull();
  });
});
