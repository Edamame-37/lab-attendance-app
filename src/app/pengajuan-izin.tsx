import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LeaveRequestScreen } from '@/screens/praktikan/LeaveRequestScreen';
import { RoleRouteGuard } from '@/components/navigation/RoleRouteGuard';

export default function PengajuanIzinRoute(): React.JSX.Element {
  const router = useRouter();
  const { sessionId, sessionName } = useLocalSearchParams<{
    sessionId?: string;
    sessionName?: string;
  }>();

  const session =
    sessionId && sessionName
      ? {
          id: sessionId,
          name: sessionName,
        }
      : undefined;

  // Adapter agar navigation.navigate milik screen lama tetap bisa digunakan melalui Expo Router.
  const navigation = {
    navigate: (screen: string) => {
      if (screen === 'LeaveStatus') {
        router.push('/status-izin');
      }
    },
  };

  // Menyediakan parameter route yang dibutuhkan screen.
  const route = {
    params: {
      session,
    },
  };

  return (
    <RoleRouteGuard allowedRole="praktikan">
      <LeaveRequestScreen navigation={navigation} route={route} />
    </RoleRouteGuard>
  );
}