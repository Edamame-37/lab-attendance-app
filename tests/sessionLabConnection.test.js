import { validateSessionLabConnection } from '../src/services/firestoreService';

const activeLab = {
  id: 'lab-rpl',
  isActive: true,
  location: { latitude: -6.2, longitude: 106.8 },
};

describe('session and laboratory connection', () => {
  test('accepts an active configured laboratory linked by id', () => {
    expect(validateSessionLabConnection({ labId: 'lab-rpl' }, activeLab)).toBe(true);
  });

  test('rejects missing, mismatched, inactive, and unconfigured laboratories', () => {
    expect(() => validateSessionLabConnection({}, activeLab)).toThrow('Pilih laboratorium');
    expect(() => validateSessionLabConnection({ labId: 'other' }, activeLab)).toThrow('tidak ditemukan');
    expect(() => validateSessionLabConnection({ labId: 'lab-rpl' }, { ...activeLab, isActive: false })).toThrow('nonaktif');
    expect(() => validateSessionLabConnection({ labId: 'lab-rpl' }, { ...activeLab, location: null })).toThrow('koordinat');
  });
});
