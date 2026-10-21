/**
 * @file src/features/asisten/SessionControlCard.tsx
 * @description Komponen kartu kontrol dan detail sesi praktikum dari sudut pandang Asisten & Praktikan.
 * Bagian dari Domain Kerja Pemrogram 1 (Modul Asisten dan Pengelolaan Sesi).
 *
 * Fitur:
 * - Menampilkan metadata lengkap sesi (kode, nama, topik, kelas, waktu, ruang lab, asisten).
 * - Menampilkan indikator status visual (BadgeStatus).
 * - Menampilkan metrik real-time jumlah praktikan yang sudah presensi pada sesi terkait.
 * - Tombol aksi adaptif berdasarkan peran pengguna dan status siklus sesi praktikum.
 */

import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { JadwalSesi, PeranPengguna } from '@/types';
import { BadgeStatus } from '@/components/common/BadgeStatus';
import { useApp } from '@/context/AppContext';

export interface SessionControlCardProps {
  /** Objek data sesi praktikum */
  sesi: JadwalSesi;
  /** Peran pengguna aktif yang sedang mengoperasikan sistem */
  peranAktif: PeranPengguna;
  /** Callback ketika asisten menekan tombol buka sesi */
  onBukaSesi: (sesi: JadwalSesi) => void;
  /** Callback ketika asisten menekan tombol tutup sesi */
  onTutupSesi: (sesi: JadwalSesi) => void;
  /** Callback ketika praktikan menekan tombol navigasi presensi */
  onNavigasiPresensi?: (sesi: JadwalSesi) => void;
}

export const SessionControlCard: React.FC<SessionControlCardProps> = ({
  sesi,
  peranAktif,
  onBukaSesi,
  onTutupSesi,
  onNavigasiPresensi,
}) => {
  const { ambilPresensiPerSesi } = useApp();

  // Menghitung jumlah praktikan yang sudah tercatat presensi pada sesi ini
  const presensiTercatat = ambilPresensiPerSesi(sesi.id);
  const totalHadir = presensiTercatat.length;

  return (
    <View style={styles.card}>
      {/* Header Kartu: Kode, Nama Praktikum, dan Badge Status */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.kodeMk}>{sesi.kodeMataKuliah}</Text>
          <Text style={styles.namaMk}>{sesi.namaPraktikum}</Text>
        </View>
        <BadgeStatus status={sesi.status} />
      </View>

      {/* Rincian Materi dan Informasi Jadwal */}
      <View style={styles.detailContainer}>
        <Text style={styles.topikMateri}>{sesi.topikMateri}</Text>

        <View style={styles.metaGrid}>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={14} color="#94a3b8" />
            <Text style={styles.metaText}>
              {sesi.hari}, {sesi.jamMulai} - {sesi.jamSelesai}
            </Text>
          </View>

          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={14} color="#94a3b8" />
            <Text style={styles.metaText}>{sesi.ruangLab}</Text>
          </View>
        </View>

        <View style={styles.metaGrid}>
          <View style={styles.metaItem}>
            <Ionicons name="people-outline" size={14} color="#94a3b8" />
            <Text style={styles.metaText}>Kelas: {sesi.kelas}</Text>
          </View>

          <View style={styles.metaItem}>
            <Ionicons name="person-outline" size={14} color="#94a3b8" />
            <Text style={styles.metaText}>Asisten: {sesi.namaAsisten}</Text>
          </View>
        </View>

        {/* Counter Kehadiran Real-time jika Sesi Sedang Berjalan atau Sudah Selesai */}
        {sesi.status !== 'DITUTUP' && (
          <View style={styles.counterRow}>
            <Ionicons name="stats-chart-outline" size={14} color="#38bdf8" />
            <Text style={styles.counterText}>
              Presensi Masuk:{' '}
              <Text style={styles.counterHighlight}>{totalHadir} Mahasiswa</Text>
            </Text>
          </View>
        )}
      </View>

      {/* Kontrol Aksi Berdasarkan Peran */}
      <View style={styles.actionContainer}>
        {peranAktif === 'asisten' ? (
          // ==================== KONTROL ASISTEN ====================
          <View style={styles.actionRow}>
            {sesi.status === 'DITUTUP' && (
              <TouchableOpacity
                style={[styles.btnAction, styles.btnBuka]}
                onPress={() => onBukaSesi(sesi)}
                activeOpacity={0.8}
              >
                <Ionicons name="play-outline" size={16} color="#ffffff" />
                <Text style={styles.btnActionText}>Buka Sesi Praktikum</Text>
              </TouchableOpacity>
            )}

            {sesi.status === 'DIBUKA' && (
              <TouchableOpacity
                style={[styles.btnAction, styles.btnTutup]}
                onPress={() => onTutupSesi(sesi)}
                activeOpacity={0.8}
              >
                <Ionicons name="stop-outline" size={16} color="#ffffff" />
                <Text style={styles.btnActionText}>Tutup Sesi Praktikum</Text>
              </TouchableOpacity>
            )}

            {sesi.status === 'SELESAI' && (
              <View style={styles.infoCompleted}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={16}
                  color="#94a3b8"
                />
                <Text style={styles.infoCompletedText}>
                  Sesi praktikum telah selesai dilaksanakan.
                </Text>
              </View>
            )}
          </View>
        ) : (
          // ==================== SUDUT PANDANG PRAKTIKAN ====================
          <View style={styles.actionRow}>
            {sesi.status === 'DIBUKA' ? (
              <TouchableOpacity
                style={[styles.btnAction, styles.btnPresensi]}
                onPress={() => onNavigasiPresensi && onNavigasiPresensi(sesi)}
                activeOpacity={0.8}
              >
                <Ionicons name="checkbox-outline" size={16} color="#ffffff" />
                <Text style={styles.btnActionText}>
                  Lakukan Presensi Sekarang
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.infoWait}>
                <Ionicons
                  name="information-circle-outline"
                  size={16}
                  color="#64748b"
                />
                <Text style={styles.infoWaitText}>
                  {sesi.status === 'DITUTUP'
                    ? 'Menunggu asisten membuka sesi praktikum.'
                    : 'Presensi untuk sesi ini telah ditutup.'}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  kodeMk: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38bdf8',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  namaMk: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f8fafc',
  },
  detailContainer: {
    backgroundColor: '#131d33',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  topikMateri: {
    fontSize: 13,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 10,
  },
  metaGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  metaText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  counterText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  counterHighlight: {
    fontWeight: '700',
    color: '#38bdf8',
  },
  actionContainer: {
    marginTop: 2,
  },
  actionRow: {
    width: '100%',
  },
  btnAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 11,
    borderRadius: 8,
  },
  btnBuka: {
    backgroundColor: '#059669',
  },
  btnTutup: {
    backgroundColor: '#dc2626',
  },
  btnPresensi: {
    backgroundColor: '#2563eb',
  },
  btnActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  infoCompleted: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    backgroundColor: 'rgba(148, 163, 184, 0.08)',
    borderRadius: 8,
  },
  infoCompletedText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  infoWait: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    backgroundColor: 'rgba(100, 116, 139, 0.08)',
    borderRadius: 8,
  },
  infoWaitText: {
    fontSize: 12,
    color: '#64748b',
  },
});
