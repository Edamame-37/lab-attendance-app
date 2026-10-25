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
  // Pengguna & Peran
  peranAktif: PeranPengguna;
  penggunaAktif: Pengguna;
  daftarAsisten: Pengguna[];
  daftarPraktikan: Pengguna[];
  gantiPeran: (peran: PeranPengguna) => void;
  gantiPengguna: (penggunaId: string) => void;

  // Jadwal & Pengelolaan Sesi (Programmer 1)
  daftarSesi: JadwalSesi[];
  bukaSesi: (sesiId: string, ruangLab?: string) => void;
  tutupSesi: (sesiId: string) => void;

  // Presensi Praktikan (Programmer 2)
  daftarPresensi: CatatanPresensi[];
  catatPresensi: (
    sesiId: string,
    statusKehadiran: StatusKehadiran,
    catatan?: string
  ) => { sukses: boolean; pesan: string };
  cekSudahPresensi: (sesiId: string, praktikanId: string) => boolean;
  ambilRiwayatPraktikan: (praktikanId: string) => CatatanPresensi[];

  // Rekapitulasi Asisten (Programmer 3)
  ambilPresensiPerSesi: (sesiId: string) => CatatanPresensi[];

  // Sistem Tema Tampilan (Light Mode Opsi 3 & Dark Mode Opsi 2)
  modeTema: ModeTema;
  tema: ThemeColors;
  toggleModeTema: () => void;
  setModeTema: (mode: ModeTema) => void;
}
