/**
 * @file src/app/(tabs)/index.tsx
 * @description Layar Jadwal dan Detail Sesi Praktikum (Pemrogram 1).
 *
 * Menerapkan filosofi non-AI-slop & breathing room:
 * - Menghilangkan nesting box bertingkat ganda dan banner meta-polusi.
 * - Sesi Berjalan dirender sebagai Hero Card tunggal dengan baris metadata bersih (de-boxed meta row).
 * - Menghilangkan redundant RoleSelector dan SectionCard profil karena sudah terpadu di AppHeader.
 * - Menampilkan sesi mendatang dan selesai menggunakan Grouped Inset List dengan 1px divider halus.
 * - Tombol aksi adaptif untuk Asisten (Buka/Tutup Sesi) dan Mahasiswa (Isi Presensi / Bukti Terkirim).
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

  // Pisahkan daftar sesi berdasarkan status siklus
  const sesiAktif = daftarSesi.find((s) => s.status === 'DIBUKA');
  // Jika tidak ada sesi DIBUKA, ambil sesi DITUTUP pertama sebagai hero / fokus berikutnya
  const sesiUtama = sesiAktif || daftarSesi.find((s) => s.status === 'DITUTUP') || daftarSesi[0];

  const sesiMendatang = daftarSesi.filter(
    (s) => s.status === 'DITUTUP' && s.id !== sesiUtama?.id
  );
  const sesiSelesai = daftarSesi.filter((s) => s.status === 'SELESAI');

  // Cek apakah praktikan aktif sudah presensi pada sesi utama
  const presensiSaya = sesiUtama
    ? daftarPresensi.find(
        (p) =>
          p.sesiId === sesiUtama.id && p.praktikanId === penggunaAktif.id
      )
    : null;

  // Total kehadiran pada sesi utama
  const totalHadirSesiUtama = sesiUtama
    ? ambilPresensiPerSesi(sesiUtama.id).length
    : 0;

  // Total mahasiswa kelas sesi utama (estimasi 25 mahasiswa)
  const totalMahasiswa = 25;

  /**
   * Handler pembukaan sesi
   */
  const handleBukaSesiTrigger = (sesi: JadwalSesi): void => {
    setSelectedSesi(sesi);
    setModalBukaVisible(true);
  };

  /**
   * Handler konfirmasi dari modal buka
   */
  const handleKonfirmasiBuka = (
    sesiId: string,
    ruangLab: string,
    _catatanPembuka?: string
  ): void => {
    bukaSesi(sesiId, ruangLab);
    setSelectedSesi(null);
  };

  /**
   * Handler penutupan sesi
   */
  const handleTutupSesiTrigger = (sesi: JadwalSesi): void => {
    setSelectedSesi(sesi);
    setModalTutupVisible(true);
  };

  /**
   * Handler konfirmasi dari modal tutup
   */
  const handleKonfirmasiTutup = (sesiId: string): void => {
    tutupSesi(sesiId);
    setSelectedSesi(null);
  };

  return (
    <ScreenContainer>
      {/* Sesi Utama: Sedang Berlangsung / Sesi Terdekat */}
      {sesiUtama && (
        <>
          <SectionHeader
            title={
              sesiUtama.status === 'DIBUKA'
                ? 'Sesi Sedang Berlangsung'
                : 'Sesi Praktikum Terdekat'
            }
            isFirst
            rightElement={
              <Text style={[styles.dateMeta, { color: tema.textMuted }]}>
                {sesiUtama.hari}
              </Text>
            }
          />

          {/* HERO CARD SESI UTAMA */}
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
            {/* Blok 1: Judul Mata Kuliah & Sub-line Kelas/Ruangan */}
            <View style={styles.headingBlock}>
              <View style={styles.titleRow}>
                <Text
                  style={[styles.matkulTitle, { color: tema.textPrimary }]}
                  numberOfLines={2}
                >
                  {sesiUtama.namaPraktikum}
                </Text>
                {sesiUtama.status === 'DIBUKA' && (
                  <View
                    style={[
                      styles.statusPill,
                      { backgroundColor: tema.statusHadirBg },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        { color: tema.statusHadir },
                      ]}
                    >
                      DIBUKA
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.sublineRow}>
                <Text
                  style={[styles.sublineText, { color: tema.textSecondary }]}
                >
                  {sesiUtama.topikMateri}
                </Text>
                <Text style={[styles.dotSep, { color: tema.border }]}>·</Text>
                <Text
                  style={[styles.sublineText, { color: tema.textSecondary }]}
                >
                  Kelas {sesiUtama.kelas}
                </Text>
                <Text style={[styles.dotSep, { color: tema.border }]}>·</Text>
                <Text
                  style={[styles.sublineText, { color: tema.textSecondary }]}
                >
                  {sesiUtama.ruangLab}
                </Text>
              </View>
            </View>

            {/* Blok 2: Waktu & Asisten Bersih (De-boxed Meta Row) */}
            <View style={styles.metaRow}>
              <View style={styles.timeSlot}>
                <Ionicons
                  name="time-outline"
                  size={15}
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

            {/* Metrik Kehadiran Sesi Berjalan */}
            {sesiUtama.status === 'DIBUKA' && (
              <View
                style={[
                  styles.metricRow,
                  { borderTopColor: tema.borderSubtle },
                ]}
              >
                <Text
                  style={[styles.metricLabel, { color: tema.textSecondary }]}
                >
                  Presensi Masuk:
                </Text>
                <Text
                  style={[styles.metricValue, { color: tema.textPrimary }]}
                >
                  {totalHadirSesiUtama}/{totalMahasiswa} Mahasiswa (
                  {Math.round((totalHadirSesiUtama / totalMahasiswa) * 100)}%)
                </Text>
              </View>
            )}

            {/* Blok 3: Tombol Aksi Kontekstual */}
            <View style={styles.actionBlock}>
              {peranAktif === 'asisten' ? (
                sesiUtama.status === 'DIBUKA' ? (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.btnDanger]}
                    onPress={() => handleTutupSesiTrigger(sesiUtama)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="pause-circle" size={17} color="#FFFFFF" />
                    <Text style={styles.btnActionText}>
                      Tutup Sesi Praktikum
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      { backgroundColor: tema.accent },
                    ]}
                    onPress={() => handleBukaSesiTrigger(sesiUtama)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="play-circle" size={17} color="#FFFFFF" />
                    <Text style={styles.btnActionText}>
                      Buka Sesi Praktikum
                    </Text>
                  </TouchableOpacity>
                )
              ) : presensiSaya ? (
                /* Bukti Presensi Praktikan (Receipt Badge Minimalis) */
                <View
                  style={[
                    styles.receiptBox,
                    {
                      backgroundColor: tema.statusHadirBg,
                      borderColor: tema.statusHadirBorder,
                    },
                  ]}
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={tema.statusHadir}
                  />
                  <Text
                    style={[
                      styles.receiptText,
                      { color: tema.statusHadir },
                    ]}
                  >
                    Presensi kamu telah tercatat ({presensiSaya.statusKehadiran}) ·{' '}
                    {presensiSaya.waktuPresensi} WIB
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    { backgroundColor: tema.accent },
                  ]}
                  onPress={() => router.push('/(tabs)/presensi')}
                  activeOpacity={0.8}
                >
                  <Ionicons name="clipboard-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.btnActionText}>Isi Presensi Sekarang</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </>
      )}

      {/* Sesi Mendatang (Grouped Inset List) */}
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
              subtitle={`${sesi.hari}, ${sesi.jamMulai} – ${sesi.jamSelesai} WIB · ${sesi.ruangLab} · ${sesi.namaAsisten}`}
              isLast={index === sesiMendatang.length - 1}
              rightElement={
                <View
                  style={[
                    styles.classBadge,
                    { backgroundColor: tema.surfaceRaised },
                  ]}
                >
                  <Text
                    style={[styles.classBadgeText, { color: tema.textMuted }]}
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

      {/* Selesai Dilaksanakan (Grouped Inset List) */}
      <SectionHeader title="Selesai Dilaksanakan" />
      {sesiSelesai.length === 0 ? (
        <EmptyState
          title="Belum Ada Sesi Selesai"
          description="Sesi yang telah ditutup dan diverifikasi akan muncul pada riwayat ini."
        />
      ) : (
        <GroupedInsetList style={{ opacity: 0.9 }}>
          {sesiSelesai.map((sesi, index) => {
            const jmlHadir = ambilPresensiPerSesi(sesi.id).length;
            return (
              <GroupedInsetItem
                key={sesi.id}
                title={sesi.topikMateri}
                subtitle={`${sesi.hari} · ${sesi.ruangLab} · ${jmlHadir}/${totalMahasiswa} Hadir`}
                isLast={index === sesiSelesai.length - 1}
                rightElement={
                  <View
                    style={[
                      styles.classBadge,
                      { backgroundColor: tema.surfaceRaised },
                    ]}
                  >
                    <Text
                      style={[styles.classBadgeText, { color: tema.textMuted }]}
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
  dateMeta: {
    fontSize: 11,
    fontWeight: '500',
  },
  heroCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    gap: 12,
  },
  headingBlock: {
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  matkulTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
    flex: 1,
    lineHeight: 21,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  sublineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 5,
  },
  sublineText: {
    fontSize: 12,
    fontWeight: '500',
  },
  dotSep: {
    fontSize: 11,
  },
  metaRow: {
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
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 8,
    marginTop: 2,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  metricValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  actionBlock: {
    paddingTop: 2,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: radius.md,
    gap: 8,
    minHeight: 44,
  },
  btnDanger: {
    backgroundColor: '#DC2626',
  },
  btnActionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  receiptBox: {
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
  classBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  classBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
