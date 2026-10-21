/**
 * @file src/app/+not-found.tsx
 * @description Layar fallback jika pengguna bernavigasi ke rute yang tidak terdaftar.
 * Referensi: https://docs.expo.dev/tutorial/add-navigation/
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Link, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

/**
 * NotFoundScreen menangani rute tidak dikenal (404)
 */
export default function NotFoundScreen(): React.JSX.Element {
  return (
    <>
      <Stack.Screen options={{ title: 'Rute Tidak Ditemukan' }} />
      <View style={styles.container}>
        <Ionicons name="search-outline" size={48} color="#64748b" style={styles.icon} />
        <Text style={styles.title}>Halaman Tidak Ditemukan</Text>
        <Text style={styles.description}>
          Rute yang Anda cari tidak tersedia dalam aplikasi praktikum ini.
        </Text>
        <Link href="/" style={styles.button}>
          Kembali ke Beranda
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    fontSize: 15,
    fontWeight: '600',
    color: '#38bdf8',
    textDecorationLine: 'underline',
  },
});
