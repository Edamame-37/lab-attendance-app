import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import type { PeranPengguna } from '@/types';

type RoleRouteGuardProps = {
  allowedRole: PeranPengguna;
  children: React.ReactNode;
};

export function RoleRouteGuard({
  allowedRole,
  children,
}: RoleRouteGuardProps): React.JSX.Element {
  const { role } = useAuth();

  if (role !== allowedRole) {
    return <Redirect href="/(tabs)" />;
  }

  return <>{children}</>;
}
