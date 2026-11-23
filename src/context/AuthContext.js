/**
 * @file src/context/AuthContext.js
 * @description State Provider untuk Autentikasi Pengguna dan Manajemen Peran (Praktikan vs Asisten).
 * Memantau listener onAuthStateChanged Firebase secara real-time dan menyinkronkan profil Firestore.
 *
 * @author Azlan (feature/auth-user-management)
 * @srs SRS-FT-01, SRS-FT-08
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
const ACTIVE_ROLE_STORAGE_KEY = 'ppk.activeRole';

export const normalizeProfileRoles = (profile) => {
  if (!profile) return [];
  if (Array.isArray(profile.roles)) {
    return [...new Set(profile.roles.filter((role) => ['praktikan', 'asisten'].includes(role)))];
  }
  return ['praktikan', 'asisten'].includes(profile.role) ? [profile.role] : [];
};

/**
 * AuthProvider membungkus aplikasi untuk menyediakan state autentikasi ke seluruh komponen
 */
export const AuthProvider = ({ children }) => {
  // State user dari Firebase Auth
  const [user, setUser] = useState(null);

  // State profil pengguna dari Firestore (termasuk role, nama, nomorInduk, kelas)
  const [userProfile, setUserProfile] = useState(null);

  // State peran aktif yang bisa dialihkan (untuk simulasi/demo maupun switch peran)
  const [activeRole, setActiveRole] = useState(null);

  // Status loading inisialisasi sesi login awal
  const [isLoading, setIsLoading] = useState(true);

  // Status error autentikasi terkini (jika ada)
  const [authError, setAuthError] = useState(null);
  const [activeRole, setActiveRoleState] = useState(null);

  const applyProfile = useCallback(async (profile) => {
    const roles = normalizeProfileRoles(profile);
    if (!profile || roles.length === 0) return false;

    const storedRole = await AsyncStorage.getItem(ACTIVE_ROLE_STORAGE_KEY);
    const nextRole = roles.includes(storedRole) ? storedRole : roles[0];
    setUserProfile({ ...profile, role: nextRole, roles });
    setActiveRoleState(nextRole);
    return true;
  }, []);

  /**
   * Listener real-time status autentikasi Firebase
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setUser(null);
        setUserProfile(null);
        setActiveRoleState(null);
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
        if (!(await applyProfile(profile))) {
          setUserProfile(null);
          setAuthError(
            'Profil pengguna tidak ditemukan atau role tidak valid. Hubungi administrator.'
          );
          await logoutUser();
          setUser(null);
          setIsLoading(false);
          return;
        }
      } catch (error) {
        console.warn('Profil pengguna tidak dapat dimuat dari Firestore:', error);

        setUserProfile(null);
        setAuthError(
          'Gagal memuat profil pengguna dari Firestore. Silakan coba login kembali atau hubungi administrator.'
        );

        try {
          await logoutUser();
        } catch (logoutError) {
          console.warn('Gagal mengakhiri sesi pengguna:', logoutError);
        }

        setUser(null);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [applyProfile]);

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
      await applyProfile(profile);
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
      await applyProfile(profile);
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
      setActiveRoleState(null);
      await AsyncStorage.removeItem(ACTIVE_ROLE_STORAGE_KEY);
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
        await applyProfile(profile);
      }
    } catch (error) {
      console.warn('Gagal memuat ulang profil pengguna:', error);
    }
  };

  /**
   * Autentikasi aplikasi baru dianggap valid kalau profil dan role pengguna juga valid
   */
  const availableRoles = useMemo(
    () => normalizeProfileRoles(userProfile),
    [userProfile]
  );

  const isAuthenticated = !!user && !!userProfile && !!activeRole && availableRoles.includes(activeRole);

  /**
   * Role aktif (dapat dialihkan untuk demonstrasi atau alih tugas)
   */
  const role = activeRole;

  const setActiveRole = useCallback(async (nextRole) => {
    if (!availableRoles.includes(nextRole)) {
      throw new Error('Peran tersebut tidak diberikan kepada akun ini.');
    }
    setActiveRoleState(nextRole);
    setUserProfile((current) => current ? { ...current, role: nextRole } : current);
    await AsyncStorage.setItem(ACTIVE_ROLE_STORAGE_KEY, nextRole);
  }, [availableRoles]);

  const contextValue = {
    user,
    userProfile,
    role,
    activeRole,
    availableRoles,
    setActiveRole,
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

