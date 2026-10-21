/**
 * @file src/app/_layout.tsx
 * @description Root layout untuk Expo Router.
 * Mendefinisikan Stack Navigator utama yang membungkus (tabs) dan layar fallback +not-found.
 * Referensi: https://docs.expo.dev/tutorial/add-navigation/
 */

import React from 'react';
import { Stack } from 'expo-router';
import { AppProvider } from '@/context/AppContext';

/**
 * RootLayout mendefinisikan navigator root aplikasi menggunakan Stack,
 * dibungkus dengan AppProvider untuk manajemen state global.
 */
export default function RootLayout(): React.JSX.Element {
  return (
    <AppProvider>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#090d16',
          },
          headerTintColor: '#f8fafc',
          headerTitleStyle: {
            fontWeight: '700',
          },
          contentStyle: {
            backgroundColor: '#090d16',
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
    </AppProvider>
  );
}
