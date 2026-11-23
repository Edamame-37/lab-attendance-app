/**
 * @file src/services/authService.js
 * @description Layanan Autentikasi Firebase dan sinkronisasi data profil pengguna ke Cloud Firestore.
 * Menangani registrasi, login, logout, pengambilan profil, dan penerjemahan kode error Firebase.
 *
 * @author Azlan (feature/auth-user-management)
 * @srs SRS-FT-01, SRS-FT-08
 */

import {
  createUserWithEmailAndPassword,
  deleteUser,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';

/**
 * Format pesan error Firebase menjadi pesan ramah pengguna berbahasa Indonesia
 * @param {Error|{code: string, message: string}} error
 * @returns {string} Pesan error yang telah diformat
 */
export const formatAuthError = (error) => {
  if (!error) return 'Terjadi kesalahan sistem.';

  const code = error.code || '';
  switch (code) {
    case 'auth/email-already-in-use':
      return 'Alamat email ini sudah terdaftar. Silakan masuk menggunakan akun Anda.';
    case 'auth/invalid-email':
      return 'Format alamat email tidak valid.';
    case 'auth/operation-not-allowed':
      return 'Metode pendaftaran Email/Password belum diaktifkan di Firebase Console.';
    case 'auth/weak-password':
      return 'Password terlalu lemah. Masukkan minimal 6 karakter.';
    case 'auth/user-disabled':
      return 'Akun pengguna ini telah dinonaktifkan oleh administrator.';
    case 'auth/user-not-found':
      return 'Akun dengan email tersebut tidak ditemukan.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Email atau password yang Anda masukkan salah.';
    case 'auth/too-many-requests':
      return 'Terlalu banyak percobaan gagal. Silakan coba beberapa saat lagi.';
    case 'auth/network-request-failed':
      return 'Gagal terhubung ke jaringan. Pastikan perangkat Anda terhubung ke internet.';
    default:
      return error.message || 'Terjadi kesalahan saat memproses autentikasi.';
  }
};

/**
 * Mendaftarkan pengguna baru ke Firebase Authentication dan membuat dokumen profil di Firestore
 *
 * @param {Object} params
 * @param {string} params.email - Alamat email pengguna
 * @param {string} params.password - Kata sandi akun (min 6 karakter)
 * @param {string} params.nama - Nama lengkap pengguna
 * @param {string} params.nomorInduk - NIM (untuk Praktikan) atau NIP/ID (untuk Asisten)
 * @param {'praktikan'|'asisten'} params.role - Peran pengguna dalam sistem praktikum
 * @param {string} [params.kelas] - Kelas praktikum (wajib untuk Praktikan, opsional untuk Asisten)
 * @returns {Promise<{user: import('firebase/auth').User, profile: Object}>}
 */
export const registerUser = async ({
  email,
  password,
  nama,
  nomorInduk,
  kelas = '',
}) => {
  const cleanEmail = email?.trim().toLowerCase();
  const cleanNama = nama?.trim();
  const cleanNomorInduk = nomorInduk?.trim();

  if (!cleanEmail || !password || !cleanNama || !cleanNomorInduk) {
    throw new Error('Mohon lengkapi seluruh data pendaftaran.');
  }

  if (password.length < 6) {
    throw new Error('Password minimal 6 karakter.');
  }

  if (!kelas?.trim()) {
    throw new Error('Kelas praktikum wajib dipilih.');
  }

  const credential = await createUserWithEmailAndPassword(
    auth,
    cleanEmail,
    password
  );

  const user = credential.user;

  try {
    await updateProfile(user, {
      displayName: cleanNama,
    });

    const userProfile = {
      uid: user.uid,
      nama: cleanNama,
      nomorInduk: cleanNomorInduk,
      email: cleanEmail,
      role: 'praktikan',
      roles: ['praktikan'],
      kelas: kelas.trim(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(doc(db, 'users', user.uid), userProfile);

    return {
      user,
      profile: userProfile,
    };
  } catch (error) {
    // Rollback akun Auth yang baru dibuat agar tidak meninggalkan akun yatim
    // ketika profil Firestore gagal disimpan.
    try {
      await deleteUser(user);
    } catch (rollbackError) {
      console.error('Gagal melakukan rollback akun registrasi:', rollbackError);
      await signOut(auth);
    }
    throw error;
  }
};

/**
 * Masuk (login) menggunakan email dan password serta mengambil data profil pengguna dari Firestore
 *
 * @param {string} email - Alamat email
 * @param {string} password - Kata sandi
 * @returns {Promise<{user: import('firebase/auth').User, profile: Object}>}
 */
export const loginUser = async (email, password) => {
  if (!email || !password) {
    throw new Error('Email dan kata sandi wajib diisi.');
  }

  // 1. Otentikasi kredensial pengguna
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email.trim(),
    password
  );
  const user = userCredential.user;

  // 2. Ambil data profil dari Firestore
  const profile = await getUserProfile(user.uid);

  return { user, profile };
};

/**
 * Keluar (logout) dari sesi pengguna saat ini
 * @returns {Promise<void>}
 */
export const logoutUser = async () => {
  await signOut(auth);
};

/**
 * Mengambil data profil pengguna dari Cloud Firestore berdasarkan UID
 *
 * @param {string} uid - Firebase Auth User ID
 * @returns {Promise<Object|null>} Data profil pengguna atau null jika belum ada
 */
export const getUserProfile = async (uid) => {
  if (!uid) return null;

  const userDocRef = doc(db, 'users', uid);
  const docSnap = await getDoc(userDocRef);

  if (docSnap.exists()) {
    const profileData = docSnap.data();
    const legacyRole = profileData.role;
    const roles = Array.isArray(profileData.roles)
      ? profileData.roles.filter((role) => ['praktikan', 'asisten'].includes(role))
      : ['praktikan', 'asisten'].includes(legacyRole)
        ? [legacyRole]
        : [];

    return {
      uid,
      ...profileData,
      role: roles[0] || null,
      roles,
    };
  }

  return null;
};

/**
 * Memperbarui data profil pengguna di Cloud Firestore
 *
 * @param {string} uid - Firebase Auth User ID
 * @param {Object} updateData - Data yang akan diperbarui
 * @returns {Promise<void>}
 */
export const updateUserProfile = async (uid, updateData) => {
  if (!uid) throw new Error('UID pengguna wajib disertakan.');

  const userDocRef = doc(db, 'users', uid);
  await updateDoc(userDocRef, {
    ...updateData,
    updatedAt: serverTimestamp(),
  });
};

