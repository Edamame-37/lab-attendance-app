import React from 'react';
import { LeaveStatusScreen } from '@/screens/praktikan/LeaveStatusScreen';
import { RoleRouteGuard } from '@/components/navigation/RoleRouteGuard';

export default function StatusIzinRoute(): React.JSX.Element {
  return (
    <RoleRouteGuard allowedRole="praktikan">
      <LeaveStatusScreen />
    </RoleRouteGuard>
  );
}