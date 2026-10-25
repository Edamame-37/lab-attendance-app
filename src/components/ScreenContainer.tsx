/**
 * @file src/components/ScreenContainer.tsx
 * @description Komponen wrapper utama untuk layar aplikasi praktikum.
 *
 * Menerapkan arsitektur layout 100% presisi dengan trydesign.html:
 * - Pembatasan viewport mobile (maxWidth: 420px, terpusat horizontal) saat dibuka di browser web.
 * - Injeksi font Figtree otomatis pada runtime web untuk tipografi humanis otentik.
 * - Mengintegrasikan AppHeader terpadu dengan dialog alih peran.
 * - Menggunakan kanvas dinamis bertema (Light Warm Stone vs Dark Obsidian).
 * - Memberikan padding horizontal 18px (spacing.gutter) untuk napas visual yang optimal.
 */

import React, { ReactNode, useEffect } from 'react';
import {
  StyleSheet,
  SafeAreaView,
  ScrollView,
  View,
  ViewStyle,
  StyleProp,
  Platform,
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

  // Injeksi Google Font Figtree pada runtime browser web agar identik dengan trydesign.html
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      if (!document.getElementById('figtree-font-link')) {
        const link = document.createElement('link');
        link.id = 'figtree-font-link';
        link.rel = 'stylesheet';
        link.href =
          'https://fonts.googleapis.com/css2?family=Figtree:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,600&display=swap';
        document.head.appendChild(link);
      }

      if (!document.getElementById('figtree-global-font-style')) {
        const styleTag = document.createElement('style');
        styleTag.id = 'figtree-global-font-style';
        styleTag.innerHTML = `
          *, *::before, *::after {
            font-family: 'Figtree', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', system-ui, sans-serif !important;
          }
        `;
        document.head.appendChild(styleTag);
      }
    }
  }, []);

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: tema.canvas },
        style,
      ]}
    >
      <StatusBar style={modeTema === 'dark' ? 'light' : 'dark'} />
      <View style={styles.webCenteringOuter}>
        <View style={styles.mobileShell}>
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
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  webCenteringOuter: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  mobileShell: {
    flex: 1,
    width: '100%',
    maxWidth: 420,
  },
  scrollContent: {
    paddingHorizontal: spacing.gutter,
    paddingTop: spacing.xs,
    paddingBottom: 40,
    gap: 14,
  },
});
