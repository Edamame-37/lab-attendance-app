/**
 * @file src/components/AppHeader.tsx
 * @description Header identitas pengguna terpadu untuk semua layar praktikum.
 *
 * Menerapkan pola non-AI-slop yang telah divalidasi pada trydesign.html:
 * - Sisi Kiri: Avatar inisial bulat, nama pengguna, dan peran/kelas terpadu.
 * - Sisi Kanan: Tombol aksi native 36x36px untuk membuka dialog alih peran.
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';
import { radius, spacing } from '@/theme';

export interface AppHeaderProps {
  /** Optional custom title override */
  customTitle?: string;
}

export const AppHeader: React.FC<AppHeaderProps> = () => {
  const { peranAktif, penggunaAktif, gantiPeran, tema, modeTema } = useApp();
  const [roleModalVisible, setRoleModalVisible] = useState<boolean>(false);

  // Dapatkan inisial 2 huruf dari nama pengguna
  const inisial = penggunaAktif.nama
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((kata) => kata[0].toUpperCase())
    .join('');

  const roleText =
    peranAktif === 'asisten'
      ? 'Asisten Laboratorium RPL'
      : `Praktikan · ${penggunaAktif.kelas || 'TI-3A'}`;

  return (
    <>
      <View style={styles.headerContainer}>
        {/* Blok Kiri: Identitas Pengguna */}
        <View style={styles.userBlock}>
          <View
            style={[
              styles.avatar,
              {
                backgroundColor: tema.accentSurface,
                borderColor: tema.border,
              },
            ]}
          >
            <Text style={[styles.avatarText, { color: tema.accentText }]}>
              {inisial}
            </Text>
          </View>
          <View style={styles.userMeta}>
            <Text style={[styles.userName, { color: tema.textPrimary }]}>
              {penggunaAktif.nama}
            </Text>
            <Text style={[styles.userRole, { color: tema.textSecondary }]}>
              {roleText}
            </Text>
          </View>
        </View>

        {/* Blok Kanan: Tombol Aksi Alih Peran (Native Icon Button) */}
        <TouchableOpacity
          style={[
            styles.actionButton,
            {
              backgroundColor: tema.surface,
              borderColor: tema.border,
            },
          ]}
          onPress={() => setRoleModalVisible(true)}
          activeOpacity={0.7}
          accessibilityLabel="Alih Peran Pengguna"
        >
          <Ionicons
            name="swap-horizontal"
            size={18}
            color={tema.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* Modal Dialog Alih Peran */}
      <Modal
        visible={roleModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRoleModalVisible(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setRoleModalVisible(false)}
        >
          <Pressable
            style={[
              styles.modalCard,
              {
                backgroundColor: tema.surface,
                borderColor: tema.border,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: tema.textPrimary }]}>
                Pilih Identitas Simulasi
              </Text>
              <TouchableOpacity
                onPress={() => setRoleModalVisible(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={20} color={tema.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalDesc, { color: tema.textSecondary }]}>
              Beralih sudut pandang pengguna untuk menguji alur kerja mahasiswa
              maupun asisten:
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
                  Ahmad Fauzi · 2141720001 (TI-3A)
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
                    styles.optionTitle,
                    {
                      color:
                        peranAktif === 'asisten'
                          ? tema.accentText
                          : tema.textPrimary,
                    },
                  ]}
                >
                  Asisten Laboratorium
                </Text>
                <Text
                  style={[styles.optionSubtitle, { color: tema.textSecondary }]}
                >
                  Rian Hidayat, S.Kom. · Koordinator RPL
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
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  userBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
  },
  userMeta: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
    lineHeight: 19,
  },
  userRole: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.gutter,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  modalDesc: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: spacing.lg,
  },
  roleOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  optionIconBox: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 17,
  },
  optionSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
});
