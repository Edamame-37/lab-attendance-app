import type { PeranPengguna } from '@/types';

export const AUTH_ROLES: readonly PeranPengguna[] = ['praktikan', 'asisten', 'aslab'];

export type AccountStatus = 'active' | 'suspended';

export type AuthProfileCandidate = {
  uid?: unknown;
  email?: unknown;
  nama?: unknown;
  nomorInduk?: unknown;
  kelas?: unknown;
  role?: unknown;
  roles?: unknown;
  accountStatus?: unknown;
  assignedLabIds?: unknown;
};

export type ProfileValidationResult = {
  valid: boolean;
  roles: PeranPengguna[];
  accountStatus: AccountStatus;
  message?: string;
};

const isAuthRole = (value: unknown): value is PeranPengguna =>
  typeof value === 'string' && AUTH_ROLES.includes(value as PeranPengguna);

export const normalizeProfileRoles = (
  profile?: AuthProfileCandidate | null,
): PeranPengguna[] => {
  if (!profile) return [];

  const candidates = Array.isArray(profile.roles)
    ? profile.roles
    : [profile.role];

  return [...new Set(candidates.filter(isAuthRole))];
};

export const selectActiveRole = (
  roles: PeranPengguna[],
  storedRole?: string | null,
): PeranPengguna | null => {
  if (storedRole && isAuthRole(storedRole) && roles.includes(storedRole)) {
    return storedRole;
  }
  return roles[0] ?? null;
};

export const validateAuthProfile = (
  profile?: AuthProfileCandidate | null,
): ProfileValidationResult => {
  const roles = normalizeProfileRoles(profile);
  const accountStatus: AccountStatus =
    profile?.accountStatus === 'suspended' ? 'suspended' : 'active';

  if (!profile) {
    return { valid: false, roles, accountStatus, message: 'Profil pengguna tidak ditemukan.' };
  }

  if (accountStatus !== 'active') {
    return { valid: false, roles, accountStatus, message: 'Akun pengguna sedang dinonaktifkan.' };
  }

  const requiredIdentityFields = [profile.uid, profile.email, profile.nama, profile.nomorInduk];
  if (requiredIdentityFields.some((value) => typeof value !== 'string' || !value.trim())) {
    return {
      valid: false,
      roles,
      accountStatus,
      message: 'Profil pengguna belum memiliki identitas yang lengkap.',
    };
  }

  if (roles.length === 0) {
    return {
      valid: false,
      roles,
      accountStatus,
      message: 'Profil pengguna belum memiliki role yang valid.',
    };
  }

  if (
    roles.includes('praktikan') &&
    (typeof profile.kelas !== 'string' || !profile.kelas.trim())
  ) {
    return {
      valid: false,
      roles,
      accountStatus,
      message: 'Profil praktikan belum memiliki kelas.',
    };
  }

  return { valid: true, roles, accountStatus };
};
