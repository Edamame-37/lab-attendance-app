/**
 * @file src/context/AuthContext.js
 * @description State Provider untuk Autentikasi Pengguna dan Manajemen Peran (Praktikan vs Asisten).
 * Memantau listener onAuthStateChanged Firebase secara real-time dan menyinkronkan profil Firestore.
 *
 * @author Azlan (feature/auth-user-management)
 * @srs SRS-FT-01, SRS-FT-08
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import {
  loginUser,
  registerUser,
  logoutUser,
  getUserProfile,
  formatAuthError,
} from '../services/authService';

/**
 * @typedef {Object} UserProfile
 * @property {string} uid
 * @property {string} nama
 * @property {string} nomorInduk
 * @property {string} email
 * @property {'praktikan'|'asisten'} role
 * @property {string|null} [kelas]
 */

/**
 * Context Autentikasi Global
 */
const AuthContext = createContext(null);

/**
 * Membentuk profil minimum agar sesi autentikasi tetap dapat digunakan ketika
 * dokumen profil belum tersedia atau sementara gagal dibaca dari Firestore.
 *
 * @param {import('firebase/auth').User} firebaseUser
 * @returns {UserProfile}
 */
const createFallbackProfile = (firebaseUser) => ({
  uid: firebaseUser.uid,
  email: firebaseUser.email || '',
  nama: firebaseUser.displayName || 'Pengguna',
  nomorInduk: '-',
  role: 'praktikan',
  kelas: 'A',
});

/**
 * AuthProvider membungkus aplikasi untuk menyediakan state autentikasi ke seluruh komponen
 */
export const AuthProvider = ({ children }) => {
  // State user dari Firebase Auth
  const [user, setUser] = useState(null);

  // State profil pengguna dari Firestore (termasuk role, nama, nomorInduk, kelas)
  const [userProfile, setUserProfile] = useState(null);

  // Status loading inisialisasi sesi login awal
  const [isLoading, setIsLoading] = useState(true);

  // Status error autentikasi terkini (jika ada)
  const [authError, setAuthError] = useState(null);

  /**
   * Listener real-time status autentikasi Firebase
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setUser(null);
        setUserProfile(null);
        setAuthError(null);
        setIsLoading(false);
        return;
      }

      // Status Firebase Auth tetap valid meskipun profil Firestore gagal dimuat.
      setUser(currentUser);
      setAuthError(null);

      try {
        // Ambil data profil pengguna dari Firestore
        const profile = await getUserProfile(currentUser.uid);
        if (profile) {
          setUserProfile(profile);
        } else {
          // Profil fallback jika dokumen Firestore belum tersinkronisasi
          setUserProfile(createFallbackProfile(currentUser));
        }
      } catch (error) {
        console.warn('Profil pengguna tidak dapat dimuat dari Firestore:', error);
        setUserProfile(createFallbackProfile(currentUser));
        setAuthError(
          'Sesi berhasil dipulihkan, tetapi profil pengguna tidak dapat dimuat.'
        );
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  /**
   * Fungsi Login
   * @param {string} email
   * @param {string} password
   */
  const login = async (email, password) => {
    setAuthError(null);
    try {
      const { user: loggedInUser, profile } = await loginUser(email, password);
      setUser(loggedInUser);
      setUserProfile(profile);
      return { success: true, user: loggedInUser, profile };
    } catch (error) {
      const errorMessage = formatAuthError(error);
      setAuthError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  /**
   * Fungsi Register
   * @param {Object} userData
   */
  const register = async (userData) => {
    setAuthError(null);
    try {
      const { user: registeredUser, profile } = await registerUser(userData);
      setUser(registeredUser);
      setUserProfile(profile);
      return { success: true, user: registeredUser, profile };
    } catch (error) {
      const errorMessage = formatAuthError(error);
      setAuthError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  /**
   * Fungsi Logout
   */
  const logout = async () => {
    setAuthError(null);
    try {
      await logoutUser();
      setUser(null);
      setUserProfile(null);
    } catch (error) {
      const errorMessage = formatAuthError(error);
      setAuthError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  /**
   * Memperbarui profil secara manual dari Firestore
   */
  const refreshProfile = async () => {
    if (!user) return;
    try {
      const profile = await getUserProfile(user.uid);
      if (profile) {
        setUserProfile(profile);
      }
    } catch (error) {
      console.warn('Gagal memuat ulang profil pengguna:', error);
    }
  };

  /**
   * Helper penentu apakah user sedang login dan profil valid
   */
  const isAuthenticated = !!user;

  /**
   * Peran aktif pengguna saat ini ('praktikan' atau 'asisten')
   */
  const role = userProfile?.role || 'praktikan';

  const contextValue = {
    user,
    userProfile,
    role,
    isLoading,
    isAuthenticated,
    authError,
    login,
    register,
    logout,
    refreshProfile,
    setAuthError,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

/**
 * Custom hook untuk mengakses state dan aksi autentikasi
 * @returns {Object} auth context value
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth harus digunakan di dalam <AuthProvider>');
  }
  return context;
};

export default AuthContext;

