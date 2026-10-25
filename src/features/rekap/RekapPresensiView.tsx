/**
 * @file src/features/rekap/RekapPresensiView.tsx
 * @description Modul Rekapitulasi Kehadiran Praktikum (Pemrogram 3).
 *
 * Menerapkan prinsip non-AI-slop & breathing room:
 * - Menghilangkan nesting box berulang ("box-in-a-box syndrome").
 * - Metrik ketercapaian 2 kolom ringkas (ui-stats-2col) dengan angka proporsional humanist.
 * - Baris data presensi mahasiswa 2-line bersih (nama/NIM di kiri, jam & status teks di kanan).
 * - Pemilih sesi praktikum horizontal ringkas dengan status pil subtle.
 * - Modal rincian kehadiran yang responsif terhadap tema Light/Dark.
 */

import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';
import { CatatanPresensi, StatusKehadiran, Pengguna } from '@/types';
import { EmptyState } from '@/components/common/EmptyState';
import { SectionHeader } from '@/components/common/GroupedInsetList';
import { radius, spacing } from '@/theme';

type FilterStatusRekap = 'SEMUA' | StatusKehadiran | 'BELUM_PRESENSI';

export const RekapPresensiView: React.FC = () => {
  const {
    peranAktif,
    penggunaAktif,
    daftarSesi,
    daftarPraktikan,
    ambilPresensiPerSesi,
    ambilRiwayatPraktikan,
    tema,
    modeTema,
  } = useApp();

  // State sesi yang dipilih
  const [selectedSesiId, setSelectedSesiId] = useState<string>(
    daftarSesi.length > 0 ? daftarSesi[0].id : ''
  );

  // State pencarian & filter status
  const [kataKunci, setKataKunci] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<FilterStatusRekap>('SEMUA');

  // State modal rincian presensi praktikan
  const [detailPresensiAktif, setDetailPresensiAktif] =
    useState<CatatanPresensi | null>(null);
  const [detailBelumPresensiMhs, setDetailBelumPresensiMhs] =
    useState<Pengguna | null>(null);

  const sesiDipilih = useMemo(
    () => daftarSesi.find((s) => s.id === selectedSesiId) || daftarSesi[0],
    [daftarSesi, selectedSesiId]
  );

  // Daftar catatan presensi pada sesi terpilih
  const presensiSesiList = useMemo(
    () => (sesiDipilih ? ambilPresensiPerSesi(sesiDipilih.id) : []),
    [sesiDipilih, ambilPresensiPerSesi]
  );

  // Daftar praktikan terdaftar pada kelas sesi terpilih
  const praktikanKelasTerdaftar = useMemo(() => {
    if (!sesiDipilih) return daftarPraktikan;
    const sesuaiKelas = daftarPraktikan.filter(
      (mhs) => mhs.kelas === sesiDipilih.kelas
    );
    return sesuaiKelas.length > 0 ? sesuaiKelas : daftarPraktikan;
  }, [daftarPraktikan, sesiDipilih]);

  // Daftar praktikan kelas yang belum presensi
  const praktikanBelumPresensi = useMemo(() => {
    const idSudahPresensi = new Set(
      presensiSesiList.map((item) => item.praktikanId)
    );
    return praktikanKelasTerdaftar.filter(
      (mhs) => !idSudahPresensi.has(mhs.id)
    );
  }, [praktikanKelasTerdaftar, presensiSesiList]);

  // Statistik per kategori status
  const totalTerdaftar = praktikanKelasTerdaftar.length;
  const totalSudahPresensi = presensiSesiList.length;
  const totalHadir = presensiSesiList.filter(
    (p) => p.statusKehadiran === 'HADIR'
  ).length;
  const totalIzin = presensiSesiList.filter(
    (p) => p.statusKehadiran === 'IZIN'
  ).length;
  const totalSakit = presensiSesiList.filter(
    (p) => p.statusKehadiran === 'SAKIT'
  ).length;
  const totalBelum = praktikanBelumPresensi.length;

  const persentaseKehadiran =
    totalTerdaftar > 0
      ? Math.min(100, Math.round((totalSudahPresensi / totalTerdaftar) * 100))
      : 0;

  // Hasil penyaringan catatan presensi
  const presensiTersaring = useMemo(() => {
    if (filterStatus === 'BELUM_PRESENSI') return [];
    const query = kataKunci.trim().toLowerCase();
    return presensiSesiList.filter((item) => {
      const cocokStatus =
        filterStatus === 'SEMUA' || item.statusKehadiran === filterStatus;
      const cocokKataKunci =
        query.length === 0 ||
        item.namaPraktikan.toLowerCase().includes(query) ||
        item.nimPraktikan.toLowerCase().includes(query) ||
        (item.catatan && item.catatan.toLowerCase().includes(query));
      return cocokStatus && cocokKataKunci;
    });
  }, [presensiSesiList, filterStatus, kataKunci]);

  // Hasil penyaringan praktikan yang belum presensi
  const belumPresensiTersaring = useMemo(() => {
    if (filterStatus !== 'SEMUA' && filterStatus !== 'BELUM_PRESENSI') return [];
    const query = kataKunci.trim().toLowerCase();
    return praktikanBelumPresensi.filter(
      (mhs) =>
        query.length === 0 ||
        mhs.nama.toLowerCase().includes(query) ||
        mhs.nomorInduk.toLowerCase().includes(query)
    );
  }, [praktikanBelumPresensi, kataKunci, filterStatus]);

  // Riwayat pribadi praktikan
  const riwayatPribadi = useMemo(() => {
    if (peranAktif !== 'praktikan') return [];
    return ambilRiwayatPraktikan(penggunaAktif.id);
  }, [peranAktif, penggunaAktif.id, ambilRiwayatPraktikan]);

  return (
    <View style={styles.container}>
      {/* SECTION 1: IKHTISAR KEHADIRAN SESI */}
      <View style={styles.headerBlock}>
        <SectionHeader
          title="Ikhtisar Kehadiran Sesi"
          isFirst
          rightElement={
            <Text style={[styles.headerMetaRight, { color: tema.textMuted }]}>
              {sesiDipilih?.ruangLab || 'Lab RPL'}
            </Text>
          }
        />
        <Text style={[styles.headerSubtitle, { color: tema.textSecondary }]}>
          {sesiDipilih?.namaPraktikum} · Kelas {sesiDipilih?.kelas}
        </Text>
      </View>

      {/* Pemilih Sesi Praktikum Horizontal */}
      {daftarSesi.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.sesiSelectorScroll}
          contentContainerStyle={styles.sesiSelectorContent}
        >
          {daftarSesi.map((sesi) => {
            const isSelected = sesi.id === sesiDipilih?.id;
            return (
              <TouchableOpacity
                key={sesi.id}
                style={[
                  styles.sesiChip,
                  {
                    backgroundColor: isSelected
                      ? tema.accentSurface
                      : tema.surface,
                    borderColor: isSelected ? tema.accent : tema.border,
                  },
                ]}
                onPress={() => setSelectedSesiId(sesi.id)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.sesiChipText,
                    {
                      color: isSelected
                        ? tema.accentText
                        : tema.textSecondary,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {sesi.namaPraktikum} ({sesi.kelas})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* METRIK 2 KOLOM (UI-STATS-2COL) */}
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
            {persentaseKehadiran}%
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
            {totalSudahPresensi} / {totalTerdaftar}
          </Text>
          <Text style={[styles.statLbl, { color: tema.textSecondary }]}>
            Mahasiswa Masuk
          </Text>
        </View>
      </View>

      {/* SECTION 2: DAFTAR PRESENSI MAHASISWA */}
      <View
        style={[
          styles.tableCard,
          {
            backgroundColor: tema.surface,
            borderColor: tema.border,
          },
        ]}
      >
        {/* Header Tabel */}
        <View
          style={[
            styles.tableHeaderRow,
            { borderBottomColor: tema.borderSubtle },
          ]}
        >
          <Text style={[styles.tableTitle, { color: tema.textPrimary }]}>
            Daftar Presensi Mahasiswa
          </Text>
          <Text style={[styles.tableCountBadge, { color: tema.textSecondary }]}>
            {totalTerdaftar} Terdaftar
          </Text>
        </View>

        {/* Input Pencarian */}
        <View
          style={[
            styles.searchRow,
            {
              backgroundColor: tema.surfaceRaised,
              borderColor: tema.border,
            },
          ]}
        >
          <Ionicons name="search-outline" size={15} color={tema.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: tema.textPrimary }]}
            placeholder="Cari nama atau NIM..."
            placeholderTextColor={tema.textMuted}
            value={kataKunci}
            onChangeText={setKataKunci}
          />
          {kataKunci.length > 0 && (
            <TouchableOpacity onPress={() => setKataKunci('')}>
              <Ionicons
                name="close-circle"
                size={16}
                color={tema.textMuted}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Baris Horizontal */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContent}
        >
          {(
            [
              { key: 'SEMUA', label: `Semua (${totalSudahPresensi})` },
              { key: 'HADIR', label: `Hadir (${totalHadir})` },
              { key: 'IZIN', label: `Izin (${totalIzin})` },
              { key: 'SAKIT', label: `Sakit (${totalSakit})` },
              { key: 'BELUM_PRESENSI', label: `Belum (${totalBelum})` },
            ] as { key: FilterStatusRekap; label: string }[]
          ).map((item) => {
            const isAktif = filterStatus === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: isAktif
                      ? tema.accentSurface
                      : tema.surfaceRaised,
                    borderColor: isAktif ? tema.accent : tema.border,
                  },
                ]}
                onPress={() => setFilterStatus(item.key)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    {
                      color: isAktif ? tema.accentText : tema.textSecondary,
                      fontWeight: isAktif ? '700' : '500',
                    },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Baris Daftar Mahasiswa */}
        {presensiTersaring.length === 0 && belumPresensiTersaring.length === 0 ? (
          <EmptyState
            title="Tidak Ada Data Mahasiswa"
            description="Tidak ada catatan presensi yang sesuai dengan kriteria filter."
          />
        ) : (
          <View style={styles.studentList}>
            {/* Mahasiswa yang sudah presensi */}
            {presensiTersaring.map((catatan) => {
              const isHadir = catatan.statusKehadiran === 'HADIR';
              const isIzin = catatan.statusKehadiran === 'IZIN';
              const statusColor = isHadir
                ? tema.statusHadir
                : isIzin
                ? modeTema === 'dark'
                  ? '#818CF8'
                  : '#4F46E5'
                : '#D97706';

              const statusText = isHadir
                ? 'Hadir di Lab'
                : isIzin
                ? 'Izin Praktikum'
                : 'Keterangan Sakit';

              return (
                <TouchableOpacity
                  key={catatan.id}
                  style={[
                    styles.rekapRow,
                    { borderBottomColor: tema.borderSubtle },
                  ]}
                  onPress={() => setDetailPresensiAktif(catatan)}
                  activeOpacity={0.7}
                >
                  {/* Sisi Kiri: Nama & NIM */}
                  <View style={styles.studentMeta}>
                    <Text
                      style={[styles.studentName, { color: tema.textPrimary }]}
                      numberOfLines={1}
                    >
                      {catatan.namaPraktikan}
                    </Text>
                    <Text
                      style={[
                        styles.studentNim,
                        { color: tema.textSecondary },
                      ]}
                    >
                      {catatan.nimPraktikan}
                    </Text>
                  </View>

                  {/* Sisi Kanan: Jam Presensi & Status Teks Bersih */}
                  <View style={styles.rekapStatusCol}>
                    <Text
                      style={[
                        styles.rekapTimeText,
                        { color: tema.textPrimary },
                      ]}
                    >
                      {catatan.waktuPresensi} WIB
                    </Text>
                    <Text
                      style={[
                        styles.rekapStateText,
                        { color: statusColor },
                      ]}
                    >
                      {statusText}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* Mahasiswa yang belum presensi */}
            {belumPresensiTersaring.map((mhs) => (
              <TouchableOpacity
                key={mhs.id}
                style={[
                  styles.rekapRow,
                  { borderBottomColor: tema.borderSubtle },
                ]}
                onPress={() => setDetailBelumPresensiMhs(mhs)}
                activeOpacity={0.7}
              >
                <View style={styles.studentMeta}>
                  <Text
                    style={[styles.studentName, { color: tema.textPrimary }]}
                    numberOfLines={1}
                  >
                    {mhs.nama}
                  </Text>
                  <Text
                    style={[
                      styles.studentNim,
                      { color: tema.textSecondary },
                    ]}
                  >
                    {mhs.nomorInduk}
                  </Text>
                </View>

                <View style={styles.rekapStatusCol}>
                  <Text
                    style={[
                      styles.rekapTimeText,
                      { color: tema.textMuted },
                    ]}
                  >
                    —
                  </Text>
                  <Text
                    style={[
                      styles.rekapStateText,
                      { color: tema.textMuted },
                    ]}
                  >
                    Belum Presensi
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Modal Detail Presensi Mahasiswa */}
      <Modal
        visible={!!detailPresensiAktif}
        transparent
        animationType="fade"
        onRequestClose={() => setDetailPresensiAktif(null)}
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
                Rincian Presensi
              </Text>
              <TouchableOpacity
                onPress={() => setDetailPresensiAktif(null)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={20} color={tema.textMuted} />
              </TouchableOpacity>
            </View>

            {detailPresensiAktif && (
              <View style={styles.modalDetailBody}>
                <View style={styles.modalDetailRow}>
                  <Text
                    style={[
                      styles.modalDetailKey,
                      { color: tema.textSecondary },
                    ]}
                  >
                    Nama Mahasiswa
                  </Text>
                  <Text
                    style={[
                      styles.modalDetailVal,
                      { color: tema.textPrimary },
                    ]}
                  >
                    {detailPresensiAktif.namaPraktikan}
                  </Text>
                </View>

                <View style={styles.modalDetailRow}>
                  <Text
                    style={[
                      styles.modalDetailKey,
                      { color: tema.textSecondary },
                    ]}
                  >
                    NIM
                  </Text>
                  <Text
                    style={[
                      styles.modalDetailVal,
                      { color: tema.textPrimary },
                    ]}
                  >
                    {detailPresensiAktif.nimPraktikan}
                  </Text>
                </View>

                <View style={styles.modalDetailRow}>
                  <Text
                    style={[
                      styles.modalDetailKey,
                      { color: tema.textSecondary },
                    ]}
                  >
                    Waktu Masuk
                  </Text>
                  <Text
                    style={[
                      styles.modalDetailVal,
                      { color: tema.textPrimary },
                    ]}
                  >
                    {detailPresensiAktif.waktuPresensi} WIB
                  </Text>
                </View>

                <View style={styles.modalDetailRow}>
                  <Text
                    style={[
                      styles.modalDetailKey,
                      { color: tema.textSecondary },
                    ]}
                  >
                    Status
                  </Text>
                  <Text
                    style={[
                      styles.modalDetailVal,
                      {
                        color:
                          detailPresensiAktif.statusKehadiran === 'HADIR'
                            ? tema.statusHadir
                            : '#D97706',
                        fontWeight: '700',
                      },
                    ]}
                  >
                    {detailPresensiAktif.statusKehadiran}
                  </Text>
                </View>

                <View style={styles.modalDetailRow}>
                  <Text
                    style={[
                      styles.modalDetailKey,
                      { color: tema.textSecondary },
                    ]}
                  >
                    Catatan
                  </Text>
                  <Text
                    style={[
                      styles.modalDetailVal,
                      { color: tema.textPrimary, fontStyle: 'italic' },
                    ]}
                  >
                    {detailPresensiAktif.catatan || 'Tidak ada catatan tambahan'}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal Detail Mahasiswa Belum Presensi */}
      <Modal
        visible={!!detailBelumPresensiMhs}
        transparent
        animationType="fade"
        onRequestClose={() => setDetailBelumPresensiMhs(null)}
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
                Status Mahasiswa
              </Text>
              <TouchableOpacity
                onPress={() => setDetailBelumPresensiMhs(null)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={20} color={tema.textMuted} />
              </TouchableOpacity>
            </View>

            {detailBelumPresensiMhs && (
              <View style={styles.modalDetailBody}>
                <View style={styles.modalDetailRow}>
                  <Text
                    style={[
                      styles.modalDetailKey,
                      { color: tema.textSecondary },
                    ]}
                  >
                    Nama
                  </Text>
                  <Text
                    style={[
                      styles.modalDetailVal,
                      { color: tema.textPrimary },
                    ]}
                  >
                    {detailBelumPresensiMhs.nama}
                  </Text>
                </View>

                <View style={styles.modalDetailRow}>
                  <Text
                    style={[
                      styles.modalDetailKey,
                      { color: tema.textSecondary },
                    ]}
                  >
                    NIM
                  </Text>
                  <Text
                    style={[
                      styles.modalDetailVal,
                      { color: tema.textPrimary },
                    ]}
                  >
                    {detailBelumPresensiMhs.nomorInduk}
                  </Text>
                </View>

                <View style={styles.modalDetailRow}>
                  <Text
                    style={[
                      styles.modalDetailKey,
                      { color: tema.textSecondary },
                    ]}
                  >
                    Kelas
                  </Text>
                  <Text
                    style={[
                      styles.modalDetailVal,
                      { color: tema.textPrimary },
                    ]}
                  >
                    {detailBelumPresensiMhs.kelas}
                  </Text>
                </View>

                <View style={styles.modalDetailRow}>
                  <Text
                    style={[
                      styles.modalDetailKey,
                      { color: tema.textSecondary },
                    ]}
                  >
                    Status
                  </Text>
                  <Text
                    style={[
                      styles.modalDetailVal,
                      { color: tema.textMuted, fontWeight: '700' },
                    ]}
                  >
                    Belum Presensi
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  headerBlock: {
    gap: 2,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: -2,
    marginBottom: 4,
  },
  headerMetaRight: {
    fontSize: 11,
    fontWeight: '500',
  },
  sesiSelectorScroll: {
    marginBottom: 2,
  },
  sesiSelectorContent: {
    gap: 6,
  },
  sesiChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  sesiChipText: {
    fontSize: 11,
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
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 28,
  },
  statLbl: {
    fontSize: 11,
    fontWeight: '500',
  },
  tableCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  tableTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  tableCountBadge: {
    fontSize: 11,
    fontWeight: '600',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: 10,
    height: 38,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    paddingVertical: 0,
  },
  filterScroll: {
    maxHeight: 32,
  },
  filterContent: {
    gap: 6,
  },
  filterPill: {
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 11,
  },
  studentList: {
    paddingTop: 2,
  },
  rekapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: spacing.md,
  },
  studentMeta: {
    flex: 1,
    gap: 2,
  },
  studentName: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 17,
  },
  studentNim: {
    fontSize: 11,
    fontWeight: '500',
  },
  rekapStatusCol: {
    alignItems: 'flex-end',
    gap: 2,
  },
  rekapTimeText: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  rekapStateText: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 15,
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
    maxWidth: 340,
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  modalDetailBody: {
    gap: 10,
  },
  modalDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalDetailKey: {
    fontSize: 12,
    fontWeight: '500',
  },
  modalDetailVal: {
    fontSize: 12,
    fontWeight: '600',
    maxWidth: '60%',
    textAlign: 'right',
  },
});
