/**
 * @file src/app/_layout.tsx
 * @description Root layout untuk Expo Router dengan dukungan tema ganda dan integrasi Firebase Auth.
 *
 * Menerapkan arsitektur:
 * - AuthProvider membungkus aplikasi untuk mengelola state autentikasi Firebase.
 * - AppProvider membungkus aplikasi untuk mengelola tema dan data praktikum.
 * - RootNavigator melakukan conditional routing berdasarkan status autentikasi pengguna:
 *   - Loading state: Menampilkan indikator loading saat memeriksa sesi.
 *   - Unauthenticated: Menampilkan alur LoginScreen dan RegisterScreen.
 *   - Authenticated: Menampilkan navigator utama praktikum ((tabs)).
 *
 * @author Azlan (Integrasi Navigasi Utama Sprint 2)
 * @srs SRS-FT-01, SRS-FT-08
 */

import React, { useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppProvider, useApp } from '@/context/AppContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import LoginScreen from '@/screens/auth/LoginScreen';
import RegisterScreen from '@/screens/auth/RegisterScreen';

/**
 * Komponen pembungkus navigasi autentikasi (Login & Register)
 */
function AuthNavigator(): React.JSX.Element {
  const [authScreen, setAuthScreen] = useState<'login' | 'register'>('login');

  if (authScreen === 'register') {
    return <RegisterScreen onNavigateToLogin={() => setAuthScreen('login')} />;
  }

  return <LoginScreen onNavigateToRegister={() => setAuthScreen('register')} />;
}

/**
 * Komponen pembungkus navigasi internal yang mengakses state tema dan autentikasi
 */
function RootNavigator(): React.JSX.Element {
  const { tema, modeTema } = useApp();
  const { isAuthenticated, isLoading } = useAuth();

  // Tampilkan indikator loading saat sesi sedang diverifikasi
  if (isLoading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: tema?.canvas || '#F4F4F5' },
        ]}
      >
        <ActivityIndicator size="large" color={tema?.accent || '#047857'} />
      </View>
    );
  }

  // Jika belum terautentikasi, alihkan ke layar Auth (Login / Register)
  if (!isAuthenticated) {
    return (
      <>
        <StatusBar style={modeTema === 'dark' ? 'light' : 'dark'} />
        <AuthNavigator />
      </>
    );
  }

  // Jika sudah terautentikasi, tampilkan Root Stack Navigator
  return (
    <>
      <StatusBar style={modeTema === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: tema.surface,
          },
          headerTintColor: tema.textPrimary,
          headerTitleStyle: {
            fontWeight: '700',
          },
          contentStyle: {
            backgroundColor: tema.canvas,
          },
        }}
      >
        {/* Grup Bottom Tabs - header disembunyikan di root stack */}
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
          }}
        />

        {/* Fallback Screen untuk rute yang tidak ditemukan */}
        <Stack.Screen
          name="+not-found"
          options={{
            title: 'Halaman Tidak Ditemukan',
          }}
        />
      </Stack>
    </>
  );
}

/**
 * RootLayout mendefinisikan penyedia konteks utama aplikasi
 */
export default function RootLayout(): React.JSX.Element {
  return (
    <AuthProvider>
      <AppProvider>
        <RootNavigator />
      </AppProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
