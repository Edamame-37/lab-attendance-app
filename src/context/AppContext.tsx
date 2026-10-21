/**
 * @file src/context/AppContext.tsx
 * @description Context state global untuk aplikasi Presensi Praktikum.
 * Menyediakan state bersama dan handler aksi untuk peran asisten dan praktikan.
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';
import {
  AppContextType,
  PeranPengguna,
  Pengguna,
  JadwalSesi,
  CatatanPresensi,
  StatusKehadiran,
} from '@/types';
import {
  DUMMY_ASISTEN,
  DUMMY_PRAKTIKAN,
  DUMMY_SESI,
  DUMMY_PRESENSI,
} from '@/data/dummyData';

const AppContext = createContext<AppContextType | undefined>(undefined);

export interface AppProviderProps {
  children: ReactNode;
}

/**
 * Helper untuk memformat waktu sekarang dalam format HH:mm:ss WIB
 */
const formatWaktuSekarang = (): string => {
  const now = new Date();
  const jam = String(now.getHours()).padStart(2, '0');
  const menit = String(now.getMinutes()).padStart(2, '0');
  const detik = String(now.getSeconds()).padStart(2, '0');
  return `${jam}:${menit}:${detik} WIB`;
};

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  // State peran aktif dan identitas pengguna aktif
  const [peranAktif, setPeranAktif] = useState<PeranPengguna>('praktikan');
  const [penggunaAktif, setPenggunaAktif] = useState<Pengguna>(DUMMY_PRAKTIKAN[0]);

  // State daftar jadwal sesi praktikum
  const [daftarSesi, setDaftarSesi] = useState<JadwalSesi[]>(DUMMY_SESI);

  // State daftar catatan presensi
  const [daftarPresensi, setDaftarPresensi] =
    useState<CatatanPresensi[]>(DUMMY_PRESENSI);

  /**
   * Fungsi untuk mengganti peran aktif antara 'asisten' dan 'praktikan'
   */
  const gantiPeran = (peran: PeranPengguna): void => {
    setPeranAktif(peran);
    if (peran === 'asisten') {
      setPenggunaAktif(DUMMY_ASISTEN[0]);
    } else {
      setPenggunaAktif(DUMMY_PRAKTIKAN[0]);
    }
  };

  /**
   * Fungsi untuk memilih pengguna spesifik
   */
  const gantiPengguna = (penggunaId: string): void => {
    const target =
      DUMMY_PRAKTIKAN.find((p) => p.id === penggunaId) ||
      DUMMY_ASISTEN.find((a) => a.id === penggunaId);
    if (target) {
      setPenggunaAktif(target);
      setPeranAktif(target.peran);
    }
  };

  /**
   * Fungsi Asisten: Membuka sesi praktikum
   */
  const bukaSesi = (sesiId: string, ruangLab?: string): void => {
    setDaftarSesi((prevSesi) =>
      prevSesi.map((s) => {
        if (s.id === sesiId) {
          return {
            ...s,
            status: 'DIBUKA',
            ruangLab: ruangLab && ruangLab.trim().length > 0 ? ruangLab : s.ruangLab,
          };
        }
        return s;
      })
    );
  };

  /**
   * Fungsi Asisten: Menutup sesi praktikum
   */
  const tutupSesi = (sesiId: string): void => {
    setDaftarSesi((prevSesi) =>
      prevSesi.map((s) => {
        if (s.id === sesiId) {
          return {
            ...s,
            status: 'SELESAI',
          };
        }
        return s;
      })
    );
  };

  /**
   * Fungsi Praktikan: Mencatat kehadiran pada sesi aktif
   */
  const catatPresensi = (
    sesiId: string,
    statusKehadiran: StatusKehadiran,
    catatan?: string
  ): { sukses: boolean; pesan: string } => {
    const sesi = daftarSesi.find((s) => s.id === sesiId);
    if (!sesi) {
      return { sukses: false, pesan: 'Sesi praktikum tidak ditemukan.' };
    }

    if (sesi.status !== 'DIBUKA') {
      return {
        sukses: false,
        pesan:
          sesi.status === 'DITUTUP'
            ? 'Sesi belum dibuka oleh asisten praktikum.'
            : 'Sesi praktikum telah ditutup.',
      };
    }

    // Validasi anti-duplikasi: satu praktikan hanya dapat presensi 1x per sesi
    const sudahAda = daftarPresensi.some(
      (p) => p.sesiId === sesiId && p.praktikanId === penggunaAktif.id
    );

    if (sudahAda) {
      return {
        sukses: false,
        pesan: 'Anda sudah melakukan presensi pada sesi ini sebelumnya.',
      };
    }

    const dataBaru: CatatanPresensi = {
      id: `presensi-${Date.now()}`,
      sesiId,
      praktikanId: penggunaAktif.id,
      namaPraktikan: penggunaAktif.nama,
      nimPraktikan: penggunaAktif.nomorInduk,
      kelasPraktikan: penggunaAktif.kelas || 'TI-3A',
      waktuPresensi: formatWaktuSekarang(),
      statusKehadiran,
      catatan: catatan && catatan.trim().length > 0 ? catatan.trim() : 'Hadir',
    };

    setDaftarPresensi((prev) => [dataBaru, ...prev]);

    return {
      sukses: true,
      pesan: `Presensi berhasil dicatat pada ${dataBaru.waktuPresensi}.`,
    };
  };

  /**
   * Fungsi pembantu: Cek apakah praktikan tertentu sudah presensi di sesi tertentu
   */
  const cekSudahPresensi = (sesiId: string, praktikanId: string): boolean => {
    return daftarPresensi.some(
      (p) => p.sesiId === sesiId && p.praktikanId === praktikanId
    );
  };

  /**
   * Fungsi pembantu: Ambil seluruh riwayat presensi mahasiswa tertentu
   */
  const ambilRiwayatPraktikan = (praktikanId: string): CatatanPresensi[] => {
    return daftarPresensi.filter((p) => p.praktikanId === praktikanId);
  };

  /**
   * Fungsi pembantu: Ambil seluruh catatan presensi untuk sesi tertentu (Rekap Asisten)
   */
  const ambilPresensiPerSesi = (sesiId: string): CatatanPresensi[] => {
    return daftarPresensi.filter((p) => p.sesiId === sesiId);
  };

  return (
    <AppContext.Provider
      value={{
        peranAktif,
        penggunaAktif,
        daftarAsisten: DUMMY_ASISTEN,
        daftarPraktikan: DUMMY_PRAKTIKAN,
        gantiPeran,
        gantiPengguna,
        daftarSesi,
        bukaSesi,
        tutupSesi,
        daftarPresensi,
        catatPresensi,
        cekSudahPresensi,
        ambilRiwayatPraktikan,
        ambilPresensiPerSesi,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

/**
 * Custom hook untuk mengakses AppContext
 */
export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp harus digunakan di dalam AppProvider');
  }
  return context;
};
