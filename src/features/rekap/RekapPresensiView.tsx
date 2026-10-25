/**
 * @file src/features/rekap/RekapPresensiView.tsx
 * @description Modul Rekapitulasi Kehadiran Praktikum (Pemrogram 3).
 *
 * Menerapkan desain 100% identik dengan trydesign.html (view-rekap):
 * 1. Ikhtisar Kehadiran Sesi (Judul, Subline Mata Kuliah & Kelas, Ruang Lab)
 * 2. Metrik Statistik 2 Kolom (Tingkat Hadir & Rasio Mahasiswa Masuk)
 * 3. Kartu Daftar Presensi Mahasiswa:
 *    - Header tabel dengan penghitung jumlah praktikan terdaftar (5 Terdaftar)
 *    - Baris data 2-line bersih:
 *      Sisi Kiri: Nama Praktikan (13px bold) & NIM (12px)
 *      Sisi Kanan: Waktu Presensi (12px bold) & Status Kehadiran (11px tipografis tanpa pastel pill)
 */

import React, { useMemo } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useApp } from '@/context/AppContext';
import { radius, spacing } from '@/theme';

export const RekapPresensiView: React.FC = () => {
  const { daftarSesi, daftarPraktikan, ambilPresensiPerSesi, tema, modeTema } =
    useApp();

  // Sesi praktikum aktif atau sesi pertama
  const sesiDipilih = useMemo(
    () => daftarSesi.find((s) => s.status === 'DIBUKA') || daftarSesi[0],
    [daftarSesi]
  );

  // Catatan presensi pada sesi terpilih
  const presensiSesiList = useMemo(
    () => (sesiDipilih ? ambilPresensiPerSesi(sesiDipilih.id) : []),
    [sesiDipilih, ambilPresensiPerSesi]
  );

  // Praktikan terdaftar pada kelas
  const praktikanKelasTerdaftar = useMemo(() => {
    if (!sesiDipilih) return daftarPraktikan;
    const sesuaiKelas = daftarPraktikan.filter(
      (mhs) => mhs.kelas === sesiDipilih.kelas
    );
    return sesuaiKelas.length > 0 ? sesuaiKelas : daftarPraktikan;
  }, [daftarPraktikan, sesiDipilih]);

  // Map kehadiran praktikan berdasarkan praktikanId
  const mapPresensi = useMemo(() => {
    const map = new Map<string, (typeof presensiSesiList)[0]>();
    presensiSesiList.forEach((item) => {
      map.set(item.praktikanId, item);
    });
    return map;
  }, [presensiSesiList]);

  // Statistik ketercapaian
  const totalTerdaftar = praktikanKelasTerdaftar.length || 5;
  const totalSudahPresensi = presensiSesiList.length;
  const persentaseKehadiran =
    totalTerdaftar > 0
      ? Math.min(100, Math.round((totalSudahPresensi / totalTerdaftar) * 100))
      : 40;

  return (
    <View style={styles.container}>
      {/* SECTION 1: HEADER IKHTISAR KEHADIRAN SESI */}
      <View style={styles.sectionHeaderRow}>
        <View style={styles.headerLeft}>
          <Text style={[styles.sectionTitle, { color: tema.textPrimary }]}>
            Ikhtisar Kehadiran Sesi
          </Text>
          <Text style={[styles.sectionSub, { color: tema.textSecondary }]}>
            {sesiDipilih?.namaPraktikum || 'Pemrograman Perangkat Bergerak'} ·{' '}
            {sesiDipilih?.kelas || 'TI-3A'}
          </Text>
        </View>
        <Text style={[styles.sectionDateMeta, { color: tema.textMuted }]}>
          {sesiDipilih?.ruangLab || 'Lab RPL 1'}
        </Text>
      </View>

      {/* SECTION 2: METRIK STATISTIK 2 KOLOM (UI-STATS-2COL) */}
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

      {/* SECTION 3: KARTU TABEL DAFTAR PRESENSI MAHASISWA */}
      <View
        style={[
          styles.uiCard,
          {
            backgroundColor: tema.surface,
            borderColor: tema.border,
          },
        ]}
      >
        {/* Header Tabel */}
        <View
          style={[
            styles.cardHeaderRow,
            { borderBottomColor: tema.borderSubtle },
          ]}
        >
          <Text style={[styles.cardHeaderTitle, { color: tema.textPrimary }]}>
            Daftar Presensi Mahasiswa
          </Text>
          <Text
            style={[styles.cardHeaderCount, { color: tema.textSecondary }]}
          >
            {totalTerdaftar} Terdaftar
          </Text>
        </View>

        {/* Baris Daftar Mahasiswa (rekap-student-table) */}
        <View style={styles.tableList}>
          {praktikanKelasTerdaftar.map((mhs, index) => {
            const presensi = mapPresensi.get(mhs.id);
            const isLast = index === praktikanKelasTerdaftar.length - 1;

            let stateLabel = 'Belum Presensi';
            let stateColor = tema.textMuted;
            let timeText = '—';

            if (presensi) {
              timeText = `${presensi.waktuPresensi} WIB`;
              if (presensi.statusKehadiran === 'HADIR') {
                stateLabel = 'Hadir di Lab';
                stateColor = '#059669';
              } else if (presensi.statusKehadiran === 'IZIN') {
                stateLabel = 'Izin Praktikum';
                stateColor = modeTema === 'dark' ? '#818CF8' : '#4F46E5';
              } else if (presensi.statusKehadiran === 'SAKIT') {
                stateLabel = 'Keterangan Sakit';
                stateColor = '#D97706';
              }
            }

            return (
              <View
                key={mhs.id}
                style={[
                  styles.rekapRow,
                  !isLast && {
                    borderBottomWidth: 1,
                    borderBottomColor: tema.borderSubtle,
                  },
                ]}
              >
                {/* Sisi Kiri: Nama & NIM */}
                <View style={styles.rekapStudentMeta}>
                  <Text
                    style={[
                      styles.studentName,
                      { color: tema.textPrimary },
                    ]}
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

                {/* Sisi Kanan: Waktu Presensi & Status Teks */}
                <View style={styles.rekapStatusCol}>
                  <Text
                    style={[
                      styles.rekapTimeText,
                      {
                        color:
                          timeText === '—'
                            ? tema.textMuted
                            : tema.textPrimary,
                      },
                    ]}
                  >
                    {timeText}
                  </Text>
                  <Text
                    style={[
                      styles.rekapStateText,
                      { color: stateColor },
                    ]}
                  >
                    {stateLabel}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 2,
  },
  headerLeft: {
    gap: 2,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  sectionSub: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  sectionDateMeta: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
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
  uiCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: 16,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  cardHeaderTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  cardHeaderCount: {
    fontSize: 11,
    fontWeight: '600',
  },
  tableList: {
    paddingTop: 2,
  },
  rekapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    gap: spacing.md,
  },
  rekapStudentMeta: {
    flex: 1,
    gap: 2,
  },
  studentName: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 17,
  },
  studentNim: {
    fontSize: 12,
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
    fontWeight: '600',
    lineHeight: 15,
  },
});
