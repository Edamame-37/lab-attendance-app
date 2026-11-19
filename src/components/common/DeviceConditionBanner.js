
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Menampilkan kondisi perangkat dan tindakan untuk mengatasi masalah.
const DeviceConditionBanner = ({
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
  openSettings,
}) => {
  const conditions = [
    {
      label: 'Izin Lokasi',
      active: locationPermission === 'granted',
    },
    {
      label: 'GPS',
      active: gpsEnabled,
    },
    {
      label: 'Koordinat',
      active: !!coordinates,
    },
    {
      label: 'Internet',
      active: isOnline,
    },
    {
      label: 'Notifikasi',
      active: notificationPermission === 'granted',
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Kondisi Perangkat</Text>

      {loading ? (
        <ActivityIndicator color="#2F625B" style={styles.loader} />
      ) : null}

      {conditions.map((item) => (
        <View key={item.label} style={styles.row}>
          <Text style={styles.label}>{item.label}</Text>

          <View style={styles.status}>
            <Ionicons
              name={item.active ? 'check-circle' : 'alert-circle'}
              size={18}
              color={item.active ? '#2F9B69' : '#D97757'}
            />
            <Text
              style={[
                styles.statusText,
                { color: item.active ? '#2F9B69' : '#D97757' },
              ]}
            >
              {item.active ? 'Aktif' : 'Tidak aktif'}
            </Text>
          </View>
        </View>
      ))}

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          {locationPermission === 'blocked' && openSettings ? (
            <TouchableOpacity style={styles.button} onPress={openSettings}>
              <Text style={styles.buttonText}>Buka Pengaturan Aplikasi</Text>
            </TouchableOpacity>
          ) : locationPermission !== 'granted' ? (
            <TouchableOpacity
              style={styles.button}
              onPress={requestLocationPermission}
            >
              <Text style={styles.buttonText}>Izinkan Lokasi</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}

      {notificationError ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{notificationError}</Text>
          {notificationPermission === 'blocked' && openSettings ? (
            <TouchableOpacity style={styles.button} onPress={openSettings}>
              <Text style={styles.buttonText}>Buka Pengaturan Aplikasi</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.button}
              onPress={requestNotificationPermission}
            >
              <Text style={styles.buttonText}>Izinkan Notifikasi</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#263634',
    marginBottom: 12,
  },
  loader: {
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 6,
  },
  label: {
    fontSize: 13,
    color: '#263634',
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusText: {
    fontSize: 12,
  },
  errorBox: {
    backgroundColor: '#FFF1ED',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  errorText: {
    color: '#9F3F2C',
    fontSize: 12,
  },
  button: {
    backgroundColor: '#2F625B',
    padding: 9,
    borderRadius: 7,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default DeviceConditionBanner;