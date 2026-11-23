import { calculateDistanceMeters, validateCoordinates } from '../src/services/locationService';

describe('locationService', () => {
  test('mengembalikan jarak nol untuk koordinat yang sama', () => {
    const point = { latitude: -6.2, longitude: 106.8 };
    expect(calculateDistanceMeters(point, point)).toBeCloseTo(0, 5);
  });

  test('menolak koordinat di luar rentang bumi', () => {
    expect(() => validateCoordinates(91, 106.8)).toThrow('Koordinat lokasi tidak valid');
    expect(() => validateCoordinates(-6.2, 181)).toThrow('Koordinat lokasi tidak valid');
  });
});
