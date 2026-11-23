import React from 'react';
import { useRouter, type Href } from 'expo-router';
import LoginScreen from '@/screens/auth/LoginScreen';

export default function LoginRoute(): React.JSX.Element {
  const router = useRouter();
  return <LoginScreen onNavigateToRegister={() => router.push('/register' as Href)} />;
}
