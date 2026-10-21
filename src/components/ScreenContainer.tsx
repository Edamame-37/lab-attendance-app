/**
 * @file ScreenContainer.tsx
 * @description Komponen wrapper untuk layar praktikum.
 * Menyediakan layout terstandarisasi dengan SafeAreaView, ScrollView,
 * dan header informatif yang konsisten di semua tab.
 */

import React, { ReactNode } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  SafeAreaView,
  ViewStyle,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

/**
 * Interface properti untuk ScreenContainer
 */
export interface ScreenContainerProps {
  /** Judul utama halaman */
  title: string;
  /** Label badge kategori/modul */
  badge: string;
  /** Deskripsi singkat tujuan modul praktikum */
  description: string;
  /** URL referensi dokumentasi resmi yang dipelajari */
  docUrl: string;
  /** Elemen anak (konten layar) */
  children: ReactNode;
  /** Optional custom container style */
  contentContainerStyle?: ViewStyle;
}

/**
 * Komponen pembungkus layar standar
 */
export const ScreenContainer: React.FC<ScreenContainerProps> = ({
  title,
  badge,
  description,
  docUrl,
  children,
  contentContainerStyle,
}) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Modul */}
        <View style={styles.headerCard}>
          <View style={styles.badgeRow}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
          <Text style={styles.titleText}>{title}</Text>
          <Text style={styles.descText}>{description}</Text>
          <View style={styles.docBox}>
            <Text style={styles.docLabel}>Sumber Dokumentasi:</Text>
            <Text style={styles.docUrlText} numberOfLines={1}>
              {docUrl}
            </Text>
          </View>
        </View>

        {/* Konten Halaman */}
        {children}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#090d16', // Dark background
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  headerCard: {
    backgroundColor: '#131b2e',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  badgeText: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  titleText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 6,
  },
  descText: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
    marginBottom: 12,
  },
  docBox: {
    backgroundColor: '#0a0f1d',
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#38bdf8',
  },
  docLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  docUrlText: {
    fontSize: 12,
    color: '#38bdf8',
    fontWeight: '500',
  },
});
