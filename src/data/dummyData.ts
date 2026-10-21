/**
 * @file src/data/dummyData.ts
 * @description Data awal dummy untuk identitas pengguna, jadwal praktikum, dan catatan presensi.
 * Digunakan sebagai state awal pada Sprint 1.
 */

import { Pengguna, JadwalSesi, CatatanPresensi } from '@/types';

/**
 * Daftar data dummy asisten laboratorium
 */
export const DUMMY_ASISTEN: Pengguna[] = [
  {
    id: 'asisten-1',
    nama: 'Rian Hidayat, S.Kom.',
    nomorInduk: '199503122022031001',
    peran: 'asisten',
  },
  {
    id: 'asisten-2',
    nama: 'Siti Nurhaliza, S.T.',
    nomorInduk: '199708252023012002',
    peran: 'asisten',
  },
];

/**
 * Daftar data dummy praktikan (mahasiswa)
 */
export const DUMMY_PRAKTIKAN: Pengguna[] = [
  {
    id: 'mhs-1',
    nama: 'Ahmad Fauzi',
    nomorInduk: '2141720001',
    kelas: 'TI-3A',
    peran: 'praktikan',
  },
  {
    id: 'mhs-2',
    nama: 'Budi Santoso',
    nomorInduk: '2141720045',
    kelas: 'TI-3A',
    peran: 'praktikan',
  },
  {
    id: 'mhs-3',
    nama: 'Citra Lestari',
    nomorInduk: '2141720088',
    kelas: 'TI-3A',
    peran: 'praktikan',
  },
  {
    id: 'mhs-4',
    nama: 'Dimas Wicaksono',
    nomorInduk: '2141720102',
    kelas: 'TI-3B',
    peran: 'praktikan',
  },
  {
    id: 'mhs-5',
    nama: 'Eka Putri Rahayu',
    nomorInduk: '2141720130',
    kelas: 'TI-3B',
    peran: 'praktikan',
  },
];

/**
 * Daftar data awal jadwal sesi praktikum dengan berbagai status
 */
export const DUMMY_SESI: JadwalSesi[] = [
  {
    id: 'sesi-1',
    kodeMataKuliah: 'PRAK-PPK01',
    namaPraktikum: 'Praktikum Pemrograman Perangkat Bergerak',
    topikMateri: 'Pertemuan 1: React Native Core Components dan Flexbox',
    kelas: 'TI-3A',
    ruangLab: 'Laboratorium Rekayasa Perangkat Lunak 1',
    hari: 'Senin',
    jamMulai: '08:00',
    jamSelesai: '10:30',
    namaAsisten: 'Rian Hidayat, S.Kom.',
    status: 'DIBUKA',
    tanggalAktif: '2026-10-21',
  },
  {
    id: 'sesi-2',
    kodeMataKuliah: 'PRAK-PPK02',
    namaPraktikum: 'Praktikum Pemrograman Perangkat Bergerak',
    topikMateri: 'Pertemuan 1: Pengenalan State dan TextInput',
    kelas: 'TI-3B',
    ruangLab: 'Laboratorium Rekayasa Perangkat Lunak 2',
    hari: 'Senin',
    jamMulai: '13:00',
    jamSelesai: '15:30',
    namaAsisten: 'Siti Nurhaliza, S.T.',
    status: 'DITUTUP',
    tanggalAktif: '2026-10-21',
  },
  {
    id: 'sesi-3',
    kodeMataKuliah: 'PRAK-JARKOM',
    namaPraktikum: 'Praktikum Jaringan Komputer Lanjut',
    topikMateri: 'Pertemuan 4: Konfigurasi Routing Dinamis OSPF',
    kelas: 'TI-3A',
    ruangLab: 'Laboratorium Jaringan Komputer',
    hari: 'Jumat',
    jamMulai: '09:00',
    jamSelesai: '11:30',
    namaAsisten: 'Rian Hidayat, S.Kom.',
    status: 'SELESAI',
    tanggalAktif: '2026-10-18',
  },
];

/**
 * Daftar data awal catatan presensi
 */
export const DUMMY_PRESENSI: CatatanPresensi[] = [
  {
    id: 'presensi-1',
    sesiId: 'sesi-1',
    praktikanId: 'mhs-1',
    namaPraktikan: 'Ahmad Fauzi',
    nimPraktikan: '2141720001',
    kelasPraktikan: 'TI-3A',
    waktuPresensi: '08:12:45 WIB',
    statusKehadiran: 'HADIR',
    catatan: 'Hadir tepat waktu di Lab RPL 1',
  },
  {
    id: 'presensi-2',
    sesiId: 'sesi-1',
    praktikanId: 'mhs-2',
    namaPraktikan: 'Budi Santoso',
    nimPraktikan: '2141720045',
    kelasPraktikan: 'TI-3A',
    waktuPresensi: '08:15:30 WIB',
    statusKehadiran: 'HADIR',
    catatan: 'Hadir',
  },
  {
    id: 'presensi-3',
    sesiId: 'sesi-3',
    praktikanId: 'mhs-1',
    namaPraktikan: 'Ahmad Fauzi',
    nimPraktikan: '2141720001',
    kelasPraktikan: 'TI-3A',
    waktuPresensi: '09:05:10 WIB',
    statusKehadiran: 'HADIR',
    catatan: 'Praktikum selesai sesuai jadwal',
  },
];
