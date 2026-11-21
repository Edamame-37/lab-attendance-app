/**
 * @file src/context/AppContext.tsx
 * @description Context state global untuk aplikasi Presensi Praktikum.
 * Menyediakan state bersama dan handler aksi untuk peran asisten dan praktikan.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '@/config/firebase';
import {
  subscribeToSessions,
  openSession,
  closeSession,
  COLLECTIONS,
} from '@/services/firestoreService';
import { useAuth } from './AuthContext';
import {
  AppContextType,
  PeranPengguna,
  Pengguna,
  JadwalSesi,
  CatatanPresensi,
  StatusKehadiran,
  ModeTema,
} from '@/types';
import { lightTheme, darkTheme } from '@/theme';
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
  // State tema tampilan global: 'light' (Opsi 3 Warm Academic Stone) | 'dark' (Opsi 2 Obsidian Dark)
  // Tema dasar aplikasi ditetapkan secara default ke Mode Terang ('light')
  const [modeTema, setModeTema] = useState<ModeTema>('light');
  const tema = modeTema === 'dark' ? darkTheme : lightTheme;

  const toggleModeTema = (): void => {
    setModeTema((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // State peran aktif dan identitas pengguna aktif
  const [peranAktif, setPeranAktif] = useState<PeranPengguna>('praktikan');
  const [penggunaAktif, setPenggunaAktif] = useState<Pengguna>(DUMMY_PRAKTIKAN[0]);

  // Sinkronisasi data pengguna aktif dari AuthContext (Firebase Auth)
  const auth = useAuth();

  useEffect(() => {
    if (auth?.userProfile) {
      const currentRole = (auth.activeRole || auth.userProfile.role) as PeranPengguna;
      setPenggunaAktif({
        id: auth.userProfile.uid,
        nama: auth.userProfile.nama,
        nomorInduk: auth.userProfile.nomorInduk,
        kelas: auth.userProfile.kelas || undefined,
        peran: currentRole,
      });
      setPeranAktif(currentRole);
    }
  }, [auth?.userProfile, auth?.activeRole]);

  // State daftar jadwal sesi praktikum
  const [daftarSesi, setDaftarSesi] = useState<JadwalSesi[]>(DUMMY_SESI);

  // State daftar catatan presensi
  const [daftarPresensi, setDaftarPresensi] =
    useState<CatatanPresensi[]>(DUMMY_PRESENSI);

  // Sinkronisasi Sesi Real-Time dari Cloud Firestore (SRS-FT-02 & SRS-FT-04)
  useEffect(() => {
    let unsubscribeSessions: (() => void) | null = null;
    let unsubscribeAttendances: (() => void) | null = null;

    try {
      unsubscribeSessions = subscribeToSessions(
        (firestoreSessions: any[]) => {
          if (firestoreSessions && firestoreSessions.length > 0) {
            const mappedSessions: JadwalSesi[] = firestoreSessions.map((docItem) => {
              const isOpen =
                docItem.status === 'open' || docItem.statusSesi === 'DIBUKA';
              const isDone =
                docItem.statusSesi === 'SELESAI' ||
                (!isOpen && docItem.waktuTutup != null);
              const status: 'DIBUKA' | 'DITUTUP' | 'SELESAI' = isOpen
                ? 'DIBUKA'
                : isDone
                ? 'SELESAI'
                : 'DITUTUP';

              return {
                id: docItem.id,
                kodeMataKuliah: docItem.kodeMataKuliah || 'PPK-2026',
                namaPraktikum: docItem.namaPraktikum || 'Praktikum',
                topikMateri: docItem.topikMateri || '',
                kelas: docItem.kelas || 'TI-3A',
                ruangLab: docItem.ruangLab || 'Laboratorium',
                hari: docItem.hari || 'Senin',
                jamMulai: docItem.jamMulai || '08:00',
                jamSelesai: docItem.jamSelesai || '10:30',
                namaAsisten: docItem.namaAsisten || 'Asisten Lab',
                status,
                tanggalAktif:
                  docItem.tanggalAktif ||
                  new Date().toISOString().split('T')[0],
              };
            });
            setDaftarSesi(mappedSessions);
          }
        },
        (sessionError: Error) => {
          console.warn('Gagal sinkronisasi sesi dari Firestore:', sessionError);
        }
      );
    } catch (err) {
      console.warn('Inisialisasi listener sesi Firestore gagal:', err);
    }

    try {
      const qAttendances = query(collection(db, COLLECTIONS.ATTENDANCES));
      unsubscribeAttendances = onSnapshot(
        qAttendances,
        (snapshot) => {
          if (!snapshot.empty) {
            const mappedList: CatatanPresensi[] = snapshot.docs.map((docSnap) => {
              const d = docSnap.data();
              return {
                id: docSnap.id,
                sesiId: d.sessionId || '',
                praktikanId: d.studentId || '',
                namaPraktikan: d.studentName || 'Praktikan',
                nimPraktikan: d.studentNim || '-',
                kelasPraktikan: d.studentClass || 'TI-3A',
                waktuPresensi: d.waktuPresensi || 'WIB',
                statusKehadiran: d.statusKehadiran || 'HADIR',
                catatan: d.catatan || '',
              };
            });
            setDaftarPresensi(mappedList);
          }
        },
        (attendError) => {
          console.warn('Gagal sinkronisasi presensi dari Firestore:', attendError);
        }
      );
    } catch (err) {
      console.warn('Inisialisasi listener presensi Firestore gagal:', err);
    }

    return () => {
      if (unsubscribeSessions) unsubscribeSessions();
      if (unsubscribeAttendances) unsubscribeAttendances();
    };
  }, []);

  /**
   * Fungsi untuk mengganti peran aktif antara 'asisten' dan 'praktikan'
   * Menjaga identitas akun asli login jika ada, atau fallback ke dummy untuk tamu.
   */
  const gantiPeran = (peran: PeranPengguna): void => {
    setPeranAktif(peran);
    if (auth?.setActiveRole) {
      auth.setActiveRole(peran);
    }

    if (auth?.userProfile) {
      // Pertahankan identitas nama & data asli pengguna yang sedang login
      setPenggunaAktif({
        id: auth.userProfile.uid,
        nama: auth.userProfile.nama,
        nomorInduk: auth.userProfile.nomorInduk,
        kelas: auth.userProfile.kelas || undefined,
        peran: peran,
      });
    } else {
      // Tamu / demo offline
      if (peran === 'asisten') {
        setPenggunaAktif(DUMMY_ASISTEN[0]);
      } else {
        setPenggunaAktif(DUMMY_PRAKTIKAN[0]);
      }
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
      if (auth?.setActiveRole) {
        auth.setActiveRole(target.peran);
      }
    }
  };

  /**
   * Fungsi Asisten: Membuka sesi praktikum (Tersinkronisasi Real-Time ke Cloud Firestore)
   */
  const bukaSesi = (sesiId: string, ruangLab?: string): void => {
    // 1. Optimistic update
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

    // 2. Tembus langsung ke Cloud Firestore
    openSession(sesiId, ruangLab).catch((err) =>
      console.warn('Gagal sinkron openSession ke Firestore:', err)
    );
  };

  /**
   * Fungsi Asisten: Menutup sesi praktikum (Tersinkronisasi Real-Time ke Cloud Firestore)
   */
  const tutupSesi = (sesiId: string): void => {
    // 1. Optimistic update
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

    // 2. Tembus langsung ke Cloud Firestore
    closeSession(sesiId).catch((err) =>
      console.warn('Gagal sinkron closeSession ke Firestore:', err)
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
        modeTema,
        tema,
        toggleModeTema,
        setModeTema,
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
