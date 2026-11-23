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
export type PeranPengguna = 'asisten' | 'praktikan';

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
