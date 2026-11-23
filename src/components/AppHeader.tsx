import React, { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { radius, spacing } from '@/theme';
import type { PeranPengguna } from '@/types';

export interface AppHeaderProps {
  customTitle?: string;
}

export const AppHeader: React.FC<AppHeaderProps> = () => {
  const { peranAktif, penggunaAktif, gantiPeran, tema, modeTema } = useApp();
  const { userProfile } = useAuth();
  const [roleModalVisible, setRoleModalVisible] = useState<boolean>(false);

  // Label opsi peran kontekstual akun login
  const praktikanSubLabel = userProfile
    ? `${userProfile.nama} · ${userProfile.nomorInduk || 'Mahasiswa'}${userProfile.kelas ? ` (${userProfile.kelas})` : ''}`
    : 'Ahmad Fauzi · 2141720001 (TI-3A)';

  const asistenSubLabel = userProfile
    ? `${userProfile.nama} · Asisten Laboratorium`
    : 'Rian Hidayat, S.Kom. · Koordinator RPL';

  // Dapatkan inisial 2 huruf dari nama pengguna
  const inisial = penggunaAktif.nama
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((kata) => kata[0].toUpperCase())
    .join('');

  const changeRole = async (nextRole: PeranPengguna): Promise<void> => {
    await setActiveRole(nextRole);
    setRoleModalVisible(false);
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

      <Modal visible={roleModalVisible} transparent animationType="fade" onRequestClose={() => setRoleModalVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setRoleModalVisible(false)}>
          <Pressable style={[styles.modalCard, { backgroundColor: tema.surface, borderColor: tema.border }]}>
            <Text style={[styles.modalTitle, { color: tema.textPrimary }]}>Pilih Mode Akun</Text>
            <Text style={[styles.modalDescription, { color: tema.textSecondary }]}>
              Identitas tetap menggunakan akun {userProfile?.nama}. Hanya akses yang diberikan administrator yang tersedia.
            </Text>

            {/* Opsi 1: Praktikan */}
            <TouchableOpacity
              style={[
                styles.roleOptionCard,
                {
                  backgroundColor:
                    peranAktif === 'praktikan'
                      ? tema.accentSurface
                      : tema.surfaceRaised,
                  borderColor:
                    peranAktif === 'praktikan' ? tema.accent : tema.border,
                },
              ]}
              onPress={() => {
                gantiPeran('praktikan');
                setRoleModalVisible(false);
              }}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.optionIconBox,
                  {
                    backgroundColor:
                      peranAktif === 'praktikan'
                        ? tema.accent
                        : tema.borderSubtle,
                  },
                ]}
              >
                <Ionicons
                  name="school"
                  size={18}
                  color={
                    peranAktif === 'praktikan' ? '#FFFFFF' : tema.textMuted
                  }
                />
              </View>
              <View style={styles.optionContent}>
                <Text
                  style={[
                    styles.optionTitle,
                    {
                      color:
                        peranAktif === 'praktikan'
                          ? tema.accentText
                          : tema.textPrimary,
                    },
                  ]}
                >
                  Mahasiswa (Praktikan)
                </Text>
                <Text
                  style={[styles.optionSubtitle, { color: tema.textSecondary }]}
                >
                  {praktikanSubLabel}
                </Text>
              </View>
              {peranAktif === 'praktikan' && (
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={tema.accent}
                />
              )}
            </TouchableOpacity>

            {/* Opsi 2: Asisten Lab */}
            <TouchableOpacity
              style={[
                styles.roleOptionCard,
                {
                  backgroundColor:
                    peranAktif === 'asisten'
                      ? tema.accentSurface
                      : tema.surfaceRaised,
                  borderColor:
                    peranAktif === 'asisten' ? tema.accent : tema.border,
                },
              ]}
              onPress={() => {
                gantiPeran('asisten');
                setRoleModalVisible(false);
              }}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.optionIconBox,
                  {
                    backgroundColor:
                      peranAktif === 'asisten'
                        ? tema.accent
                        : tema.borderSubtle,
                  },
                ]}
              >
                <Ionicons
                  name="shield-checkmark"
                  size={18}
                  color={peranAktif === 'asisten' ? '#FFFFFF' : tema.textMuted}
                />
              </View>
              <View style={styles.optionContent}>
                <Text
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
                  Asisten Laboratorium
                </Text>
                <Text
                  style={[styles.optionSubtitle, { color: tema.textSecondary }]}
                >
                  {asistenSubLabel}
                </Text>
              </View>
              {peranAktif === 'asisten' && (
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={tema.accent}
                />
              )}
            </TouchableOpacity>
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
