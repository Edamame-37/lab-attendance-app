import React, { createContext, ReactNode, useContext, useState } from 'react';
import { useAuth } from './AuthContext';
import { AppContextType, ModeTema, PeranPengguna, Pengguna } from '@/types';
import { darkTheme, lightTheme } from '@/theme';

const AppContext = createContext<AppContextType | undefined>(undefined);

export interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const auth = useAuth();
  const [modeTema, setModeTema] = useState<ModeTema>('light');
  const tema = modeTema === 'dark' ? darkTheme : lightTheme;

  const peranAktif: PeranPengguna = auth.activeRole || 'praktikan';
  const penggunaAktif: Pengguna = {
    id: auth.userProfile?.uid || '',
    nama: auth.userProfile?.nama || 'Pengguna',
    nomorInduk: auth.userProfile?.nomorInduk || '-',
    kelas: auth.userProfile?.kelas || undefined,
    peran: peranAktif,
  };

  const gantiPeran = (peran: PeranPengguna): void => {
    if (auth.availableRoles.includes(peran)) {
      void auth.setActiveRole(peran);
    }
  };

  return (
    <AppContext.Provider
      value={{
        peranAktif,
        penggunaAktif,
        gantiPeran,
        modeTema,
        tema,
        toggleModeTema: () => setModeTema((current) => current === 'dark' ? 'light' : 'dark'),
        setModeTema,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp harus digunakan di dalam <AppProvider>');
  }
  return context;
};
