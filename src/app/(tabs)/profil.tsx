/**
 * @file src/app/(tabs)/profil.tsx
 * @description Layar Profil Pengguna dan Pengaturan Sistem (Pemrogram 3).
 *
 * Menerapkan desain 100% identik dengan trydesign.html (view-profil):
 * 1. Digital Student / Assistant ID Card (Avatar 52x52px, Nama, NIM aksen, Sub-line kelas)
 * 2. Statistik Kehadiran 2 Kolom (100% Tingkat Hadir & 2 Sesi Diselesaikan)
 * 3. Pengaturan & Sistem (Grouped Inset List):
 *    - Mode Tampilan (Dark Mode Switch: Obsidian Dark vs Warm Academic Stone)
 *    - Alih Peran Pengguna (Ganti sudut pandang Mahasiswa / Asisten)
 *    - Versi Aplikasi (v1.0.0 · Production Build · Badge Official)
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Switch,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';
import { ScreenContainer } from '@/components/ScreenContainer';
import {
  SectionHeader,
  GroupedInsetList,
  GroupedInsetItem,
} from '@/components/common/GroupedInsetList';
import { radius, spacing } from '@/theme';

export default function ProfilScreen(): React.JSX.Element {
  const {
    peranAktif,
    penggunaAktif,
    daftarSesi,
    ambilRiwayatPraktikan,
    gantiPeran,
    modeTema,
    setModeTema,
    tema,
  } = useApp();

  const [modalPeranVisible, setModalPeranVisible] = useState<boolean>(false);

  // Inisial avatar 2 huruf
  const inisial = penggunaAktif.nama
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((kata) => kata[0].toUpperCase())
    .join('');

  const sesiSelesaiCount = daftarSesi.filter(
    (s) => s.status === 'SELESAI'
  ).length;
  const riwayatAktif = ambilRiwayatPraktikan(penggunaAktif.id);

  return (
    <ScreenContainer>
      {/* SECTION 1: DIGITAL STUDENT / ASSISTANT ID CARD */}
      <View
        style={[
          styles.idCard,
          {
            backgroundColor: tema.surfaceRaised,
            borderColor: tema.border,
          },
        ]}
      >
        <View style={styles.idCardRow}>
          {/* Avatar Inisial Bulat */}
          <View
            style={[
              styles.avatarCircle,
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

          {/* Rincian Identitas Digital */}
          <View style={styles.idMeta}>
            <Text
              style={[styles.idName, { color: tema.textPrimary }]}
              numberOfLines={1}
            >
              {penggunaAktif.nama}
            </Text>
            <Text style={[styles.idNumber, { color: tema.accent }]}>
              {penggunaAktif.nomorInduk}
            </Text>
            <Text style={[styles.idSub, { color: tema.textSecondary }]}>
              {peranAktif === 'asisten'
                ? 'Asisten Laboratorium RPL · Koordinator'
                : `Teknik Informatika · Kelas ${penggunaAktif.kelas || 'TI-3A'}`}
            </Text>
          </View>
        </View>
      </View>

      {/* SECTION 2: STATISTIK KEHADIRAN (UI-STATS-2COL) */}
      <SectionHeader title="Statistik Kehadiran" />

      <View style={styles.stats2Col}>
        <View
          style={[
            styles.statCard,
            {
              backgroundColor: tema.surface,
              borderColor: tema.border,
            },
          ]}
        >
          <Text style={[styles.statVal, { color: tema.textPrimary }]}>
            100%
          </Text>
          <Text style={[styles.statLbl, { color: tema.textSecondary }]}>
            Tingkat Hadir
          </Text>
        </View>

        <View
          style={[
            styles.statCard,
            {
              backgroundColor: tema.surface,
              borderColor: tema.border,
            },
          ]}
        >
          <Text style={[styles.statVal, { color: tema.textPrimary }]}>
            {sesiSelesaiCount || riwayatAktif.length || 2}
          </Text>
          <Text style={[styles.statLbl, { color: tema.textSecondary }]}>
            Sesi Diselesaikan
          </Text>
        </View>
      </View>

      {/* SECTION 3: PENGATURAN & SISTEM */}
      <SectionHeader title="Pengaturan & Sistem" />

      <GroupedInsetList>
        {/* Switch Button: Mode Tampilan (Dark Mode) */}
        <GroupedInsetItem
          title="Mode Tampilan (Dark Mode)"
          subtitle={
            modeTema === 'dark'
              ? 'Obsidian Dark (Opsi 2 Aktif)'
              : 'Warm Academic Stone (Opsi 3 Aktif)'
          }
          leftElement={
            <View
              style={[
                styles.itemIconSquircle,
                {
                  backgroundColor: tema.accentSurface,
                },
              ]}
            >
              <Ionicons
                name={modeTema === 'dark' ? 'moon' : 'sunny'}
                size={17}
                color={tema.accentText}
              />
            </View>
          }
          rightElement={
            <Switch
              value={modeTema === 'dark'}
              onValueChange={(val) => setModeTema(val ? 'dark' : 'light')}
              thumbColor={modeTema === 'dark' ? tema.accent : '#FFFFFF'}
              trackColor={{
                false: '#D4D4D8',
                true: modeTema === 'dark' ? '#312E81' : tema.accentSurface,
              }}
              accessibilityLabel="Pengalih Mode Tampilan Gelap"
            />
          }
        />

        {/* Alih Peran Pengguna */}
        <GroupedInsetItem
          title="Alih Peran Pengguna"
          subtitle="Ganti sudut pandang Mahasiswa / Asisten"
          leftElement={
            <View
              style={[
                styles.itemIconSquircle,
                {
                  backgroundColor: tema.accentSurface,
                },
              ]}
            >
              <Ionicons
                name="swap-horizontal"
                size={17}
                color={tema.accentText}
              />
            </View>
          }
          rightElement={
            <Ionicons
              name="chevron-forward"
              size={16}
              color={tema.textMuted}
            />
          }
          onPress={() => setModalPeranVisible(true)}
        />

        {/* Versi Aplikasi */}
        <GroupedInsetItem
          title="Versi Aplikasi"
          subtitle="v1.0.0 · Production Build"
          isLast
          leftElement={
            <View
              style={[
                styles.itemIconSquircle,
                {
                  backgroundColor: tema.surfaceRaised,
                },
              ]}
            >
              <Ionicons
                name="code-working-outline"
                size={17}
                color={tema.textMuted}
              />
            </View>
          }
          rightElement={
            <View
              style={[
                styles.badgeVersion,
                { backgroundColor: tema.surfaceRaised },
              ]}
            >
              <Text
                style={[styles.badgeVersionText, { color: tema.textMuted }]}
              >
                Official
              </Text>
            </View>
          }
        />
      </GroupedInsetList>

      {/* Modal Dialog: Alih Peran */}
      <Modal
        visible={modalPeranVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalPeranVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: tema.surface,
                borderColor: tema.border,
              },
            ]}
          >
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitle, { color: tema.textPrimary }]}>
                Pilih Identitas Simulasi
              </Text>
              <TouchableOpacity
                onPress={() => setModalPeranVisible(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={20} color={tema.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalPeranDesc, { color: tema.textSecondary }]}>
              Ganti sudut pandang untuk menguji hak akses & tampilan:
            </Text>

            {/* Opsi Praktikan */}
            <TouchableOpacity
              style={[
                styles.roleChoiceCard,
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
                setModalPeranVisible(false);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.roleChoiceMeta}>
                <Text
                  style={[
                    styles.roleChoiceTitle,
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
                  style={[
                    styles.roleChoiceSub,
                    { color: tema.textSecondary },
                  ]}
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

            {/* Opsi Asisten */}
            <TouchableOpacity
              style={[
                styles.roleChoiceCard,
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
                setModalPeranVisible(false);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.roleChoiceMeta}>
                <Text
                  style={[
                    styles.roleChoiceTitle,
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
                  style={[
                    styles.roleChoiceSub,
                    { color: tema.textSecondary },
                  ]}
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
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  idCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  idCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
  },
  idMeta: {
    flex: 1,
    gap: 1,
  },
  idName: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  idNumber: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 1,
  },
  idSub: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  stats2Col: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    gap: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  statVal: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 30,
  },
  statLbl: {
    fontSize: 11,
    fontWeight: '500',
  },
  itemIconSquircle: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  badgeVersion: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  badgeVersionText: {
    fontSize: 11,
    fontWeight: '600',
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
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  modalPeranDesc: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: spacing.md,
  },
  roleChoiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    marginBottom: spacing.sm,
  },
  roleChoiceMeta: {
    flex: 1,
    gap: 2,
  },
  roleChoiceTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  roleChoiceSub: {
    fontSize: 11,
    fontWeight: '500',
  },
});
