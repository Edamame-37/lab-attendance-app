import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { ScreenContainer } from '@/components/ScreenContainer';

type RoleRouteGuardProps = {
  allowedRole: 'praktikan' | 'asisten';
  children: React.ReactNode;
};

export function RoleRouteGuard({
  allowedRole,
  children,
}: RoleRouteGuardProps): React.JSX.Element {
  const router = useRouter();
  const { role, activeRole } = useAuth();
  const { peranAktif, gantiPeran, tema } = useApp();

  const effectiveRole = activeRole || peranAktif || role;

  if (effectiveRole !== allowedRole) {
    return (
      <ScreenContainer showHeader={false}>
        <View style={styles.container}>
          <View style={[styles.iconBox, { backgroundColor: '#FEE2E2' }]}>
            <Ionicons name="lock-closed" size={36} color="#DC2626" />
          </View>
          <Text style={[styles.title, { color: tema.textPrimary }]}>Akses Dibatasi</Text>
          <Text style={[styles.desc, { color: tema.textSecondary }]}>
            Halaman ini dikhususkan untuk peran{' '}
            <Text style={{ fontWeight: '700', color: tema.textPrimary }}>
              {allowedRole === 'asisten' ? 'Asisten Laboratorium' : 'Praktikan'}
            </Text>
            . Peran aktif Anda saat ini adalah "{effectiveRole || 'belum ditentukan'}".
          </Text>

          <View style={styles.actionGroup}>
            <TouchableOpacity
              style={[styles.switchButton, { backgroundColor: tema.accent }]}
              onPress={() => {
                gantiPeran(allowedRole);
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="swap-horizontal" size={18} color="#FFFFFF" />
              <Text style={styles.switchButtonText}>
                Beralih ke Peran {allowedRole === 'asisten' ? 'Asisten' : 'Praktikan'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.backButton, { borderColor: tema.border }]}
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-back" size={18} color={tema.textPrimary} />
              <Text style={[styles.backButtonText, { color: tema.textPrimary }]}>
                Kembali ke Beranda
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScreenContainer>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
    gap: 14,
  },
  iconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  desc: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 320,
  },
  actionGroup: {
    width: '100%',
    maxWidth: 320,
    gap: 10,
    marginTop: 16,
  },
  switchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
  },
  switchButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  backButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
