/**
 * @file src/config/firebase.js
 * @description Inisialisasi Firebase SDK (App, Authentication dengan AsyncStorage persistence, dan Cloud Firestore)
 * untuk aplikasi Presensi Praktikum Mobile.
 *
 * @author Azlan (feature/auth-user-management)
 * @srs SRS-FT-01, SRS-FT-08
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  getReactNativePersistence,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Konfigurasi Firebase dari Environment Variables Expo (dengan nilai fallback terverifikasi)
 */
const firebaseConfig = {
  apiKey:
    process.env.EXPO_PUBLIC_FIREBASE_API_KEY ||
    'AIzaSyCyxQ_Ihv6D2utM3cXsJM3vxYTc6rNTkFM',
  authDomain:
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    'ppk-mobile-praktikum.firebaseapp.com',
  projectId:
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'ppk-mobile-praktikum',
  storageBucket:
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    'ppk-mobile-praktikum.firebasestorage.app',
  messagingSenderId:
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '568796656687',
  appId:
    process.env.EXPO_PUBLIC_FIREBASE_APP_ID ||
    '1:568796656687:web:d70df7a80e463301fb82da',
  measurementId:
    process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-L0N31JTMPE',
};

/**
 * Singleton instance Firebase App untuk mencegah duplikasi instance saat Fast Refresh / HMR
 */
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

/**
 * Inisialisasi Firebase Auth dengan AsyncStorage persistence untuk React Native.
 * Pada lingkungan Web, digunakan persistensi standar browser.
 */
let auth;
try {
  if (Platform.OS === 'web') {
    auth = getAuth(app);
  } else {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage),
    });
  }
} catch (error) {
  // Jika instance auth sudah terinisialisasi sebelumnya (misal saat Hot Reload), ambil instance yang ada
  auth = getAuth(app);
}

/**
 * Inisialisasi Cloud Firestore Database
 */
const db = getFirestore(app);

export { app, auth, db };
export default app;

