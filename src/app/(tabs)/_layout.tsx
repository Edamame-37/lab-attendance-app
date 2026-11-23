/**
 * @file src/app/(tabs)/_layout.tsx
 * @description Layout untuk Bottom Tab Navigator pada Expo Router dengan dukungan tema dinamis.
 *
 * Menerapkan desain 100% identik dengan trydesign.html:
 * - Tinggi tab bar 60px dan pemusatan viewport mobile (maxWidth: 420px) pada web desktop.
 * - Indikator dot merah bulat 7px (tab-dot-badge) pada tab Presensi saat sesi dibuka.
 * - Ikon navigasi otentik: Jadwal (calendar), Presensi (checkbox), Rekap (stats-chart), Profil (person).
 * Referensi: https://docs.expo.dev/tutorial/add-navigation/
 */

import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';

export default function TabLayout(): React.JSX.Element {
  const { tema } = useApp();
  const { role } = useAuth();

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
          height: 60,
          paddingBottom: 6,
          paddingTop: 6,
          maxWidth: 420,
          width: '100%',
          alignSelf: 'center',
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      {/* Tab 1: Jadwal */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Jadwal',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'calendar' : 'calendar-outline'}
              size={20}
              color={color as string}
            />
          ),
        }}
      />

      <Tabs.Protected guard={role === 'praktikan'}>
        <Tabs.Screen
          name="presensi"
          options={{
            title: 'Presensi',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'checkbox' : 'checkbox-outline'} size={20} color={color as string} />
            ),
          }}
        />
      </Tabs.Protected>

      {/* Tab 3: Rekapitulasi */}
      <Tabs.Protected guard={role === 'asisten'}>
        <Tabs.Screen
          name="rekap"
          options={{
            title: 'Rekap',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'stats-chart' : 'stats-chart-outline'}
                size={20}
                color={color as string}
              />
            ),
          }}
        />
      </Tabs.Protected>

      {/* Tab 4: Profil */}
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={20}
              color={color as string}
            />
          ),
        }}
      />
    </Tabs>
  );
}
