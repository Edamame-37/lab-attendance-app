/**
 * @file src/app/(tabs)/state-input.tsx
 * @description Modul Pembelajaran 3: useState Hook & Handling Text Input
 * Referensi: https://reactnative.dev/docs/handling-text-input
 *
 * Konsep Inti yang Dipelajari:
 * 1. useState: Hook dasar React untuk menyimpan dan memperbarui data lokal komponen.
 * 2. Controlled Component: TextInput yang nilainya dikendalikan langsung oleh state React.
 * 3. Event onChangeText: Callback yang dipanggil setiap kali teks dalam input berubah.
 * 4. Contoh Pizza Translator / Kata-ke-Emoji dari dokumentasi resmi.
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { ScreenContainer } from '@/components/ScreenContainer';
import { SectionCard } from '@/components/SectionCard';

export default function StateInputScreen(): React.JSX.Element {
  // State untuk form input nama
  const [namaMahasiswa, setNamaMahasiswa] = useState<string>('');

  // State untuk form input pesan (Pizza/Emoji Translator seperti dokumentasi resmi)
  const [kalimat, setKalimat] = useState<string>('');

  // Fungsi penerjemah kata: mengubah setiap kata menjadi icon pizza 🍕
  const terjemahPizza = kalimat
    .split(' ')
    .filter((kata) => kata.trim().length > 0)
    .map(() => '🍕')
    .join(' ');

  // Handler reset input
  const handleReset = (): void => {
    setNamaMahasiswa('');
    setKalimat('');
  };

  return (
    <ScreenContainer
      badge="Modul 3"
      title="useState & Text Input"
      description="Penerapan Controlled Components menggunakan TextInput dan hook useState pada React Native."
      docUrl="https://reactnative.dev/docs/handling-text-input"
    >
      {/* Seksi 1: Input Dasar Mahasiswa */}
      <SectionCard
        title="1. Form Input Terkontrol (Controlled Input)"
        subtitle="Nilai input terikat langsung dengan state namaMahasiswa."
      >
        <Text style={styles.label}>Masukkan Nama Anda:</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Contoh: Muhammad Rizki"
          placeholderTextColor="#64748b"
          value={namaMahasiswa}
          onChangeText={(teks) => setNamaMahasiswa(teks)}
        />
        <View style={styles.resultBox}>
          <Text style={styles.resultLabel}>State Saat Ini:</Text>
          <Text style={styles.resultText}>
            {namaMahasiswa.length > 0
              ? `Halo, ${namaMahasiswa}! Selamat datang di praktikum.`
              : '(Belum ada teks yang dimasukkan)'}
          </Text>
        </View>
      </SectionCard>

      {/* Seksi 2: Pizza Translator (Contoh Resmi Dokumentasi) */}
      <SectionCard
        title="2. Pizza Translator (Dokumentasi Resmi)"
        subtitle="Dokumentasi resmi React Native mendemonstrasikan penerjemahan setiap kata menjadi simbol 🍕."
      >
        <Text style={styles.label}>Ketikkan Kalimat Apapun:</Text>
        <TextInput
          style={[styles.textInput, styles.multilineInput]}
          placeholder="Ketik kalimat di sini..."
          placeholderTextColor="#64748b"
          multiline
          numberOfLines={3}
          value={kalimat}
          onChangeText={(teks) => setKalimat(teks)}
        />

        <View style={styles.statsRow}>
          <Text style={styles.statsText}>
            Jumlah Karakter: {kalimat.length}
          </Text>
          <Text style={styles.statsText}>
            Jumlah Kata:{' '}
            {kalimat.trim().length === 0
              ? 0
              : kalimat.trim().split(/\s+/).length}
          </Text>
        </View>

        <View style={styles.pizzaBox}>
          <Text style={styles.pizzaLabel}>Hasil Terjemahan Pizza:</Text>
          <Text style={styles.pizzaOutput}>
            {terjemahPizza.length > 0
              ? terjemahPizza
              : '🍕 (Ketik kata di atas)'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.btnReset}
          onPress={handleReset}
          activeOpacity={0.8}
        >
          <Text style={styles.btnResetText}>Bersihkan Semua Input</Text>
        </TouchableOpacity>
      </SectionCard>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#0a101f',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#f8fafc',
    fontSize: 14,
    marginBottom: 12,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  resultBox: {
    backgroundColor: '#0a0f1d',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#38bdf8',
  },
  resultLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  resultText: {
    fontSize: 13,
    color: '#38bdf8',
    lineHeight: 18,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statsText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  pizzaBox: {
    backgroundColor: '#0a0f1d',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 12,
  },
  pizzaLabel: {
    fontSize: 12,
    color: '#fbbf24', // Amber
    fontWeight: '600',
    marginBottom: 6,
  },
  pizzaOutput: {
    fontSize: 18,
    lineHeight: 28,
    color: '#f8fafc',
  },
  btnReset: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnResetText: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '600',
  },
});
