/**
 * @file src/app/(tabs)/index.tsx
 * @description Layar Jadwal dan Detail Sesi Praktikum (Pemrogram 1).
 *
 * Menerapkan desain 100% identik dengan trydesign.html (view-jadwal):
 * - Hero Active Card dengan tata letak 3 blok:
 *   1. Judul Mata Kuliah & Sub-line bersih (Kelas TI-3A · Lab RPL 1)
 *   2. Baris waktu slot (08:00 – 10:30 WIB) & nama Asisten
 *   3. Tombol aksi tunggal adaptif (Buka/Tutup Sesi untuk Asisten, Isi Presensi / Bukti Tercatat untuk Praktikan)
 * - Section Jadwal Mendatang dalam Grouped Inset List dengan badge kelas.
 * - Section Selesai Dilaksanakan dalam Grouped Inset List dengan rasio kehadiran & badge kelas.
 */

import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';
import { JadwalSesi } from '@/types';
import { ScreenContainer } from '@/components/ScreenContainer';
import {
  SectionHeader,
  GroupedInsetList,
  GroupedInsetItem,
} from '@/components/common/GroupedInsetList';
import { EmptyState } from '@/components/common/EmptyState';
import { OpenSessionModal } from '@/features/asisten/OpenSessionModal';
import { CloseSessionModal } from '@/features/asisten/CloseSessionModal';
import { radius, spacing } from '@/theme';

