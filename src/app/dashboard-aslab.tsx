/**
 * @file src/app/dashboard-aslab.tsx
 * @description Route layar Dashboard Keberlangsungan Laboratorium & Keuangan Denda
 * untuk peran Asisten Laboratorium (Aslab) (SRS-FT-19).
 *
 * @author Aufaarel Nabiil Aryadh Mecca (feature/aslab-dashboard-fines)
 * @srs SRS-FT-19
 */

import React from 'react';
import { RoleRouteGuard } from '@/components/navigation/RoleRouteGuard';
import AslabDashboardScreen from '@/screens/aslab/AslabDashboardScreen';

export default function AslabDashboardRoute(): React.JSX.Element {
  return (
    <RoleRouteGuard allowedRole={'aslab' as any}>
      <AslabDashboardScreen />
    </RoleRouteGuard>
  );
}
