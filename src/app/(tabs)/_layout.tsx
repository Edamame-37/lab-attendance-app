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
import { StyleSheet, View } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';

export default function TabLayout(): React.JSX.Element {
  const { daftarSesi, daftarPresensi, penggunaAktif, tema } = useApp();

  // Sesi yang sedang dibuka
  const sesiDibukaList = daftarSesi.filter((s) => s.status === 'DIBUKA');
  // Cek apakah praktikan aktif belum presensi pada sesi yang sedang dibuka
  const adaSesiPerluPresensi = sesiDibukaList.some(
    (sesi) =>
      !daftarPresensi.some(
        (p) => p.sesiId === sesi.id && p.praktikanId === penggunaAktif.id
      )
  );

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

      {/* Tab 2: Presensi dengan Red Dot Badge 7px persis trydesign.html */}
      <Tabs.Screen
        name="presensi"
        options={{
          title: 'Presensi',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconWrapper}>
              <Ionicons
                name={focused ? 'checkbox' : 'checkbox-outline'}
                size={20}
                color={color as string}
              />
              {adaSesiPerluPresensi && (
                <View
                  style={[
                    styles.tabDotBadge,
                    { borderColor: tema.tabBar },
                  ]}
                />
              )}
            </View>
          ),
        }}
      />

      {/* Tab 3: Rekapitulasi */}
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

const styles = StyleSheet.create({
  iconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabDotBadge: {
    position: 'absolute',
    top: -2,
    right: -5,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#DC2626',
    borderWidth: 1.5,
  },
});