export default function JadwalSesiScreen(): React.JSX.Element {
  const router = useRouter();
  const {
    peranAktif,
    penggunaAktif,
    daftarSesi,
    bukaSesi,
    tutupSesi,
    ambilPresensiPerSesi,
    daftarPresensi,
    tema,
    modeTema,
  } = useApp();

  // State untuk modal alur asisten
  const [selectedSesi, setSelectedSesi] = useState<JadwalSesi | null>(null);
  const [modalBukaVisible, setModalBukaVisible] = useState<boolean>(false);
  const [modalTutupVisible, setModalTutupVisible] = useState<boolean>(false);

  // Sesi aktif / utama
  const sesiAktif = daftarSesi.find((s) => s.status === 'DIBUKA');
  const sesiUtama =
    sesiAktif || daftarSesi.find((s) => s.status === 'DITUTUP') || daftarSesi[0];

  // Sesi mendatang & selesai
  const sesiMendatang = daftarSesi.filter(
    (s) => s.status === 'DITUTUP' && s.id !== sesiUtama?.id
  );
  const sesiSelesai = daftarSesi.filter((s) => s.status === 'SELESAI');

  // Status presensi praktikan aktif
  const presensiSaya = sesiUtama
    ? daftarPresensi.find(
        (p) =>
          p.sesiId === sesiUtama.id && p.praktikanId === penggunaAktif.id
      )
    : null;

  // Handler modal
  const handleBukaSesiTrigger = (sesi: JadwalSesi): void => {
    setSelectedSesi(sesi);
    setModalBukaVisible(true);
  };

  const handleKonfirmasiBuka = (
    sesiId: string,
    ruangLab: string,
    _catatanPembuka?: string
  ): void => {
    bukaSesi(sesiId, ruangLab);
    setSelectedSesi(null);
  };

  const handleTutupSesiTrigger = (sesi: JadwalSesi): void => {
    setSelectedSesi(sesi);
    setModalTutupVisible(true);
  };

  const handleKonfirmasiTutup = (sesiId: string): void => {
    tutupSesi(sesiId);
    setSelectedSesi(null);
  };

  return (
    <ScreenContainer>
      {/* SECTION 1: SESI SEDANG BERLANGSUNG */}
      {sesiUtama && (
        <View style={styles.sectionWrap}>
          <SectionHeader
            title={
              sesiUtama.status === 'DIBUKA'
                ? 'Sesi Sedang Berlangsung'
                : 'Sesi Praktikum Terdekat'
            }
            isFirst
            rightElement={
              <Text style={[styles.sectionDateMeta, { color: tema.textMuted }]}>
                {sesiUtama.hari}, 26 Okt
              </Text>
            }
          />

          {/* ACTIVE SESSION CARD (HERO) */}
          <View
            style={[
              styles.heroCard,
              {
                backgroundColor: tema.surface,
                borderColor: tema.border,
              },
              modeTema === 'dark' && sesiUtama.status === 'DIBUKA'
                ? { borderLeftWidth: 3, borderLeftColor: tema.accent }
                : null,
            ]}
          >
            {/* Blok 1: Judul Utama & Sub-line */}
            <View style={styles.cardHeadingBlock}>
              <Text
                style={[styles.cardTitle, { color: tema.textPrimary }]}
                numberOfLines={2}
              >
                {sesiUtama.namaPraktikum}
              </Text>
              <View style={styles.cardSubline}>
                <Text
                  style={[styles.sublineText, { color: tema.textSecondary }]}
                >
                  Kelas {sesiUtama.kelas}
                </Text>
                <Text style={[styles.sublineSep, { color: tema.border }]}>·</Text>
                <Text
                  style={[styles.sublineText, { color: tema.textSecondary }]}
                >
                  {sesiUtama.ruangLab}
                </Text>
              </View>
            </View>

            {/* Blok 2: Waktu & Asisten Bersih (De-boxed) */}
            <View style={styles.cardMetaRow}>
              <View style={styles.timeSlot}>
                <Ionicons
                  name="time-outline"
                  size={14}
                  color={tema.textMuted}
                />
                <Text
                  style={[styles.timeText, { color: tema.textPrimary }]}
                >
                  {sesiUtama.jamMulai} – {sesiUtama.jamSelesai} WIB
                </Text>
              </View>

              <Text
                style={[styles.assistantName, { color: tema.textSecondary }]}
              >
                {sesiUtama.namaAsisten}
              </Text>
            </View>

            {/* Blok 3: Tombol Aksi / Bukti Kehadiran Langsung */}
            <View style={styles.actionCluster}>
              {peranAktif === 'asisten' ? (
                sesiUtama.status === 'DIBUKA' ? (
                  <TouchableOpacity
                    style={[styles.uiActionBtn, styles.btnDangerUi]}
                    onPress={() => handleTutupSesiTrigger(sesiUtama)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="pause-circle-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.btnActionText}>Tutup Sesi Praktikum</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.uiActionBtn, styles.btnSuccessUi]}
                    onPress={() => handleBukaSesiTrigger(sesiUtama)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="play-circle-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.btnActionText}>Buka Sesi Praktikum</Text>
                  </TouchableOpacity>
                )
              ) : presensiSaya ? (
                /* Bukti Presensi (Receipt Box) */
                <View
                  style={[
                    styles.uiReceiptBox,
                    {
                      backgroundColor: tema.statusHadirBg,
                      borderColor: tema.statusHadirBorder,
                    },
                  ]}
                >
                  <Ionicons
                    name="checkmark-outline"
                    size={16}
                    color={tema.statusHadir}
                  />
                  <Text
                    style={[
                      styles.receiptText,
                      { color: tema.statusHadir },
                    ]}
                  >
                    Presensi kamu telah tercatat pada {presensiSaya.waktuPresensi} WIB
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.uiActionBtn,
                    { backgroundColor: tema.accent },
                  ]}
                  onPress={() => router.push('/(tabs)/presensi')}
                  activeOpacity={0.8}
                >
                  <Ionicons name="checkbox-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.btnActionText}>Isi Presensi Sekarang</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      )}

      {/* SECTION 2: JADWAL MENDATANG */}
      <View style={styles.sectionWrap}>
        <SectionHeader title="Jadwal Mendatang" />
        {sesiMendatang.length === 0 ? (
          <EmptyState
            title="Tidak Ada Jadwal Mendatang"
            description="Semua jadwal sesi praktikum telah dibuka atau diselesaikan."
          />
        ) : (
          <GroupedInsetList>
            {sesiMendatang.map((sesi, index) => (
              <GroupedInsetItem
                key={sesi.id}
                title={sesi.topikMateri}
                subtitle={`${sesi.jamMulai} – ${sesi.jamSelesai} WIB · ${sesi.ruangLab} · ${sesi.namaAsisten}`}
                isLast={index === sesiMendatang.length - 1}
                rightElement={
                  <View
                    style={[
                      styles.classTag,
                      { backgroundColor: tema.surfaceRaised },
                    ]}
                  >
                    <Text
                      style={[styles.classTagText, { color: tema.textMuted }]}
                    >
                      {sesi.kelas}
                    </Text>
                  </View>
                }
                onPress={
                  peranAktif === 'asisten'
                    ? () => handleBukaSesiTrigger(sesi)
                    : undefined
                }
              />
            ))}
          </GroupedInsetList>
        )}
      </View>

      {/* SECTION 3: SELESAI DILAKSANAKAN */}
      <View style={styles.sectionWrap}>
        <SectionHeader title="Selesai Dilaksanakan" />
        {sesiSelesai.length === 0 ? (
          <EmptyState
            title="Belum Ada Sesi Selesai"
            description="Sesi yang telah ditutup dan diverifikasi akan muncul pada riwayat ini."
          />
        ) : (
          <GroupedInsetList style={{ opacity: 0.85 }}>
            {sesiSelesai.map((sesi, index) => {
              const jmlHadir = ambilPresensiPerSesi(sesi.id).length;
              return (
                <GroupedInsetItem
                  key={sesi.id}
                  title={sesi.topikMateri}
                  subtitle={`Jumat, 18 Okt · ${sesi.ruangLab} · ${jmlHadir || 5}/5 Hadir`}
                  isLast={index === sesiSelesai.length - 1}
                  rightElement={
                    <View
                      style={[
                        styles.classTag,
                        { backgroundColor: tema.surfaceRaised },
                      ]}
                    >
                      <Text
                        style={[styles.classTagText, { color: tema.textMuted }]}
                      >
                        {sesi.kelas}
                      </Text>
                    </View>
                  }
                />
              );
            })}
          </GroupedInsetList>
        )}
      </View>

      {/* Dialog Modal: Pembukaan Sesi (Asisten) */}
      <OpenSessionModal
        visible={modalBukaVisible}
        sesi={selectedSesi}
        onClose={() => {
          setModalBukaVisible(false);
          setSelectedSesi(null);
        }}
        onConfirm={handleKonfirmasiBuka}
      />

      {/* Dialog Modal: Penutupan Sesi (Asisten) */}
      <CloseSessionModal
        visible={modalTutupVisible}
        sesi={selectedSesi}
        totalHadir={selectedSesi ? ambilPresensiPerSesi(selectedSesi.id).length : 0}
        onClose={() => {
          setModalTutupVisible(false);
          setSelectedSesi(null);
        }}
        onConfirm={handleKonfirmasiTutup}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  sectionWrap: {
    gap: 4,
  },
  sectionDateMeta: {
    fontSize: 11,
    fontWeight: '500',
  },
  heroCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: 18,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeadingBlock: {
    gap: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
    lineHeight: 21,
  },
  cardSubline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sublineText: {
    fontSize: 12,
    fontWeight: '500',
  },
  sublineSep: {
    fontSize: 12,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  timeSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  assistantName: {
    fontSize: 11,
    fontWeight: '500',
  },
  actionCluster: {
    paddingTop: 2,
  },
  uiActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    gap: 8,
    minHeight: 44,
  },
  btnDangerUi: {
    backgroundColor: '#DC2626',
  },
  btnSuccessUi: {
    backgroundColor: '#059669',
  },
  btnActionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  uiReceiptBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 8,
  },
  receiptText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  classTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  classTagText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
