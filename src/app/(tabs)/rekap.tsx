/**
 * @file src/app/(tabs)/rekap.tsx
 * @description Layar Rekapitulasi Presensi Praktikum.
 * Area Kerja Utama: Pemrogram 3 (Rekapitulasi Kehadiran & Monitoring Asisten).
 *
 * Tanggung Jawab Pemrogram 3:
 * - Menyediakan pengalih peran cepat (RoleSelector) untuk simulasi sudut pandang Asisten & Praktikan.
 * - Mengintegrasikan modul fitur RekapPresensiView (statistik ketercapaian, filter/pencarian,
 *   daftar kehadiran per sesi, modal detail catatan, serta ringkasan catatan kehadiran pribadi).
 */

import React from 'react';
import { ScreenContainer } from '@/components/ScreenContainer';
import { RoleSelector } from '@/components/common/RoleSelector';
import { RekapPresensiView } from '@/features/rekap/RekapPresensiView';

export default function RekapScreen(): React.JSX.Element {
  return (
    <ScreenContainer
      badge="Sprint 1"
      title="Rekapitulasi Kehadiran"
      description="Pemantauan daftar kehadiran mahasiswa, rasio ketercapaian kelas, dan catatan waktu presensi setiap sesi praktikum."
      docUrl="Sprint 1: Modul Rekapitulasi & Monitoring Kehadiran"
    >
      {/* Pengalih Peran Pengguna untuk kemudahan simulasi alur Sprint 1 */}
      <RoleSelector />

      {/* Komponen Modular Rekapitulasi Kehadiran */}
      <RekapPresensiView />
    </ScreenContainer>
  );
}
