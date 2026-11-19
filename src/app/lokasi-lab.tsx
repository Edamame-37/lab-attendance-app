import React from 'react';
import { RoleRouteGuard } from '@/components/navigation/RoleRouteGuard';
import LabLocationManageScreen from '@/screens/asisten/LabLocationManageScreen';

export default function LabLocationRoute(): React.JSX.Element {
  return (
    <RoleRouteGuard allowedRole="asisten">
      <LabLocationManageScreen />
    </RoleRouteGuard>
  );
}
