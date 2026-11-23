import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Stack, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppProvider, useApp } from '@/context/AppContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';

function RootNavigator(): React.JSX.Element {
  const { tema, modeTema } = useApp();
  const { isAuthenticated, isLoading, role } = useAuth();

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: tema.canvas }]}>
        <ActivityIndicator size="large" color={tema.accent} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={modeTema === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: tema.surface },
          headerTintColor: tema.textPrimary,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: tema.canvas },
        }}
      >
        <Stack.Protected guard={!isAuthenticated} redirectTo={'/login' as Href}>
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="register" options={{ headerShown: false }} />
        </Stack.Protected>

        <Stack.Protected guard={isAuthenticated} redirectTo={'/login' as Href}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="peta-lab" options={{ title: 'Peta Laboratorium', headerShown: false }} />

          <Stack.Protected guard={role === 'asisten'} redirectTo="/(tabs)">
            <Stack.Screen name="sesi" options={{ title: 'Kelola Sesi Praktikum', headerShown: false }} />
            <Stack.Screen name="lokasi-lab" options={{ title: 'Lokasi Laboratorium', headerShown: false }} />
            <Stack.Screen name="review-izin" options={{ title: 'Review Pengajuan Izin' }} />
          </Stack.Protected>

          <Stack.Protected guard={role === 'praktikan'} redirectTo="/(tabs)">
            <Stack.Screen name="presensi-lokasi" options={{ title: 'Presensi Berbasis Lokasi', headerShown: false }} />
            <Stack.Screen name="pengajuan-izin" options={{ title: 'Pengajuan Izin' }} />
            <Stack.Screen name="status-izin" options={{ title: 'Status Pengajuan Izin' }} />
          </Stack.Protected>
        </Stack.Protected>

        <Stack.Screen name="+not-found" options={{ title: 'Halaman Tidak Ditemukan' }} />
      </Stack>
    </>
  );
}

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
    alignItems: 'center',
    justifyContent: 'center',
  },
});
