import React from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';

export default function LegacyFirestoreAttendanceRoute(): React.JSX.Element {
  const params = useLocalSearchParams();
  const sessionId = Array.isArray(params.sessionId) ? params.sessionId[0] : params.sessionId;

  const destination = {
    pathname: '/presensi-lokasi',
    params: sessionId ? { sessionId } : {},
  } as any;

  return <Redirect href={destination} />;
}
