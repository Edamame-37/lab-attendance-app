import React from 'react';
import { RoleRouteGuard } from '@/components/navigation/RoleRouteGuard';
import LabTransferScreen from '@/screens/aslab/LabTransferScreen';

export default function TransferLabRoute(): React.JSX.Element {
  return (
    <RoleRouteGuard allowedRole="aslab">
      <LabTransferScreen />
    </RoleRouteGuard>
  );
}
