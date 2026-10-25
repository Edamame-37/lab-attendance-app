/**
 * @file src/theme/index.ts
 * @description Sistem token tema dan palet warna ganda untuk aplikasi Presensi Praktikum.
 *
 * Menerapkan spesifikasi desain yang telah disetujui:
 * - Light Mode: Opsi 3 (Warm Academic Stone) dengan aksen Pinus Akademis (#047857)
 * - Dark Mode:  Opsi 2 (Elevated Obsidian Dark) dengan aksen Indigo Modern (#6366F1)
 */

export type ModeTema = 'light' | 'dark';

export interface ThemeColors {
  /** Warna latar belakang kanvas utama aplikasi */
  canvas: string;
  /** Warna permukaan kartu atau container utama */
  surface: string;
  /** Warna permukaan terangkat atau inset item */
  surfaceRaised: string;
  /** Warna border default */
  border: string;
  /** Warna border halus / pemisah item */
  borderSubtle: string;

  /** Warna teks primer dengan keterbacaan tertinggi */
  textPrimary: string;
  /** Warna teks sekunder untuk konteks / sub-line */
  textSecondary: string;
  /** Warna teks muted / placeholder */
  textMuted: string;

  /** Warna aksen utama brand */
  accent: string;
  /** Warna permukaan beraksen transparan halus */
  accentSurface: string;
  /** Warna teks atau ikon aksen */
  accentText: string;

  /** Warna background Tab Bar bawah */
  tabBar: string;
  /** Warna border atas Tab Bar */
  tabBarBorder: string;
  /** Warna ikon/teks tab tidak aktif */
  tabMuted: string;

  /** Warna indikator status */
  statusHadir: string;
  statusHadirSurface: string;
  statusIzin: string;
  statusIzinSurface: string;
  statusSakit: string;
  statusSakitSurface: string;
  statusBelum: string;

  /** Bayangan kartu preset */
  cardShadow: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
}

/**
 * Palet Light Mode: Opsi 3 (Warm Academic Stone)
 * Memberikan kesan hangat, tenang, dan bernuansa akademis profesional.
 */
export const lightTheme: ThemeColors = {
  canvas: '#F4F4F5',
  surface: '#FFFFFF',
  surfaceRaised: '#FAFAFA',
  border: '#E4E4E7',
  borderSubtle: '#F4F4F5',

  textPrimary: '#18181B',
  textSecondary: '#52525B',
  textMuted: '#71717A',

  accent: '#047857', // Pine Emerald Green
  accentSurface: '#ECFDF5',
  accentText: '#065F46',

  tabBar: '#FFFFFF',
  tabBarBorder: '#E4E4E7',
  tabMuted: '#71717A',

  statusHadir: '#059669',
  statusHadirSurface: '#ECFDF5',
  statusIzin: '#4F46E5',
  statusIzinSurface: '#EEF2FF',
  statusSakit: '#D97706',
  statusSakitSurface: '#FFFBEB',
  statusBelum: '#71717A',

  cardShadow: {
    shadowColor: '#18181B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
};

/**
 * Palet Dark Mode: Opsi 2 (Elevated Obsidian Dark)
 * Memberikan kontras tinggi yang elegan tanpa silau, dengan aksen visual tajam.
 */
export const darkTheme: ThemeColors = {
  canvas: '#090D16',
  surface: '#111827',
  surfaceRaised: '#182236',
  border: '#1F2937',
  borderSubtle: '#162032',

  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',

  accent: '#6366F1', // Indigo Accent
  accentSurface: 'rgba(99, 102, 241, 0.14)',
  accentText: '#A5B4FC',

  tabBar: '#0D1322',
  tabBarBorder: '#1F2937',
  tabMuted: '#64748B',

  statusHadir: '#10B981',
  statusHadirSurface: 'rgba(16, 185, 129, 0.12)',
  statusIzin: '#818CF8',
  statusIzinSurface: 'rgba(129, 140, 248, 0.12)',
  statusSakit: '#FBBF24',
  statusSakitSurface: 'rgba(251, 191, 36, 0.12)',
  statusBelum: '#64748B',

  cardShadow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
};

/**
 * Skala Spacing Universal (Kelipatan 4px/8px matematis)
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 14,
  lg: 16,
  gutter: 18,
  xl: 20,
  xxl: 24,
  section: 28,
  bottom: 36,
} as const;

/**
 * Skala Radius Universal
 */
export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  full: 9999,
} as const;
