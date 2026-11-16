import React from 'react';
import { SessionManageScreen } from '@/screens/asisten/SessionManageScreen';
import { RoleRouteGuard } from '@/components/navigation/RoleRouteGuard';

export default function SesiRoute(): React.JSX.Element {
  return (
    <RoleRouteGuard allowedRole="asisten">
      <SessionManageScreen />
    </RoleRouteGuard>
  );
}