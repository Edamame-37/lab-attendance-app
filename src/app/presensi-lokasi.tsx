import React from 'react';
import { RoleRouteGuard } from '@/components/navigation/RoleRouteGuard';
import AttendanceCheckScreen from '@/screens/praktikan/AttendanceCheckScreen';

export default function LocationAttendanceRoute(): React.JSX.Element {
  return (
    <RoleRouteGuard allowedRole="praktikan">
      <AttendanceCheckScreen />
    </RoleRouteGuard>
  );
}
