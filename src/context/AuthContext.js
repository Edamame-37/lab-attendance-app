import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import {
  normalizeProfileRoles,
  selectActiveRole,
  validateAuthProfile,
} from '../domain/auth';
import {
  formatAuthError,
  getUserProfile,
  loginUser,
  logoutUser,
  registerUser,
} from '../services/authService';

const AuthContext = createContext(null);
const getActiveRoleStorageKey = (uid) => `ppk.activeRole.${uid}`;

export { normalizeProfileRoles } from '../domain/auth';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [activeRole, setActiveRoleState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const clearSessionState = useCallback(() => {
    setUser(null);
    setUserProfile(null);
    setActiveRoleState(null);
  }, []);

  const applyProfile = useCallback(async (profile) => {
    const validation = validateAuthProfile(profile);
    if (!validation.valid) {
      return { success: false, message: validation.message };
    }

    const roleStorageKey = getActiveRoleStorageKey(profile.uid);
    const storedRole = await AsyncStorage.getItem(roleStorageKey);
    const nextRole = selectActiveRole(validation.roles, storedRole);
    if (!nextRole) {
      return { success: false, message: 'Role aktif pengguna tidak tersedia.' };
    }

    setUserProfile({
      ...profile,
      accountStatus: validation.accountStatus,
      roles: validation.roles,
      role: nextRole,
    });
    setActiveRoleState(nextRole);

    if (storedRole !== nextRole) {
      await AsyncStorage.setItem(roleStorageKey, nextRole);
    }

    return { success: true };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        clearSessionState();
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setUser(currentUser);

      try {
        const profile = await getUserProfile(currentUser.uid);
        const result = await applyProfile(profile);
        if (!result.success) {
          setAuthError(result.message || 'Profil pengguna tidak valid.');
          await logoutUser();
          clearSessionState();
          return;
        }
        setAuthError(null);
      } catch (error) {
        console.warn('Profil pengguna tidak dapat dimuat:', error);
        setAuthError('Profil pengguna tidak dapat dimuat. Silakan masuk kembali.');
        try {
          await logoutUser();
        } catch (logoutError) {
          console.warn('Sesi pengguna tidak dapat diakhiri:', logoutError);
        }
        clearSessionState();
      } finally {
        setIsLoading(false);
      }
    });

    return unsubscribe;
  }, [applyProfile, clearSessionState]);

  const login = useCallback(async (email, password) => {
    setAuthError(null);
    try {
      const { user: loggedInUser, profile } = await loginUser(email, password);
      const result = await applyProfile(profile);
      if (!result.success) {
        await logoutUser();
        throw new Error(result.message || 'Profil pengguna tidak valid.');
      }
      setUser(loggedInUser);
      return { success: true, user: loggedInUser, profile };
    } catch (error) {
      const errorMessage = formatAuthError(error);
      setAuthError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [applyProfile]);

  const register = useCallback(async (userData) => {
    setAuthError(null);
    try {
      const { user: registeredUser, profile } = await registerUser(userData);
      const result = await applyProfile(profile);
      if (!result.success) {
        await logoutUser();
        throw new Error(result.message || 'Profil pengguna tidak valid.');
      }
      setUser(registeredUser);
      return { success: true, user: registeredUser, profile };
    } catch (error) {
      const errorMessage = formatAuthError(error);
      setAuthError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [applyProfile]);

  const logout = useCallback(async () => {
    setAuthError(null);
    const roleStorageKey = user?.uid ? getActiveRoleStorageKey(user.uid) : null;
    try {
      await logoutUser();
      clearSessionState();
      if (roleStorageKey) {
        await AsyncStorage.removeItem(roleStorageKey);
      }
    } catch (error) {
      const errorMessage = formatAuthError(error);
      setAuthError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [clearSessionState, user]);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const profile = await getUserProfile(user.uid);
    const result = await applyProfile(profile);
    if (!result.success) {
      setAuthError(result.message || 'Profil pengguna tidak valid.');
      await logout();
    }
  }, [applyProfile, logout, user]);

  const availableRoles = useMemo(
    () => normalizeProfileRoles(userProfile),
    [userProfile],
  );

  const setActiveRole = useCallback(async (nextRole) => {
    if (!user?.uid) {
      throw new Error('Sesi pengguna tidak tersedia.');
    }

    if (!availableRoles.includes(nextRole)) {
      throw new Error('Peran tersebut tidak diberikan kepada akun ini.');
    }

    setActiveRoleState(nextRole);
    setUserProfile((current) => current ? { ...current, role: nextRole } : current);
    await AsyncStorage.setItem(getActiveRoleStorageKey(user.uid), nextRole);
  }, [availableRoles, user]);

  const isAuthenticated = Boolean(
    user && userProfile && activeRole && availableRoles.includes(activeRole),
  );
  const authStatus = isLoading
    ? 'initializing'
    : isAuthenticated
      ? 'authenticated'
      : 'unauthenticated';

  const contextValue = useMemo(() => ({
    user,
    userProfile,
    role: activeRole,
    activeRole,
    availableRoles,
    setActiveRole,
    authStatus,
    isLoading,
    isAuthenticated,
    authError,
    login,
    register,
    logout,
    refreshProfile,
    setAuthError,
  }), [
    activeRole,
    authError,
    authStatus,
    availableRoles,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshProfile,
    register,
    setActiveRole,
    user,
    userProfile,
  ]);

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth harus digunakan di dalam <AuthProvider>');
  }
  return context;
};

export default AuthContext;
