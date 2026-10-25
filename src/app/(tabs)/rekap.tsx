/**
 * @file src/app/(tabs)/rekap.tsx
 * @description Layar Rekapitulasi Presensi Praktikum (Pemrogram 3).
 *
 * Menerapkan arsitektur bersih:
 * - Menghilangkan RoleSelector berulang karena sudah terintegrasi di AppHeader.
 * - Membungkus RekapPresensiView dengan ScreenContainer bertema dinamis.
 */

import React from 'react';
import { ScreenContainer } from '@/components/ScreenContainer';
import { RekapPresensiView } from '@/features/rekap/RekapPresensiView';

export default function RekapScreen(): React.JSX.Element {
  return (
    <ScreenContainer>
      <RekapPresensiView />
    </ScreenContainer>
  );
}
