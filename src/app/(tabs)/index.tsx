/**
 * @file src/app/(tabs)/index.tsx
 * @description Modul Pembelajaran 1: React Fundamentals & TypeScript Props
 * Referensi: https://reactnative.dev/docs/intro-react?language=typescript&guide=android
 *
 * Konsep Inti yang Dipelajari:
 * 1. Komponen Kustom (Custom Component): Memecah UI menjadi blok kode reusable.
 * 2. Props & TypeScript Typing: Mendefinisikan tipe data props dengan interface secara ketat.
 * 3. JSX pada React Native: Komponen berbasis native (View, Text) alih-alih elemen HTML (div, span).
 * 4. Komposisi Komponen: Menyusun komponen anak di dalam komponen induk.
 */

import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { ScreenContainer } from '@/components/ScreenContainer';
import { SectionCard } from '@/components/SectionCard';

/**
 * Interface untuk Props pada Custom Component MahasiswaCard
 */
interface MahasiswaProps {
  /** Nama lengkap mahasiswa */
  nama: string;
  /** Nomor Induk Mahasiswa */
  nim: string;
  /** Kelas praktikum */
  kelas: string;
  /** Status keaktifan (opsional) */
  isActive?: boolean;
}

/**
 * Custom Component yang menerima Props bertipe TypeScript.
 * Mencontohkan konsep 'Props' dari dokumentasi React Fundamentals.
 */
const MahasiswaCard: React.FC<MahasiswaProps> = ({
  nama,
  nim,
  kelas,
  isActive = true,
}) => {
  return (
    <View style={cardStyles.container}>
      <View style={cardStyles.headerRow}>
        <Text style={cardStyles.namaText}>{nama}</Text>
        <View
          style={[
            cardStyles.badge,
            isActive ? cardStyles.badgeActive : cardStyles.badgeInactive,
          ]}
        >
          <Text style={cardStyles.badgeText}>
            {isActive ? 'Aktif' : 'Non-Aktif'}
          </Text>
        </View>
      </View>
      <Text style={cardStyles.nimText}>NIM: {nim}</Text>
      <Text style={cardStyles.kelasText}>Kelas: {kelas}</Text>
    </View>
  );
};

const cardStyles = StyleSheet.create({
  container: {
    backgroundColor: '#0a101f',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  namaText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f8fafc',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderColor: '#22c55e',
    borderWidth: 1,
  },
  badgeInactive: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#ef4444',
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#22c55e',
  },
  nimText: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 2,
  },
  kelasText: {
    fontSize: 13,
    color: '#64748b',
  },
});

/**
 * Layar Utama React Fundamentals
 */
export default function ReactFundamentalsScreen(): React.JSX.Element {
  // State untuk mendemonstrasikan re-render komponen saat data berubah
  const [kehadiranCount, setKehadiranCount] = useState<number>(3);

  // Daftar data mahasiswa untuk dirender menggunakan pola map (perulangan JSX)
  const dataMahasiswa: MahasiswaProps[] = [
    { nama: 'Ahmad Fauzi', nim: '2141720001', kelas: 'TI-3A', isActive: true },
    { nama: 'Budi Santoso', nim: '2141720045', kelas: 'TI-3A', isActive: true },
    { nama: 'Citra Lestari', nim: '2141720088', kelas: 'TI-3B', isActive: false },
  ];

  return (
    <ScreenContainer
      badge="Modul 1"
      title="React Fundamentals"
      description="Pengenalan komponen kustom, JSX, dan integrasi TypeScript Props sesuai standar React Native."
      docUrl="https://reactnative.dev/docs/intro-react"
    >
      {/* Seksi 1: Teori Dasar */}
      <SectionCard
        title="1. Konsep Dasar Komponen & JSX"
        subtitle="Komponen adalah blok pembangun UI mandiri. React Native menggunakan komponen bawaan seperti <View> dan <Text>."
      >
        <View style={styles.codeSnippet}>
          <Text style={styles.codeText}>
            {'// Contoh Definisi Komponen & Props:\n'}
            {'interface Props { nama: string; nim: string }\n'}
            {'function MahasiswaCard({ nama, nim }: Props) {\n'}
            {'  return (\n'}
            {'    <View>\n'}
            {'      <Text>{nama}</Text>\n'}
            {'    </View>\n'}
            {'  );\n'}
            {'}'}
          </Text>
        </View>
      </SectionCard>

      {/* Seksi 2: Implementasi Custom Component dengan Props */}
      <SectionCard
        title="2. Implementasi Props dengan TypeScript"
        subtitle="Komponen MahasiswaCard di bawah dirender dengan mem-passing props berbeda secara dinamis:"
      >
        {dataMahasiswa.map((mhs) => (
          <MahasiswaCard
            key={mhs.nim}
            nama={mhs.nama}
            nim={mhs.nim}
            kelas={mhs.kelas}
            isActive={mhs.isActive}
          />
        ))}
      </SectionCard>

      {/* Seksi 3: Siklus Re-render */}
      <SectionCard
        title="3. Eksplorasi Re-render Komponen"
        subtitle="Saat nilai state bertambah, komponen dirender ulang untuk merefleksikan data terbaru:"
      >
        <View style={styles.counterRow}>
          <Text style={styles.counterLabel}>Total Kehadiran Hari Ini:</Text>
          <Text style={styles.counterValue}>{kehadiranCount}</Text>
        </View>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.btnAction}
            onPress={() => setKehadiranCount((c) => c + 1)}
            activeOpacity={0.8}
          >
            <Text style={styles.btnText}>+ Tambah Hadir</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btnAction, styles.btnReset]}
            onPress={() => setKehadiranCount(0)}
            activeOpacity={0.8}
          >
            <Text style={[styles.btnText, styles.btnResetText]}>Reset</Text>
          </TouchableOpacity>
        </View>
      </SectionCard>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  codeSnippet: {
    backgroundColor: '#0a0f1d',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  codeText: {
    fontFamily: 'monospace',
    color: '#38bdf8',
    fontSize: 12,
    lineHeight: 18,
  },
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0a101f',
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
  },
  counterLabel: {
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '500',
  },
  counterValue: {
    color: '#38bdf8',
    fontSize: 22,
    fontWeight: '800',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  btnAction: {
    flex: 1,
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnReset: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#334155',
  },
  btnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  btnResetText: {
    color: '#94a3b8',
  },
});
