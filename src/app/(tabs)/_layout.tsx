/**
 * @file src/app/(tabs)/_layout.tsx
 * @description Layout untuk Bottom Tab Navigator pada Expo Router dengan dukungan tema dinamis.
 *
 * Menghubungkan 4 tab materi praktikum dengan ikon @expo/vector-icons serta
 * styling tab bar dinamis sesuai tema aktif (Light Mode Warm Stone vs Dark Mode Obsidian).
 * Referensi: https://docs.expo.dev/tutorial/add-navigation/
 */

import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';

/**
 * TabLayout mendefinisikan navigasi tab bawah untuk aplikasi Presensi Praktikum:
 * 1. index (Jadwal & Pengelolaan Sesi)
 * 2. presensi (Pencatatan Presensi Praktikan)
 * 3. rekap (Rekapitulasi Kehadiran Praktikum)
 * 4. profil (Profil Pengguna, Switcher Peran & Preferensi Tampilan)
 */
export default function TabLayout(): React.JSX.Element {
  const { daftarSesi, daftarPresensi, tema } = useApp();

  const jumlahSesiDibuka = daftarSesi.filter(
    (sesi) => sesi.status === 'DIBUKA'
  ).length;
  const totalPresensiTercatat = daftarPresensi.length;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: tema.accent,
        tabBarInactiveTintColor: tema.textMuted,
        tabBarStyle: {
          backgroundColor: tema.tabBar,
          borderTopColor: tema.border,
          borderTopWidth: 1,
          height: 62,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarBadgeStyle: {
          backgroundColor: tema.accent,
          color: '#FFFFFF',
          fontSize: 10,
          fontWeight: '700',
        },
      }}
    >
      {/* Tab 1: Jadwal & Kontrol Sesi */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Jadwal',
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
          tabBarBadge: jumlahSesiDibuka > 0 ? jumlahSesiDibuka : undefined,
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
          title: 'Rekap',
          tabBarBadge:
            totalPresensiTercatat > 0 ? totalPresensiTercatat : undefined,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'stats-chart' : 'stats-chart-outline'}
              size={22}
              color={color as string}
            />
          ),
        }}
      />

      {/* Tab 4: Profil & Preferensi Tampilan */}
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
