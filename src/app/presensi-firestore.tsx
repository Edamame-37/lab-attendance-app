import React from 'react';
import { AttendanceScanScreen } from '@/screens/praktikan/AttendanceScanScreen';
import { RoleRouteGuard } from '@/components/navigation/RoleRouteGuard';

export default function PresensiFirestoreRoute(): React.JSX.Element {
  return (
    <RoleRouteGuard allowedRole="praktikan">
      <AttendanceScanScreen />
    </RoleRouteGuard>
  );
}