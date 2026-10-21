/**
 * @file src/features/asisten/OpenSessionModal.tsx
 * @description Dialog modal untuk pembukaan sesi praktikum oleh Asisten.
 * Bagian dari Domain Kerja Pemrogram 1 (Modul Asisten dan Pengelolaan Sesi).
 *
 * Fitur:
 * - Menampilkan ringkasan sesi yang akan dibuka.
 * - Form input konfirmasi Ruang Laboratorium.
 * - Form input catatan atau instruksi pembuka bagi praktikan.
 * - Validasi input sebelum status sesi dialihkan menjadi 'DIBUKA'.
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { JadwalSesi } from '@/types';

export interface OpenSessionModalProps {
  /** Kontrol visibilitas modal */
  visible: boolean;
  /** Data sesi yang sedang dipilih untuk dibuka */
  sesi: JadwalSesi | null;
  /** Callback untuk menutup dialog modal */
  onClose: () => void;
  /** Callback konfirmasi pembukaan sesi dengan parameter ruang lab & catatan */
  onConfirm: (sesiId: string, ruangLab: string, catatanPembuka?: string) => void;
}

export const OpenSessionModal: React.FC<OpenSessionModalProps> = ({
  visible,
  sesi,
  onClose,
  onConfirm,
}) => {
  const [ruangLab, setRuangLab] = useState<string>('');
  const [catatanPembuka, setCatatanPembuka] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Sinkronisasi data awal saat sesi terpilih berubah
  useEffect(() => {
    if (sesi) {
      setRuangLab(sesi.ruangLab);
      setCatatanPembuka('');
      setErrorMessage('');
    }
  }, [sesi, visible]);

  const handleSubmit = (): void => {
    if (!sesi) return;

    if (!ruangLab || ruangLab.trim().length === 0) {
      setErrorMessage('Ruang laboratorium wajib diisi.');
      return;
    }

    onConfirm(sesi.id, ruangLab.trim(), catatanPembuka.trim() || undefined);
    onClose();
  };

  if (!sesi) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.modalBox}>
          {/* Header Modal */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="play" size={16} color="#34d399" />
              </View>
              <Text style={styles.title}>Buka Sesi Praktikum</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Ringkasan Sesi Terpilih */}
          <View style={styles.summaryBox}>
            <Text style={styles.summaryKode}>{sesi.kodeMataKuliah}</Text>
            <Text style={styles.summaryNama}>{sesi.namaPraktikum}</Text>
            <Text style={styles.summaryMeta}>
              Kelas {sesi.kelas} | Waktu: {sesi.jamMulai} - {sesi.jamSelesai} WIB
            </Text>
          </View>

          {/* Form Input Ruang Lab */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Ruang Laboratorium <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="business-outline" size={16} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={ruangLab}
                onChangeText={(text) => {
                  setRuangLab(text);
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="Contoh: Lab RPL 1 (Gedung B)"
                placeholderTextColor="#64748b"
              />
            </View>
            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
          </View>

          {/* Form Input Catatan Pembuka / Instruksi */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Catatan Pembuka / Instruksi Sesi (Opsional)</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="document-text-outline" size={16} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                value={catatanPembuka}
                onChangeText={setCatatanPembuka}
                placeholder="Contoh: Mahasiswa wajib menyiapkan modul praktikum BAB 3."
                placeholderTextColor="#64748b"
                multiline
                numberOfLines={2}
              />
            </View>
          </View>

          {/* Tombol Aksi Batal dan Submit */}
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={styles.btnCancel}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.btnCancelText}>Batal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnSubmit}
              onPress={handleSubmit}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-circle-outline" size={18} color="#ffffff" />
              <Text style={styles.btnSubmitText}>Konfirmasi & Buka Sesi</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
  },
  summaryBox: {
    backgroundColor: '#131d33',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#34d399',
  },
  summaryKode: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38bdf8',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  summaryNama: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 4,
  },
  summaryMeta: {
    fontSize: 12,
    color: '#94a3b8',
  },
  formGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 6,
  },
  required: {
    color: '#f87171',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 13,
    color: '#f8fafc',
  },
  inputMultiline: {
    minHeight: 50,
    textAlignVertical: 'top',
    paddingVertical: 8,
  },
  errorText: {
    fontSize: 11,
    color: '#f87171',
    marginTop: 4,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  btnCancel: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 8,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  btnCancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94a3b8',
  },
  btnSubmit: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 11,
    borderRadius: 8,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  btnSubmitText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
});
