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
 * TabLayout mendefinisikan navigasi tab bawah untuk 4 modul praktikum:
 * 1. index (React Fundamentals)
 * 2. flexbox (Flexbox Layout)
 * 3. state-input (useState & Handling Text Input)
 * 4. modal-style (Modal & StyleSheet)
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
      {/* Tab 1: React Fundamentals */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Fundamental',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'cube' : 'cube-outline'}
              size={22}
              color={color as string}
            />
          ),
        }}
      />

      {/* Tab 2: Flexbox Layout */}
      <Tabs.Screen
        name="flexbox"
        options={{
          title: 'Flexbox',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'grid' : 'grid-outline'}
              size={22}
              color={color as string}
            />
          ),
        }}
      />

      {/* Tab 3: useState & Handling Text Input */}
      <Tabs.Screen
        name="state-input"
        options={{
          title: 'Input State',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'create' : 'create-outline'}
              size={22}
              color={color as string}
            />
          ),
        }}
      />

      {/* Tab 4: Modal & StyleSheet */}
      <Tabs.Screen
        name="modal-style"
        options={{
          title: 'Modal & Style',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'browsers' : 'browsers-outline'}
              size={22}
              color={color as string}
            />
          ),
        }}
      />
    </Tabs>
  );
}
