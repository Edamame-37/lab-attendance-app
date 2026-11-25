/**
 * @file src/types/index.ts
 * @description Definisi tipe data dan kontrak interface domain untuk Sprint 1 Presensi Praktikum.
 * Semua model data didefinisikan secara baku agar dapat digunakan secara independen oleh Pemrogram 1, 2, dan 3.
 */

import type { ModeTema, ThemeColors } from '@/theme';

export type { ModeTema, ThemeColors };

/**
 * Peran pengguna yang didukung dalam sistem
 */
export type PeranPengguna = 'aslab' | 'asisten' | 'praktikan';

export interface LabMemberEntry {
  uid?: string;
  nama: string;
  nomorInduk: string;
  kelas?: string;
  email?: string;
}

export interface LabConfig {
  id: string;
  name: string;
  code: string;
  courseCode: string;
  courseName: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  radiusMeters: number;
  gracePeriodMinutes: number;
  lateFineAmount: number;
  aslabId: string;
  asprakIds: string[];
  asprakMembers: LabMemberEntry[];
  studentIds: string[];
  studentMembers: LabMemberEntry[];
  isActive: boolean;
}

export type BulkInsertType = 'labs' | 'students' | 'asprak';
export type BulkRowStatus = 'accepted' | 'denied';
export type FinePaymentStatus = 'pending' | 'success' | 'failed';

export interface FineRecord {
  id: string;
  attendanceId: string;
  sessionId: string;
  sessionName: string;
  labId: string;
  labName: string;
  studentId: string;
  studentName: string;
  studentNim: string;
  studentClass: string;
  lateMinutes: number;
  gracePeriodMinutes: number;
  amount: number;
  paymentStatus: FinePaymentStatus;
  latestOrderId: string | null;
  latestInvoiceId: string | null;
  latestInvoiceUrl: string | null;
  paidAt: unknown | null;
  createdAt: unknown;
  updatedAt: unknown;
}

export interface PaymentTransactionRecord {
  externalId: string;
  xenditInvoiceId: string;
  fineId: string;
  sessionId: string;
  sessionName: string;
  studentId: string;
  studentName: string;
  amount: number;
  status: FinePaymentStatus;
  xenditStatus: string;
  paymentMethod: string | null;
  paymentChannel: string | null;
  invoiceUrl: string;
  billedAt: unknown;
  paidAt: unknown | null;
  expiresAt: unknown;
  createdAt: unknown;
  updatedAt: unknown;
}

/**
 * Siklus status sesi praktikum
 * DITUTUP: Sesi belum dimulai oleh asisten
 * DIBUKA: Sesi sedang berlangsung dan praktikan dapat presensi
 * SELESAI: Sesi telah ditutup oleh asisten dan presensi terkunci
 */
export type StatusSesi = 'DITUTUP' | 'DIBUKA' | 'SELESAI';

/**
 * Status opsi kehadiran praktikan
 */
export type StatusKehadiran = 'HADIR' | 'IZIN' | 'SAKIT';

/**
 * Interface identitas pengguna sistem
 */
export interface Pengguna {
  id: string;
  nama: string;
  nomorInduk: string; // NIM mahasiswa atau NIP/ID Asisten
  kelas?: string;
  peran: PeranPengguna;
}

/**
 * Interface jadwal sesi praktikum
 */
export interface JadwalSesi {
  id: string;
  kodeMataKuliah: string;
  namaPraktikum: string;
  topikMateri: string;
  kelas: string;
  ruangLab: string;
  hari: string;
  jamMulai: string;
  jamSelesai: string;
  namaAsisten: string;
  status: StatusSesi;
  tanggalAktif?: string;
}

/**
 * Interface catatan riwayat presensi praktikan
 */
export interface CatatanPresensi {
  id: string;
  sesiId: string;
  praktikanId: string;
  namaPraktikan: string;
  nimPraktikan: string;
  kelasPraktikan: string;
  waktuPresensi: string;
  statusKehadiran: StatusKehadiran;
  catatan?: string;
}

/**
 * Interface konteks state global aplikasi
 */
export interface AppContextType {
  peranAktif: PeranPengguna;
  penggunaAktif: Pengguna;
  gantiPeran: (peran: PeranPengguna) => void;
  modeTema: ModeTema;
  tema: ThemeColors;
  toggleModeTema: () => void;
  setModeTema: (mode: ModeTema) => void;
}
