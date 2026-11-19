import * as Location from 'expo-location';

const LOCATION_MAX_AGE_MS = 60_000;

export class LocationServiceError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'LocationServiceError';
    this.code = code;
  }
}

export const validateCoordinates = (latitude, longitude) => {
  if (
    latitude === null ||
    latitude === undefined ||
    longitude === null ||
    longitude === undefined
  ) {
    throw new LocationServiceError(
      'invalid-coordinates',
      'Koordinat latitude dan longitude wajib diisi.'
    );
  }

  const cleanLatStr = String(latitude).trim().replace(',', '.');
  const cleanLngStr = String(longitude).trim().replace(',', '.');

  if (cleanLatStr === '' || cleanLngStr === '') {
    throw new LocationServiceError(
      'invalid-coordinates',
      'Koordinat latitude dan longitude tidak boleh kosong.'
    );
  }

  const parsedLatitude = Number(cleanLatStr);
  const parsedLongitude = Number(cleanLngStr);

  if (
    !Number.isFinite(parsedLatitude) ||
    !Number.isFinite(parsedLongitude) ||
    parsedLatitude < -90 ||
    parsedLatitude > 90 ||
    parsedLongitude < -180 ||
    parsedLongitude > 180
  ) {
    throw new LocationServiceError(
      'invalid-coordinates',
      'Koordinat lokasi tidak valid. Latitude harus antara -90 dan 90, Longitude antara -180 dan 180.'
    );
  }

  return { latitude: parsedLatitude, longitude: parsedLongitude };
};

export const calculateDistanceMeters = (origin, destination) => {
  const from = validateCoordinates(origin?.latitude, origin?.longitude);
  const to = validateCoordinates(destination?.latitude, destination?.longitude);
  const earthRadiusMeters = 6_371_000;
  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const latitudeDelta = toRadians(to.latitude - from.latitude);
  const longitudeDelta = toRadians(to.longitude - from.longitude);
  const fromLatitude = toRadians(from.latitude);
  const toLatitude = toRadians(to.latitude);

  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(fromLatitude) *
      Math.cos(toLatitude) *
      Math.sin(longitudeDelta / 2) ** 2;

  return 2 * earthRadiusMeters * Math.asin(Math.sqrt(haversine));
};

export const getForegroundPermissionStatus = async () => {
  const permission = await Location.getForegroundPermissionsAsync();
  return permission.status;
};

export const requestForegroundLocationPermission = async () => {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (permission.status !== Location.PermissionStatus.GRANTED) {
    throw new LocationServiceError(
      'permission-denied',
      'Izin lokasi diperlukan untuk melakukan presensi.'
    );
  }
  return permission;
};

export const getCurrentDeviceLocation = async () => {
  const servicesEnabled = await Location.hasServicesEnabledAsync();
  if (!servicesEnabled) {
    throw new LocationServiceError(
      'services-disabled',
      'Layanan lokasi perangkat belum aktif. Aktifkan GPS lalu coba lagi.'
    );
  }

  let permissionStatus = await getForegroundPermissionStatus();
  if (permissionStatus !== Location.PermissionStatus.GRANTED) {
    const permission = await requestForegroundLocationPermission();
    permissionStatus = permission.status;
  }

  if (permissionStatus !== Location.PermissionStatus.GRANTED) {
    throw new LocationServiceError(
      'permission-denied',
      'Izin lokasi diperlukan untuk melakukan presensi.'
    );
  }

  const result = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });
  const coordinates = validateCoordinates(
    result.coords.latitude,
    result.coords.longitude
  );
  const capturedAt = Number(result.timestamp) || Date.now();

  if (Date.now() - capturedAt > LOCATION_MAX_AGE_MS || capturedAt > Date.now() + 5_000) {
    throw new LocationServiceError(
      'stale-location',
      'Lokasi perangkat sudah kedaluwarsa. Perbarui lokasi dan coba kembali.'
    );
  }

  return {
    ...coordinates,
    accuracyMeters: Number.isFinite(result.coords.accuracy)
      ? Math.max(0, result.coords.accuracy)
      : 0,
    capturedAt,
  };
};

export const formatLocationError = (error) => {
  if (error instanceof LocationServiceError) {
    return error.message;
  }

  const message = error?.message || '';
  if (message.toLowerCase().includes('permission')) {
    return 'Izin lokasi ditolak. Aktifkan izin lokasi dari pengaturan perangkat.';
  }

  return message || 'Lokasi perangkat tidak dapat diperoleh.';
};
