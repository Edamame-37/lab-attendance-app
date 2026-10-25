/**
 * @file src/app/_layout.tsx
 * @description Root layout untuk Expo Router dengan tema ganda (Light Warm Stone vs Dark Obsidian).
 *
 * Menerapkan arsitektur:
 * - AppProvider membungkus seluruh navigator.
 * - RootContent menghubungkan state tema (tema.canvas, tema.surface, tema.textPrimary) secara dinamis
 *   ke Stack screen options dan status bar.
 * Referensi: https://docs.expo.dev/tutorial/add-navigation/
 */

import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppProvider, useApp } from '@/context/AppContext';

/**
 * Komponen pembungkus navigasi internal yang mengakses state tema dari context
 */
function RootNavigator(): React.JSX.Element {
  const { tema, modeTema } = useApp();

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
    <AppProvider>
      <RootNavigator />
    </AppProvider>
  );
}
