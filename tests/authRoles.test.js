import { normalizeProfileRoles, selectActiveRole, validateAuthProfile } from '../src/domain/auth';

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
    expect(selectActiveRole(['praktikan', 'asisten', 'aslab'], 'aslab')).toBe('aslab');
    expect(selectActiveRole(['praktikan'], 'asisten')).toBe('praktikan');
    expect(selectActiveRole([], 'praktikan')).toBeNull();
  });

  test('accepts aslab and deduplicates multi-role profiles', () => {
    expect(normalizeProfileRoles({ roles: ['aslab', 'asisten', 'aslab'] }))
      .toEqual(['aslab', 'asisten']);
  });

  test('accepts an aslab profile without a class', () => {
    expect(validateAuthProfile({
      uid: 'aslab-1',
      email: 'aslab@example.com',
      nama: 'Aslab Satu',
      nomorInduk: 'LAB-001',
      roles: ['aslab'],
      accountStatus: 'active',
    })).toMatchObject({ valid: true, roles: ['aslab'] });
  });

  test('still requires a class when a multi-role profile includes praktikan', () => {
    expect(validateAuthProfile({
      uid: 'multi-1',
      email: 'multi@example.com',
      nama: 'Multi Role',
      nomorInduk: '24060124140001',
      roles: ['praktikan', 'aslab'],
      accountStatus: 'active',
      kelas: '',
    })).toMatchObject({ valid: false, roles: ['praktikan', 'aslab'] });
  });
});
