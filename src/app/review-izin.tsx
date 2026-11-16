import React from 'react';
import { LeaveReviewScreen } from '@/screens/asisten/LeaveReviewScreen';
import { RoleRouteGuard } from '@/components/navigation/RoleRouteGuard';

export default function ReviewIzinRoute(): React.JSX.Element {
  return (
    <RoleRouteGuard allowedRole="asisten">
      <LeaveReviewScreen />
    </RoleRouteGuard>
  );
}