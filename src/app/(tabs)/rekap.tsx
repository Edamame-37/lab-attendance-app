/**
 * @file src/app/(tabs)/rekap.tsx
 * @description Layar Rekapitulasi Presensi Praktikum.
 * Area Kerja Utama: Pemrogram 3 (Rekapitulasi Kehadiran & Monitoring Asisten).
 *
 * Tanggung Jawab Pemrogram 3:
 * - Menampilkan daftar praktikan yang telah melakukan presensi pada sesi tertentu.
 * - Menyajikan catatan waktu (timestamp) kehadiran secara terperinci.
 * - Menampilkan ringkasan statistik kehadiran (Hadir, Izin, Sakit).
 * - Menangani kondisi tampilan ketika belum ada praktikan yang presensi (EmptyState).
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useApp } from '@/context/AppContext';
import { ScreenContainer } from '@/components/ScreenContainer';
import { SectionCard } from '@/components/SectionCard';
import { BadgeStatus } from '@/components/common/BadgeStatus';
import { EmptyState } from '@/components/common/EmptyState';
import { Ionicons } from '@expo/vector-icons';

export default function RekapScreen(): React.JSX.Element {
  const {
    peranAktif,
    penggunaAktif,
    daftarSesi,
    ambilPresensiPerSesi,
    ambilRiwayatPraktikan,
  } = useApp();

  // State sesi yang dipilih untuk dilihat rekapitulasinya
  const [selectedSesiId, setSelectedSesiId] = useState<string>(
    daftarSesi.length > 0 ? daftarSesi[0].id : ''
  );

  const sesiDipilih = daftarSesi.find((s) => s.id === selectedSesiId);

  // Daftar presensi pada sesi yang dipilih
  const presensiSesiList = selectedSesiId
    ? ambilPresensiPerSesi(selectedSesiId)
    : [];

  // Hitung ringkasan statistik
  const totalHadir = presensiSesiList.filter(
    (p) => p.statusKehadiran === 'HADIR'
  ).length;
  const totalIzin = presensiSesiList.filter(
    (p) => p.statusKehadiran === 'IZIN'
  ).length;
  const totalSakit = presensiSesiList.filter(
    (p) => p.statusKehadiran === 'SAKIT'
  ).length;

  return (
    <ScreenContainer
      badge="Sprint 1"
      title="Rekapitulasi Kehadiran"
      description="Pemantauan daftar kehadiran mahasiswa dan catatan waktu presensi setiap sesi praktikum."
      docUrl="Sprint 1: Modul Rekapitulasi Asisten"
    >
      {/* Pilihan Sesi Praktikum */}
      <SectionCard
        title="Pilih Sesi Praktikum"
        subtitle="Pilih salah satu jadwal praktikum untuk melihat data rekap kehadiran:"
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.sesiSelectorRow}>
            {daftarSesi.map((sesi) => {
              const isSelected = selectedSesiId === sesi.id;
              return (
                <TouchableOpacity
                  key={sesi.id}
                  style={[
                    styles.sesiChip,
                    isSelected && styles.sesiChipActive,
                  ]}
                  onPress={() => setSelectedSesiId(sesi.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.sesiChipHeader}>
                    <Text
                      style={[
                        styles.sesiChipKelas,
                        isSelected && styles.sesiChipKelasActive,
                      ]}
                    >
                      {sesi.kelas}
                    </Text>
                    <BadgeStatus status={sesi.status} />
                  </View>
                  <Text
                    style={[
                      styles.sesiChipTitle,
                      isSelected && styles.sesiChipTitleActive,
                    ]}
                    numberOfLines={1}
                  >
                    {sesi.namaPraktikum}
                  </Text>
                  <Text style={styles.sesiChipSub}>
                    {sesi.hari}, {sesi.jamMulai} - {sesi.jamSelesai}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </SectionCard>

      {/* Rincian Sesi & Ringkasan Statistik */}
      {sesiDipilih && (
        <SectionCard
          title={`Detail Sesi: ${sesiDipilih.kelas}`}
          subtitle={`${sesiDipilih.namaPraktikum} - ${sesiDipilih.topikMateri}`}
        >
          <View style={styles.statGrid}>
            <View style={[styles.statBox, styles.statBoxTotal]}>
              <Text style={styles.statLabel}>Total Presensi</Text>
              <Text style={styles.statValue}>{presensiSesiList.length}</Text>
            </View>
            <View style={[styles.statBox, styles.statBoxHadir]}>
              <Text style={styles.statLabel}>Hadir</Text>
              <Text style={[styles.statValue, styles.statValueHadir]}>
                {totalHadir}
              </Text>
            </View>
            <View style={[styles.statBox, styles.statBoxIzin]}>
              <Text style={styles.statLabel}>Izin</Text>
              <Text style={[styles.statValue, styles.statValueIzin]}>
                {totalIzin}
              </Text>
            </View>
            <View style={[styles.statBox, styles.statBoxSakit]}>
              <Text style={styles.statLabel}>Sakit</Text>
              <Text style={[styles.statValue, styles.statValueSakit]}>
                {totalSakit}
              </Text>
            </View>
          </View>
        </SectionCard>
      )}

      {/* Tabel / Daftar Rekapitulasi Praktikan */}
      <SectionCard
        title="Daftar Kehadiran Praktikan"
        subtitle={`Daftar mahasiswa yang telah melakukan presensi pada sesi ${sesiDipilih?.kelas || ''}:`}
      >
        {presensiSesiList.length === 0 ? (
          <EmptyState
            iconName="people-outline"
            title="Belum Ada Presensi Masuk"
            description="Belum ada praktikan yang melakukan pencatatan kehadiran pada sesi praktikum ini."
          />
        ) : (
          presensiSesiList.map((mhs, idx) => (
            <View key={mhs.id} style={styles.rekapRowCard}>
              <View style={styles.rowNumberCol}>
                <Text style={styles.rowNumberText}>{idx + 1}</Text>
              </View>

              <View style={styles.rowInfoCol}>
                <Text style={styles.rowNama}>{mhs.namaPraktikan}</Text>
                <Text style={styles.rowNim}>
                  NIM: {mhs.nimPraktikan} | Kelas {mhs.kelasPraktikan}
                </Text>
                {mhs.catatan && (
                  <Text style={styles.rowCatatan}>
                    Catatan: {mhs.catatan}
                  </Text>
                )}
              </View>

              <View style={styles.rowTimeCol}>
                <View
                  style={[
                    styles.statusPill,
                    mhs.statusKehadiran === 'HADIR' && styles.statusPillHadir,
                    mhs.statusKehadiran === 'IZIN' && styles.statusPillIzin,
                    mhs.statusKehadiran === 'SAKIT' && styles.statusPillSakit,
                  ]}
                >
                  <Text style={styles.statusPillText}>{mhs.statusKehadiran}</Text>
                </View>
                <View style={styles.timestampBox}>
                  <Ionicons name="time-outline" size={11} color="#94a3b8" />
                  <Text style={styles.timestampText}>{mhs.waktuPresensi}</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </SectionCard>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  sesiSelectorRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 6,
  },
  sesiChip: {
    backgroundColor: '#0a101f',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
    minWidth: 200,
  },
  sesiChipActive: {
    borderColor: '#38bdf8',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
  },
  sesiChipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sesiChipKelas: {
    fontSize: 13,
    fontWeight: '700',
    color: '#cbd5e1',
  },
  sesiChipKelasActive: {
    color: '#38bdf8',
  },
  sesiChipTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 2,
  },
  sesiChipTitleActive: {
    color: '#ffffff',
  },
  sesiChipSub: {
    fontSize: 11,
    color: '#64748b',
  },
  statGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#0a101f',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  statBoxTotal: {
    borderColor: '#38bdf8',
  },
  statBoxHadir: {
    borderColor: '#22c55e',
  },
  statBoxIzin: {
    borderColor: '#f59e0b',
  },
  statBoxSakit: {
    borderColor: '#ef4444',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f8fafc',
  },
  statValueHadir: {
    color: '#4ade80',
  },
  statValueIzin: {
    color: '#fbbf24',
  },
  statValueSakit: {
    color: '#f87171',
  },
  rekapRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a101f',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 10,
  },
  rowNumberCol: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#131b2e',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  rowNumberText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
  },
  rowInfoCol: {
    flex: 1,
  },
  rowNama: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 2,
  },
  rowNim: {
    fontSize: 11,
    color: '#94a3b8',
  },
  rowCatatan: {
    fontSize: 11,
    color: '#cbd5e1',
    fontStyle: 'italic',
    marginTop: 2,
  },
  rowTimeCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusPillHadir: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderColor: '#22c55e',
  },
  statusPillIzin: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: '#f59e0b',
  },
  statusPillSakit: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#ef4444',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },
  timestampBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  timestampText: {
    fontSize: 11,
    color: '#94a3b8',
  },
});
