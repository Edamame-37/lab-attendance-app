import { validateAuthProfile } from '../src/domain/auth';

const validProfile = {
  uid: 'student-1',
  email: 'student@example.com',
  nama: 'Praktikan Satu',
  nomorInduk: '12345678',
  kelas: 'TI-3A',
  roles: ['praktikan'],
  accountStatus: 'active',
};

describe('authentication profile validation', () => {
  test('accepts a complete active profile', () => {
    expect(validateAuthProfile(validProfile)).toMatchObject({
      valid: true,
      roles: ['praktikan'],
      accountStatus: 'active',
    });
  });

  test('rejects suspended accounts', () => {
    expect(validateAuthProfile({ ...validProfile, accountStatus: 'suspended' }))
      .toMatchObject({ valid: false, accountStatus: 'suspended' });
  });

  test('rejects profiles without an authorized role', () => {
    expect(validateAuthProfile({ ...validProfile, roles: ['admin'] }))
      .toMatchObject({ valid: false, roles: [] });
  });

  test('requires a class for practical students', () => {
    expect(validateAuthProfile({ ...validProfile, kelas: '' }))
      .toMatchObject({ valid: false });
  });

  test('allows an assistant-only account without a class', () => {
    expect(validateAuthProfile({
      ...validProfile,
      kelas: null,
      role: 'asisten',
      roles: ['asisten'],
    })).toMatchObject({ valid: true, roles: ['asisten'] });
  });
});
