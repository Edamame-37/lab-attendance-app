import React, { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { radius, spacing } from '@/theme';
import type { PeranPengguna } from '@/types';

export interface AppHeaderProps {
  customTitle?: string;
}

const ROLE_LABELS: Record<PeranPengguna, string> = {
  praktikan: 'Praktikan',
  asisten: 'Asisten Praktikum (Asprak)',
  aslab: 'Asisten Laboratorium (Aslab)',
};

const ROLE_ICONS: Record<PeranPengguna, React.ComponentProps<typeof Ionicons>['name']> = {
  praktikan: 'school-outline',
  asisten: 'clipboard-outline',
  aslab: 'shield-checkmark-outline',
};

export const AppHeader: React.FC<AppHeaderProps> = ({ customTitle }) => {
  const router = useRouter();
  const { userProfile, role, availableRoles, setActiveRole } = useAuth();
  const { tema } = useApp();
  const [roleModalVisible, setRoleModalVisible] = useState(false);

  const initials = useMemo(
    () =>
      (userProfile?.nama || 'Pengguna')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word[0]?.toUpperCase())
        .join(''),
    [userProfile?.nama],
  );

  const roleText = role
    ? `${ROLE_LABELS[role]}${role === 'praktikan' && userProfile?.kelas ? ` · ${userProfile.kelas}` : ''}`
    : 'Role tidak tersedia';

  const changeRole = async (nextRole: PeranPengguna): Promise<void> => {
    if (nextRole === role) {
      setRoleModalVisible(false);
      return;
    }

    await setActiveRole(nextRole);
    setRoleModalVisible(false);
    router.replace('/(tabs)');
  };

  return (
    <>
      <View style={styles.headerContainer}>
        <View style={styles.userBlock}>
          <View style={[styles.avatar, { backgroundColor: tema.accentSurface, borderColor: tema.border }]}>
            <Text style={[styles.avatarText, { color: tema.accentText }]}>{initials}</Text>
          </View>
          <View style={styles.userMeta}>
            <Text style={[styles.userName, { color: tema.textPrimary }]} numberOfLines={1}>
              {customTitle || userProfile?.nama || 'Pengguna'}
            </Text>
            <Text style={[styles.userRole, { color: tema.textSecondary }]}>{roleText}</Text>
          </View>
        </View>

        {availableRoles.length > 1 ? (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: tema.surface, borderColor: tema.border }]}
            onPress={() => setRoleModalVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Ganti mode akun"
          >
            <Ionicons name="swap-horizontal" size={18} color={tema.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>

      <Modal
        visible={roleModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRoleModalVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setRoleModalVisible(false)}>
          <Pressable style={[styles.modalCard, { backgroundColor: tema.surface, borderColor: tema.border }]}>
            <Text style={[styles.modalTitle, { color: tema.textPrimary }]}>Pilih Mode Akun</Text>
            <Text style={[styles.modalDescription, { color: tema.textSecondary }]}>
              Identitas tetap menggunakan akun {userProfile?.nama}. Hanya role resmi akun yang tersedia.
            </Text>

            {availableRoles.map((availableRole) => {
              const selected = role === availableRole;
              return (
                <TouchableOpacity
                  key={availableRole}
                  style={[
                    styles.roleOption,
                    {
                      backgroundColor: selected ? tema.accentSurface : tema.surfaceRaised,
                      borderColor: selected ? tema.accent : tema.border,
                    },
                  ]}
                  onPress={() => void changeRole(availableRole)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`Mode ${ROLE_LABELS[availableRole]}`}
                >
                  <Ionicons
                    name={ROLE_ICONS[availableRole]}
                    size={20}
                    color={selected ? tema.accent : tema.textSecondary}
                  />
                  <Text style={[styles.roleOptionText, { color: tema.textPrimary }]}>
                    {ROLE_LABELS[availableRole]}
                  </Text>
                  {selected ? <Ionicons name="checkmark-circle" size={20} color={tema.accent} /> : null}
                </TouchableOpacity>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  headerContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4, paddingBottom: 8, marginBottom: 4 },
  userBlock: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: { width: 40, height: 40, borderRadius: radius.full, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 14, fontWeight: '700' },
  userMeta: { flex: 1 },
  userName: { fontSize: 15, fontWeight: '700' },
  userRole: { fontSize: 12, fontWeight: '500', marginTop: 1 },
  actionButton: { width: 40, height: 40, borderRadius: radius.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.55)', alignItems: 'center', justifyContent: 'center', padding: spacing.gutter },
  modalCard: { width: '100%', maxWidth: 360, borderRadius: radius.xl, borderWidth: 1, padding: spacing.xl },
  modalTitle: { fontSize: 16, fontWeight: '800' },
  modalDescription: { fontSize: 12, lineHeight: 18, marginTop: spacing.xs, marginBottom: spacing.lg },
  roleOption: { minHeight: 52, borderRadius: radius.lg, borderWidth: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, gap: spacing.md, marginBottom: spacing.sm },
  roleOptionText: { flex: 1, fontSize: 13, fontWeight: '700' },
});
