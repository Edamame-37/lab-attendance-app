/**
 * @file src/context/AuthContext.d.ts
 * @description Deklarasi tipe TypeScript untuk modul AuthContext JavaScript.
 *
 * @author Azlan (feature/auth-user-management)
 */

import React from 'react';
import type { User } from 'firebase/auth';
import type { PeranPengguna } from '@/types';

export interface UserProfile {
  uid: string;
  nama: string;
  nomorInduk: string;
  email: string;
  role: PeranPengguna;
  kelas?: string | null;
  createdAt?: any;
  updatedAt?: any;
}

export interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  role: PeranPengguna;
  isLoading: boolean;
  isAuthenticated: boolean;
  authError: string | null;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; user: User; profile: UserProfile }>;
  register: (userData: {
    email: string;
    password: string;
    nama: string;
    nomorInduk: string;
    role?: PeranPengguna;
    kelas?: string;
  }) => Promise<{ success: boolean; user: User; profile: UserProfile }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setAuthError: (error: string | null) => void;
}

export const AuthContext: React.Context<AuthContextType | null>;
export const AuthProvider: React.FC<{ children: React.ReactNode }>;
export function useAuth(): AuthContextType;
export default AuthContext;

