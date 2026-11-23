import { normalizeProfileRoles } from '../src/context/AuthContext';

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
});
