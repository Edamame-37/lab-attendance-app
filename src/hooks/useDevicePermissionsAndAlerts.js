import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, Linking, Platform } from 'react-native';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import NetInfo from '@react-native-community/netinfo';

// Mengelola izin dan kondisi perangkat untuk fitur lokasi dan notifikasi.
export default function useDevicePermissionsAndAlerts({ watchLocation = false } = {}) {
  const [locationPermission, setLocationPermission] = useState('unknown');
  const [notificationPermission, setNotificationPermission] = useState('unknown');
  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [coordinates, setCoordinates] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notificationError, setNotificationError] = useState(null);
  const locationWatcherRef = useRef(null);

  // Membuka pengaturan aplikasi di perangkat
  const openSettings = useCallback(async () => {
    try {
      await Linking.openSettings();
    } catch (err) {
      console.warn('Gagal membuka pengaturan perangkat:', err);
    }
  }, []);

  // Memeriksa izin lokasi, GPS, dan koordinat pengguna.
  const checkLocationStatus = useCallback(async () => {
    try {
      const permission = await Location.getForegroundPermissionsAsync();
      const isGranted = permission.granted;
      const isBlocked = !isGranted && permission.canAskAgain === false;

      setLocationPermission(isGranted ? 'granted' : isBlocked ? 'blocked' : permission.status);

      const gps = await Location.hasServicesEnabledAsync();
      setGpsEnabled(gps);

      if (!isGranted) {
        setCoordinates(null);
        setError(
          isBlocked
            ? 'Izin lokasi diblokir. Buka pengaturan aplikasi untuk memberikan izin.'
            : 'Izin lokasi belum diberikan.'
        );
        return;
      }

      if (!gps) {
        setCoordinates(null);
        setError('GPS tidak aktif. Aktifkan lokasi perangkat lalu coba lagi.');
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
    } catch (_err) {
      setCoordinates(null);
      setError('Lokasi gagal diperoleh. Pastikan GPS aktif.');
    }
  }, []);

  // Meminta izin akses lokasi.
  const requestLocationPermission = useCallback(async () => {
    try {
      const current = await Location.getForegroundPermissionsAsync();
      if (!current.granted && current.canAskAgain === false) {
        setLocationPermission('blocked');
        setError('Akses lokasi diblokir permanen. Silakan buka pengaturan aplikasi.');
        await openSettings();
        return false;
      }

      const permission = await Location.requestForegroundPermissionsAsync();
      const isGranted = permission.granted;
      const isBlocked = !isGranted && permission.canAskAgain === false;

      setLocationPermission(isGranted ? 'granted' : isBlocked ? 'blocked' : permission.status);

      if (isGranted) {
        await checkLocationStatus();
      } else {
        setCoordinates(null);
        setError(
          isBlocked
            ? 'Akses lokasi ditolak. Silakan berikan izin melalui pengaturan aplikasi.'
            : 'Akses lokasi ditolak.'
        );
      }

      return isGranted;
    } catch (_err) {
      setError('Gagal meminta izin lokasi.');
      return false;
    }
  }, [checkLocationStatus, openSettings]);

  // Meminta izin notifikasi.
  const requestNotificationPermission = useCallback(async () => {
    try {
      let permission = await Notifications.getPermissionsAsync();

      if (!permission.granted) {
        permission = await Notifications.requestPermissionsAsync();
      }

      const isGranted = permission.granted;
      const isBlocked = !isGranted && permission.canAskAgain === false;

      setNotificationPermission(isGranted ? 'granted' : isBlocked ? 'blocked' : permission.status);

      if (!isGranted) {
        setNotificationError(
          isBlocked
            ? 'Izin notifikasi diblokir. Aktifkan melalui pengaturan aplikasi.'
            : 'Izin notifikasi belum diberikan.'
        );
      } else {
        setNotificationError(null);
      }

      return isGranted;
    } catch (_err) {
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
    } catch (_err) {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
        setIsOnline(navigator.onLine);
      } else {
        setIsOnline(false);
      }
    }

    try {
      const permission = await Notifications.getPermissionsAsync();
      setNotificationPermission(
        permission.granted ? 'granted' : permission.canAskAgain === false ? 'blocked' : permission.status
      );
    } catch (_err) {
      setNotificationError('Gagal memeriksa izin notifikasi.');
    }

    setLoading(false);
  }, [checkLocationStatus]);

  // Memantau perubahan jaringan dan aplikasi kembali aktif.
  useEffect(() => {
    const initialRefreshTimer = setTimeout(() => {
      void refreshDeviceStatus();
    }, 0);

    let unsubscribeNetwork = () => {};
    try {
      unsubscribeNetwork = NetInfo.addEventListener((state) => {
        setIsOnline(
          state.isConnected === true &&
          state.isInternetReachable !== false
        );
      });
    } catch (_error) {}

    const appStateListener = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        refreshDeviceStatus();
      }
    });

    return () => {
      clearTimeout(initialRefreshTimer);
      unsubscribeNetwork();
      appStateListener.remove();
    };
  }, [refreshDeviceStatus]);

  // Location watcher aktif saat watchLocation=true dan dibersihkan saat unmount
  useEffect(() => {
    let isSubscribed = true;

    const startWatching = async () => {
      if (!watchLocation) return;
      try {
        const permission = await Location.getForegroundPermissionsAsync();
        const hasGps = await Location.hasServicesEnabledAsync();
        if (!permission.granted || !hasGps) return;

        locationWatcherRef.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 4000,
            distanceInterval: 5,
          },
          (newPos) => {
            if (isSubscribed && newPos?.coords) {
              setCoordinates({
                latitude: newPos.coords.latitude,
                longitude: newPos.coords.longitude,
              });
            }
          }
        );
      } catch (e) {
        console.warn('Gagal memulai location watcher:', e);
      }
    };

    startWatching();

    return () => {
      isSubscribed = false;
      if (locationWatcherRef.current) {
        locationWatcherRef.current.remove();
        locationWatcherRef.current = null;
      }
    };
  }, [watchLocation, locationPermission, gpsEnabled]);

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
    openSettings,
  };
}
