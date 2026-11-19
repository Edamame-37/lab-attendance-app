import { useState, useEffect, useCallback } from 'react';
import { AppState } from 'react-native';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import NetInfo from '@react-native-community/netinfo';

// Mengelola izin dan kondisi perangkat untuk fitur lokasi dan notifikasi.
export default function useDevicePermissionsAndAlerts() {
  const [locationPermission, setLocationPermission] = useState('unknown');
  const [notificationPermission, setNotificationPermission] = useState('unknown');
  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [coordinates, setCoordinates] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notificationError, setNotificationError] = useState(null);

  // Memeriksa izin lokasi, GPS, dan koordinat pengguna.
  const checkLocationStatus = useCallback(async () => {
    try {
      const permission = await Location.getForegroundPermissionsAsync();
      setLocationPermission(permission.granted ? 'granted' : permission.status);

      const gps = await Location.hasServicesEnabledAsync();
      setGpsEnabled(gps);

      if (!permission.granted) {
        setCoordinates(null);
        setError('Izin lokasi belum diberikan.');
        return;
      }

      if (!gps) {
        setCoordinates(null);
        setError('GPS tidak aktif. Aktifkan lokasi perangkat.');
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setCoordinates({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });

      setError(null);
    } catch (err) {
      setCoordinates(null);
      setError('Lokasi gagal diperoleh. Periksa GPS perangkat.');
    }
  }, []);

  // Meminta izin akses lokasi.
  const requestLocationPermission = useCallback(async () => {
    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      setLocationPermission(permission.granted ? 'granted' : permission.status);

      if (permission.granted) {
        await checkLocationStatus();
      } else {
        setCoordinates(null);
        setError('Akses lokasi ditolak. Berikan izin melalui pengaturan aplikasi.');
      }

      return permission.granted;
    } catch (err) {
      setError('Gagal meminta izin lokasi.');
      return false;
    }
  }, [checkLocationStatus]);

  // Meminta izin notifikasi.
  const requestNotificationPermission = useCallback(async () => {
    try {
      let permission = await Notifications.getPermissionsAsync();

      if (!permission.granted) {
        permission = await Notifications.requestPermissionsAsync();
      }

      setNotificationPermission(permission.granted ? 'granted' : permission.status);

      if (!permission.granted) {
        setNotificationError('Izin notifikasi belum diberikan.');
      } else {
        setNotificationError(null);
      }

      return permission.granted;
    } catch (err) {
      setNotificationError('Gagal meminta izin notifikasi.');
      return false;
    }
  }, []);

  // Memeriksa ulang seluruh kondisi perangkat.
  const refreshDeviceStatus = useCallback(async () => {
    setLoading(true);

    await checkLocationStatus();

    try {
      const network = await NetInfo.fetch();

      setIsOnline(
        network.isConnected === true &&
        network.isInternetReachable !== false
      );
    } catch (err) {
      setIsOnline(false);
    }

    try {
      const permission = await Notifications.getPermissionsAsync();

      setNotificationPermission(
        permission.granted ? 'granted' : permission.status
      );
    } catch (err) {
      setNotificationError('Gagal memeriksa izin notifikasi.');
    }

    setLoading(false);
  }, [checkLocationStatus]);

  // Memantau perubahan jaringan dan aplikasi kembali aktif.
  useEffect(() => {
    refreshDeviceStatus();

    const unsubscribeNetwork = NetInfo.addEventListener((state) => {
      setIsOnline(
        state.isConnected === true &&
        state.isInternetReachable !== false
      );
    });

    const appStateListener = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        refreshDeviceStatus();
      }
    });

    return () => {
      unsubscribeNetwork();
      appStateListener.remove();
    };
  }, [refreshDeviceStatus]);

  return {
    locationPermission,
    notificationPermission,
    gpsEnabled,
    coordinates,
    isOnline,
    loading,
    error,
    notificationError,
    requestLocationPermission,
    requestNotificationPermission,
    refreshDeviceStatus,
  };
}