/**
 * @file src/app/(tabs)/profil.tsx
 * @description Layar Profil Pengguna dan Pengaturan Simulasi Peran Sprint 1.
 * Menyajikan identitas pengguna aktif, switcher akun, serta ringkasan arsitektur pembagian tugas 3 pemrogram.
 */

import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useApp } from '@/context/AppContext';
import { ScreenContainer } from '@/components/ScreenContainer';
import { SectionCard } from '@/components/SectionCard';
import { RoleSelector } from '@/components/common/RoleSelector';
import { Ionicons } from '@expo/vector-icons';

export default function ProfilScreen(): React.JSX.Element {
  const { peranAktif, penggunaAktif } = useApp();

  return (
    <ScreenContainer
      badge="Sprint 1"
      title="Profil & Pengaturan Peran"
      description="Konfigurasi identitas pengguna aktif dan pengawasan arsitektur Sprint 1."
      docUrl="Sprint 1: Konfigurasi Identitas & Peran"
    >
      {/* Pengalih Peran dan Identitas */}
      <RoleSelector />

      {/* Rincian Identitas Pengguna Aktif */}
      <SectionCard
        title="Rincian Pengguna Aktif"
        subtitle="Data identitas yang sedang digunakan dalam sesi aplikasi saat ini:"
      >
        <View style={styles.detailContainer}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nama Lengkap:</Text>
            <Text style={styles.infoValue}>{penggunaAktif.nama}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              {peranAktif === 'asisten' ? 'NIP / ID Asisten:' : 'NIM Mahasiswa:'}
            </Text>
            <Text style={styles.infoValue}>{penggunaAktif.nomorInduk}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Peran Sistem:</Text>
            <View style={styles.badgePeran}>
              <Text style={styles.badgePeranText}>
                {peranAktif === 'asisten'
                  ? 'ASISTEN PRAKTIKUM'
                  : 'PRAKTIKAN (MAHASISWA)'}
              </Text>
            </View>
          </View>
          {penggunaAktif.kelas && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Kelas Terdaftar:</Text>
              <Text style={styles.infoValue}>{penggunaAktif.kelas}</Text>
            </View>
          )}
        </View>
      </SectionCard>

      {/* Ringkasan Pembagian Tugas 3 Pemrogram Paralel */}
      <SectionCard
        title="Pembagian Kerja 3 Pemrogram (Paralel)"
        subtitle="Struktur arsitektur Sprint 1 yang telah disiapkan untuk kerja tim:"
      >
        <View style={styles.programmerCard}>
          <View style={styles.programmerHeader}>
            <Ionicons name="code-slash-outline" size={16} color="#38bdf8" />
            <Text style={styles.programmerTitle}>Pemrogram 1: Pengelolaan Sesi</Text>
          </View>
          <Text style={styles.programmerDesc}>
            Fokus: Siklus hidup sesi (Buka/Tutup Sesi), validasi asisten, modal konfirmasi, dan integrasi layar Jadwal Sesi.
          </Text>
        </View>

        <View style={styles.programmerCard}>
          <View style={styles.programmerHeader}>
            <Ionicons name="code-slash-outline" size={16} color="#4ade80" />
            <Text style={styles.programmerTitle}>Pemrogram 2: Presensi Praktikan</Text>
          </View>
          <Text style={styles.programmerDesc}>
            Fokus: Formulir presensi mahasiswa, validasi anti-duplikasi, modal umpan balik berhasil, dan riwayat presensi pribadi.
          </Text>
        </View>

        <View style={styles.programmerCard}>
          <View style={styles.programmerHeader}>
            <Ionicons name="code-slash-outline" size={16} color="#fbbf24" />
            <Text style={styles.programmerTitle}>Pemrogram 3: Rekap & Desain Bersama</Text>
          </View>
          <Text style={styles.programmerDesc}>
            Fokus: Layar rekapitulasi kehadiran asisten, statistik ringkas, komponen terstandarisasi (BadgeStatus, EmptyState, RoleSelector), dan navigasi terpadu.
          </Text>
        </View>
      </SectionCard>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  detailContainer: {
    backgroundColor: '#0a101f',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#131b2e',
  },
  infoLabel: {
    fontSize: 12,
    color: '#94a3b8',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f8fafc',
  },
  badgePeran: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: '#38bdf8',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgePeranText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38bdf8',
  },
  programmerCard: {
    backgroundColor: '#0a101f',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  programmerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  programmerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f8fafc',
  },
  programmerDesc: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 18,
  },
});
