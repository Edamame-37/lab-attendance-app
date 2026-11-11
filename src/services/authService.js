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
  role = 'praktikan',
  kelas = '',
}) => {
  if (!email || !password || !nama || !nomorInduk) {
    throw new Error('Mohon lengkapi seluruh field pendaftaran yang wajib diisi.');
  }

  if (password.length < 6) {
    throw new Error('Kata sandi harus terdiri dari minimal 6 karakter.');
  }

  // 1. Buat user di Firebase Authentication
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email.trim(),
    password
  );
  const user = userCredential.user;

  // 2. Perbarui displayName di Firebase Auth user
  try {
    await updateProfile(user, {
      displayName: nama.trim(),
    });
  } catch (profileError) {
    console.warn('Gagal memperbarui displayName auth:', profileError);
  }

  // 3. Bentuk payload profil untuk koleksi Firestore 'users'
  const userProfile = {
    uid: user.uid,
    nama: nama.trim(),
    nomorInduk: nomorInduk.trim(),
    email: email.trim().toLowerCase(),
    role: role,
    kelas: role === 'praktikan' ? (kelas ? kelas.trim() : 'A') : null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  // 4. Simpan dokumen profil ke Firestore dengan ID = UID user
  const userDocRef = doc(db, 'users', user.uid);
  await setDoc(userDocRef, userProfile);

  return { user, profile: userProfile };
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
    return {
      uid,
      ...docSnap.data(),
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

