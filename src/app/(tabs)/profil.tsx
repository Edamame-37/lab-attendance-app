import React, { useMemo } from 'react';
import { Alert, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '@/components/ScreenContainer';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { radius, spacing } from '@/theme';

export default function ProfileScreen(): React.JSX.Element {
  const { userProfile, user, role, availableRoles, setActiveRole, logout } = useAuth();
  const { tema, modeTema, setModeTema } = useApp();

  const initials = useMemo(
    () => (userProfile?.nama || 'Pengguna').split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase(),
    [userProfile?.nama]
  );

  const confirmLogout = (): void => {
    Alert.alert('Keluar dari akun', 'Sesi login pada perangkat ini akan diakhiri.', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Keluar', style: 'destructive', onPress: () => void logout() },
    ]);
  };

  return (
    <ScreenContainer>
      <View style={[styles.profileCard, { backgroundColor: tema.surface, borderColor: tema.border }]}>
        <View style={[styles.avatar, { backgroundColor: tema.accentSurface }]}>
          <Text style={[styles.avatarText, { color: tema.accentText }]}>{initials}</Text>
        </View>
        <Text style={[styles.name, { color: tema.textPrimary }]}>{userProfile?.nama || user?.displayName || 'Pengguna'}</Text>
        <Text style={[styles.identifier, { color: tema.accent }]}>{userProfile?.nomorInduk || '-'}</Text>
        <Text style={[styles.meta, { color: tema.textSecondary }]}>{user?.email || userProfile?.email || '-'}</Text>
        <Text style={[styles.meta, { color: tema.textSecondary }]}>
          {role === 'asisten' ? 'Asisten Laboratorium' : `Praktikan${userProfile?.kelas ? ` · ${userProfile.kelas}` : ''}`}
        </Text>
      </View>

      {availableRoles.length > 1 ? (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: tema.textPrimary }]}>Mode Akun</Text>
          <View style={[styles.card, { backgroundColor: tema.surface, borderColor: tema.border }]}>
            {availableRoles.map((availableRole) => {
              const selected = role === availableRole;
              return (
                <TouchableOpacity
                  key={availableRole}
                  style={[styles.roleRow, selected && { backgroundColor: tema.accentSurface }]}
                  onPress={() => void setActiveRole(availableRole)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                >
                  <Ionicons name={availableRole === 'asisten' ? 'shield-checkmark-outline' : 'school-outline'} size={20} color={tema.accent} />
                  <Text style={[styles.rowText, { color: tema.textPrimary }]}>
                    {availableRole === 'asisten' ? 'Asisten Laboratorium' : 'Praktikan'}
                  </Text>
                  {selected ? <Ionicons name="checkmark-circle" size={20} color={tema.accent} /> : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: tema.textPrimary }]}>Pengaturan</Text>
        <View style={[styles.card, { backgroundColor: tema.surface, borderColor: tema.border }]}>
          <View style={styles.settingRow}>
            <Ionicons name={modeTema === 'dark' ? 'moon-outline' : 'sunny-outline'} size={20} color={tema.accent} />
            <Text style={[styles.rowText, { color: tema.textPrimary }]}>Mode Gelap</Text>
            <Switch value={modeTema === 'dark'} onValueChange={(enabled) => setModeTema(enabled ? 'dark' : 'light')} />
          </View>
          <TouchableOpacity style={styles.settingRow} onPress={confirmLogout} accessibilityRole="button">
            <Ionicons name="log-out-outline" size={20} color="#DC2626" />
            <Text style={[styles.rowText, { color: '#DC2626' }]}>Keluar</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={[styles.version, { color: tema.textMuted }]}>PPK Mobile Praktikum · v1.1.0</Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  profileCard: { borderWidth: 1, borderRadius: radius.xl, padding: spacing.xl, alignItems: 'center' },
  avatar: { width: 60, height: 60, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  avatarText: { fontSize: 20, fontWeight: '800' },
  name: { fontSize: 18, fontWeight: '800', textAlign: 'center' },
  identifier: { fontSize: 13, fontWeight: '700', marginTop: 4 },
  meta: { fontSize: 12, marginTop: 3, textAlign: 'center' },
  section: { gap: spacing.sm },
  sectionTitle: { fontSize: 14, fontWeight: '800' },
  card: { borderWidth: 1, borderRadius: radius.lg, overflow: 'hidden' },
  roleRow: { minHeight: 52, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, gap: spacing.md },
  settingRow: { minHeight: 52, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, gap: spacing.md },
  rowText: { flex: 1, fontSize: 13, fontWeight: '600' },
  version: { fontSize: 11, textAlign: 'center', marginTop: spacing.sm },
});
