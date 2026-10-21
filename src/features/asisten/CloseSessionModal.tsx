/**
 * @file src/features/asisten/CloseSessionModal.tsx
 * @description Dialog modal konfirmasi penutupan sesi praktikum oleh Asisten.
 * Bagian dari Domain Kerja Pemrogram 1 (Modul Asisten dan Pengelolaan Sesi).
 *
 * Fitur:
 * - Menampilkan rincian sesi yang akan ditutup.
 * - Menampilkan metrik rekapitulasi jumlah mahasiswa yang telah presensi pada sesi tersebut.
 * - Memberikan peringatan bahwa penutupan sesi akan mengunci presensi praktikan secara permanen.
 */

import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { JadwalSesi } from '@/types';

export interface CloseSessionModalProps {
  /** Kontrol visibilitas modal */
  visible: boolean;
  /** Data sesi yang sedang dipilih untuk ditutup */
  sesi: JadwalSesi | null;
  /** Total jumlah mahasiswa yang telah presensi pada sesi ini */
  totalHadir: number;
  /** Callback untuk menutup dialog modal */
  onClose: () => void;
  /** Callback konfirmasi penutupan sesi */
  onConfirm: (sesiId: string) => void;
}

export const CloseSessionModal: React.FC<CloseSessionModalProps> = ({
  visible,
  sesi,
  totalHadir,
  onClose,
  onConfirm,
}) => {
  if (!sesi) return null;

  const handleConfirm = (): void => {
    onConfirm(sesi.id);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalBox}>
          {/* Header Modal */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="alert-circle" size={18} color="#f87171" />
              </View>
              <Text style={styles.title}>Konfirmasi Penutupan Sesi</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Rincian Sesi */}
          <View style={styles.summaryBox}>
            <Text style={styles.summaryKode}>{sesi.kodeMataKuliah}</Text>
            <Text style={styles.summaryNama}>{sesi.namaPraktikum}</Text>
            <Text style={styles.summaryMeta}>
              Kelas: {sesi.kelas} | Ruang: {sesi.ruangLab}
            </Text>
          </View>

          {/* Rekap Kehadiran Terakhir */}
          <View style={styles.statBox}>
            <Ionicons name="people" size={18} color="#38bdf8" />
            <View style={styles.statTextContainer}>
              <Text style={styles.statTitle}>Total Kehadiran Praktikan</Text>
              <Text style={styles.statValue}>
                {totalHadir} Mahasiswa tercatat hadir
              </Text>
            </View>
          </View>

          {/* Pesan Peringatan */}
          <View style={styles.warningBox}>
            <Ionicons name="warning-outline" size={16} color="#fbbf24" style={styles.warningIcon} />
            <Text style={styles.warningText}>
              Setelah sesi ditutup, status akan berubah menjadi SELESAI. Mahasiswa tidak dapat lagi mengisi atau mengubah presensi kehadiran pada sesi ini.
            </Text>
          </View>

          {/* Tombol Aksi */}
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={styles.btnCancel}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.btnCancelText}>Batal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnDanger}
              onPress={handleConfirm}
              activeOpacity={0.8}
            >
              <Ionicons name="stop" size={16} color="#ffffff" />
              <Text style={styles.btnDangerText}>Ya, Tutup Sesi</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
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
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#ef4444',
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
  statBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    gap: 12,
  },
  statTextContainer: {
    flex: 1,
  },
  statTitle: {
    fontSize: 11,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 14,
    color: '#f8fafc',
    fontWeight: '700',
    marginTop: 2,
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.25)',
    alignItems: 'flex-start',
  },
  warningIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: '#fde68a',
    lineHeight: 17,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
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
  btnDanger: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 11,
    borderRadius: 8,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  btnDangerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
});
