/**
 * @file src/app/(tabs)/_layout.tsx
 * @description Layout untuk Bottom Tab Navigator pada Expo Router.
 * Menghubungkan 4 tab materi praktikum dengan ikon @expo/vector-icons.
 * Referensi: https://docs.expo.dev/tutorial/add-navigation/
 */

import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

/**
 * TabLayout mendefinisikan navigasi tab bawah untuk aplikasi Presensi Praktikum:
 * 1. index (Jadwal & Pengelolaan Sesi)
 * 2. presensi (Pencatatan Presensi Praktikan)
 * 3. rekap (Rekapitulasi Kehadiran Praktikum)
 * 4. profil (Profil Pengguna & Switcher Peran)
 */
export default function TabLayout(): React.JSX.Element {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#38bdf8', // Sky 400
        tabBarInactiveTintColor: '#64748b', // Slate 500
        tabBarStyle: {
          backgroundColor: '#0c1322',
          borderTopColor: '#1e293b',
          borderTopWidth: 1,
          height: 62,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      {/* Tab 1: Jadwal & Kontrol Sesi */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Jadwal Sesi',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'calendar' : 'calendar-outline'}
              size={22}
              color={color as string}
            />
          ),
        }}
      />

      {/* Tab 2: Presensi Praktikan */}
      <Tabs.Screen
        name="presensi"
        options={{
          title: 'Presensi',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'checkbox' : 'checkbox-outline'}
              size={22}
              color={color as string}
            />
          ),
        }}
      />

      {/* Tab 3: Rekapitulasi Kehadiran */}
      <Tabs.Screen
        name="rekap"
        options={{
          title: 'Rekapitulasi',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'clipboard' : 'clipboard-outline'}
              size={22}
              color={color as string}
            />
          ),
        }}
      />

      {/* Tab 4: Profil & Alih Peran */}
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={22}
              color={color as string}
            />
          ),
        }}
      />
    </Tabs>
  );
}
