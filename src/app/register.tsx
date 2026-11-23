import React from 'react';
import { useRouter, type Href } from 'expo-router';
import RegisterScreen from '@/screens/auth/RegisterScreen';

export default function RegisterRoute(): React.JSX.Element {
  const router = useRouter();
  return <RegisterScreen onNavigateToLogin={() => router.replace('/login' as Href)} />;
}
