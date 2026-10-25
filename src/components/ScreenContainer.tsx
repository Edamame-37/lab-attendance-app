/**
 * @file src/components/ScreenContainer.tsx
 * @description Komponen wrapper utama untuk layar aplikasi praktikum.
 *
 * Menerapkan arsitektur layout bersih non-AI-slop:
 * - Menghilangkan kartu meta-polusi berulang ("Sprint 1 / Sumber Dokumentasi").
 * - Mengintegrasikan AppHeader terpadu dengan dialog alih peran.
 * - Menggunakan kanvas dinamis bertema (Light Warm Stone vs Dark Obsidian).
 * - Memberikan padding horizontal 18px (spacing.gutter) untuk napas visual yang optimal.
 */

import React, { ReactNode } from 'react';
import {
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useApp } from '@/context/AppContext';
import { AppHeader } from '@/components/AppHeader';
import { spacing } from '@/theme';

export interface ScreenContainerProps {
  /** Elemen anak (konten layar) */
  children: ReactNode;
  /** Menentukan apakah AppHeader terpadu ditampilkan di bagian atas (default: true) */
  showHeader?: boolean;
  /** Properti opsional untuk penyesuaian gaya kontainer scroll */
  contentContainerStyle?: StyleProp<ViewStyle>;
  /** Properti opsional untuk penyesuaian gaya area aman */
  style?: StyleProp<ViewStyle>;
  /** Properti legacy opsional untuk kompatibilitas ke belakang */
  title?: string;
  badge?: string;
  description?: string;
  docUrl?: string;
}

export const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  showHeader = true,
  contentContainerStyle,
  style,
}) => {
  const { tema, modeTema } = useApp();

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: tema.canvas },
        style,
      ]}
    >
      <StatusBar style={modeTema === 'dark' ? 'light' : 'dark'} />
      <ScrollView
        contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header terpadu (Avatar pengguna + nama + tombol alih peran) */}
        {showHeader && <AppHeader />}

        {/* Konten utama halaman */}
        {children}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.gutter,
    paddingTop: spacing.xs,
    paddingBottom: 40,
  },
});
