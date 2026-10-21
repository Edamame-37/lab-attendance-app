/**
 * @file App.tsx
 * @description Komponen utama aplikasi mobile untuk Praktikum Pengembangan Perangkat Bergerak (PPK).
 * File ini mendemonstrasikan penggunaan komponen dasar React Native:
 * - View: Kontainer layout (mirip <div> pada web)
 * - Text: Komponen untuk merender teks (semua teks di React Native harus berada dalam komponen <Text>)
 * - TouchableOpacity: Komponen tombol interaktif dengan efek feedback opacity saat ditekan
 * - StyleSheet: Manajemen styling berbasis Flexbox teroptimasi
 * - StatusBar: Pengaturan bar status perangkat (jam, sinyal, baterai)
 */

import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';

/**
 * Komponen utama App
 * @returns JSX Element antarmuka aplikasi praktikum
 */
export default function App(): React.JSX.Element {
  // State untuk menghitung interaksi tombol (contoh state management sederhana)
  const [counter, setCounter] = useState<number>(0);

  /**
   * Handler untuk menambah hitungan counter
   */
  const handleIncrement = (): void => {
    setCounter((prev) => prev + 1);
  };

  /**
   * Handler untuk mereset counter
   */
  const handleReset = (): void => {
    setCounter(0);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header Section */}
        <View style={styles.headerCard}>
          <Text style={styles.badge}>PPK Mobile</Text>
          <Text style={styles.title}>Praktikum React Native</Text>
          <Text style={styles.subtitle}>
            Proyek berhasil diinisialisasi dengan Expo & TypeScript.
          </Text>
        </View>

        {/* Info Card Section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Status Lingkungan</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Framework:</Text>
            <Text style={styles.infoValue}>Expo SDK 58 (React Native 0.88)</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Bahasa:</Text>
            <Text style={styles.infoValue}>TypeScript</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Build System:</Text>
            <Text style={styles.infoValue}>EAS (Expo Application Services)</Text>
          </View>
        </View>

        {/* Interactive Demo Section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Demo Interaktivitas</Text>
          <Text style={styles.cardDesc}>
            Uji coba state interaktif React Native di bawah ini:
          </Text>
          <View style={styles.counterBox}>
            <Text style={styles.counterText}>{counter}</Text>
          </View>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleIncrement}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>+ Tambah</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={handleReset}
              activeOpacity={0.8}
            >
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                Reset
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * StyleSheet untuk styling komponen.
 * Menggunakan prinsip Flexbox bawaan React Native.
 */
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a', // Slate 900
  },
  scrollContainer: {
    padding: 20,
    paddingTop: 36,
  },
  headerCard: {
    backgroundColor: '#1e293b', // Slate 800
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#3b82f6', // Blue 500
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 12,
  },
  cardDesc: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  infoLabel: {
    fontSize: 13,
    color: '#94a3b8',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#38bdf8', // Sky 400
  },
  counterBox: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  counterText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#38bdf8',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#475569',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#cbd5e1',
  },
});

