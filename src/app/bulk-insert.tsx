import React from 'react';
import { RoleRouteGuard } from '@/components/navigation/RoleRouteGuard';
import BulkInsertScreen from '@/screens/aslab/BulkInsertScreen';

export default function BulkInsertRoute(): React.JSX.Element {
  return (
    <RoleRouteGuard allowedRole="aslab">
      <BulkInsertScreen />
    </RoleRouteGuard>
  );
}
