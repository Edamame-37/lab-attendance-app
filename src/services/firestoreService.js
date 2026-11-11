/**
 * @file src/services/firestoreService.js
 * @author Farrel (feature/lab-attendance-firestore)
 * @description Layanan Firestore terpusat untuk CRUD Sesi/Kelas, Presensi Terintegrasi,
 * dan Sinkronisasi Real-Time (SRS-FT-02, SRS-FT-03, SRS-FT-04).
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Nama koleksi utama di Firestore
export const COLLECTIONS = {
  SESSIONS: 'sessions',
  ATTENDANCES: 'attendances',
  CLASSES: 'classes',
};

/**
 * ============================================================================
 * 1. PENGELOLAAN SESI & KELAS PRAKTIKUM (SRS-FT-02)
 * ============================================================================
 */

/**
 * Mengambil semua sesi praktikum dari Firestore
 */
export const getSessions = async () => {
  try {
    const q = query(collection(db, COLLECTIONS.SESSIONS), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));
  } catch (error) {
    console.error('Error getSessions:', error);
    throw error;
  }
};

/**
 * Mengambil satu dokumen sesi berdasarkan ID
 */
export const getSessionById = async (sessionId) => {
  try {
    const docRef = doc(db, COLLECTIONS.SESSIONS, sessionId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return null;
    }
    return { id: docSnap.id, ...docSnap.data() };
  } catch (error) {
    console.error('Error getSessionById:', error);
    throw error;
  }
};

/**
 * Menambahkan sesi praktikum baru (Khusus Asisten)
 * @param {Object} sessionData - Data sesi (namaPraktikum, kelas, ruangLab, topikMateri, asistenId, dll)
 */
export const createSession = async (sessionData) => {
  try {
    if (!sessionData.namaPraktikum || !sessionData.kelas) {
      throw new Error('Nama praktikum dan kelas wajib diisi');
    }

    const payload = {
      namaPraktikum: sessionData.namaPraktikum,
      topikMateri: sessionData.topikMateri || '',
      kelas: sessionData.kelas,
      ruangLab: sessionData.ruangLab || 'Lab Utama',
      hari: sessionData.hari || 'Senin',
      jamMulai: sessionData.jamMulai || '08:00',
      jamSelesai: sessionData.jamSelesai || '10:00',
      namaAsisten: sessionData.namaAsisten || 'Asisten Lab',
      asistenId: sessionData.asistenId || '',
      status: 'closed', // 'open' | 'closed' (kompatibel 'DIBUKA' | 'DITUTUP')
      statusSesi: 'DITUTUP',
      catatanPembuka: '',
      waktuBuka: null,
      waktuTutup: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, COLLECTIONS.SESSIONS), payload);
    return { success: true, id: docRef.id, message: 'Sesi praktikum berhasil dibuat' };
  } catch (error) {
    console.error('Error createSession:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Mengubah data sesi praktikum
 */
export const updateSession = async (sessionId, updateData) => {
  try {
    const docRef = doc(db, COLLECTIONS.SESSIONS, sessionId);
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: serverTimestamp(),
    });
    return { success: true, message: 'Data sesi berhasil diperbarui' };
  } catch (error) {
    console.error('Error updateSession:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Menghapus dokumen sesi praktikum
 */
export const deleteSession = async (sessionId) => {
  try {
    const docRef = doc(db, COLLECTIONS.SESSIONS, sessionId);
    await deleteDoc(docRef);
    return { success: true, message: 'Sesi berhasil dihapus' };
  } catch (error) {
    console.error('Error deleteSession:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Membuka sesi praktikum agar praktikan bisa presensi
 */
export const openSession = async (sessionId, ruangLab = '', catatan = '') => {
  try {
    const docRef = doc(db, COLLECTIONS.SESSIONS, sessionId);
    const updatePayload = {
      status: 'open',
      statusSesi: 'DIBUKA',
      waktuBuka: serverTimestamp(),
      catatanPembuka: catatan || '',
      updatedAt: serverTimestamp(),
    };
    if (ruangLab) {
      updatePayload.ruangLab = ruangLab;
    }

    await updateDoc(docRef, updatePayload);
    return { success: true, message: 'Sesi praktikum berhasil dibuka' };
  } catch (error) {
    console.error('Error openSession:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Menutup sesi praktikum dan mengunci presensi
 */
export const closeSession = async (sessionId) => {
  try {
    const docRef = doc(db, COLLECTIONS.SESSIONS, sessionId);
    await updateDoc(docRef, {
      status: 'closed',
      statusSesi: 'SELESAI',
      waktuTutup: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { success: true, message: 'Sesi praktikum berhasil ditutup' };
  } catch (error) {
    console.error('Error closeSession:', error);
    return { success: false, message: error.message };
  }
};

/**
 * ============================================================================
 * 2. PRESENSI TERINTEGRASI & VALIDASI 1x PER SESI (SRS-FT-03)
 * ============================================================================
 */

/**
 * Memeriksa apakah praktikan sudah pernah presensi pada sesi tertentu
 */
export const checkExistingAttendance = async (sessionId, studentId) => {
  try {
    if (!sessionId || !studentId) return false;

    // Dokumen presensi dapat menggunakan ID gabungan `${sessionId}_${studentId}`
    // atau query where
    const docRef = doc(db, COLLECTIONS.ATTENDANCES, `${sessionId}_${studentId}`);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return true;
    }

    // Fallback: query where
    const q = query(
      collection(db, COLLECTIONS.ATTENDANCES),
      where('sessionId', '==', sessionId),
      where('studentId', '==', studentId)
    );
    const querySnap = await getDocs(q);
    return !querySnap.empty;
  } catch (error) {
    console.error('Error checkExistingAttendance:', error);
    return false;
  }
};

/**
 * Mencatat presensi praktikan ke Firestore dengan pencegahan duplikasi
 */
export const submitAttendance = async ({
  sessionId,
  studentId,
  studentName,
  studentNim,
  studentClass = '',
  statusKehadiran = 'HADIR',
  catatan = '',
}) => {
  try {
    if (!sessionId || !studentId) {
      throw new Error('Sesi ID dan Mahasiswa ID wajib disertakan');
    }

    // 1. Validasi status sesi aktif
    const sessionSnap = await getDoc(doc(db, COLLECTIONS.SESSIONS, sessionId));
    if (!sessionSnap.exists()) {
      throw new Error('Sesi praktikum tidak ditemukan');
    }
    const sessionData = sessionSnap.data();
    const isSesiOpen = sessionData.status === 'open' || sessionData.statusSesi === 'DIBUKA';

    if (!isSesiOpen) {
      throw new Error('Sesi praktikum saat ini belum dibuka atau sudah ditutup');
    }

    // 2. Validasi pencegahan duplikasi presensi (hanya 1x per sesi)
    const alreadyAttended = await checkExistingAttendance(sessionId, studentId);
    if (alreadyAttended) {
      return {
        success: false,
        message: 'Anda sudah melakukan presensi untuk sesi ini. Presensi hanya dapat dilakukan satu kali.',
      };
    }

    // 3. Gunakan deterministic document ID untuk garansi idempotency: `${sessionId}_${studentId}`
    const attendanceDocId = `${sessionId}_${studentId}`;
    const attendanceDocRef = doc(db, COLLECTIONS.ATTENDANCES, attendanceDocId);

    const payload = {
      id: attendanceDocId,
      sessionId,
      namaPraktikum: sessionData.namaPraktikum || '',
      topikMateri: sessionData.topikMateri || '',
      studentId,
      studentName: studentName || 'Praktikan',
      studentNim: studentNim || '-',
      studentClass: studentClass || sessionData.kelas || '',
      statusKehadiran: statusKehadiran.toUpperCase(), // 'HADIR' | 'IZIN' | 'SAKIT'
      catatan: catatan || '',
      timestamp: serverTimestamp(),
      waktuPresensi: new Date().toLocaleTimeString('id-ID', { hour12: false }) + ' WIB',
      tanggal: new Date().toISOString().split('T')[0],
    };

    await setDoc(attendanceDocRef, payload);

    return {
      success: true,
      id: attendanceDocId,
      message: 'Presensi berhasil dicatat!',
      data: payload,
    };
  } catch (error) {
    console.error('Error submitAttendance:', error);
    return {
      success: false,
      message: error.message || 'Gagal menyimpan presensi',
    };
  }
};

/**
 * Mengambil riwayat kehadiran seorang praktikan
 */
export const getStudentAttendanceHistory = async (studentId) => {
  try {
    const q = query(
      collection(db, COLLECTIONS.ATTENDANCES),
      where('studentId', '==', studentId),
      orderBy('timestamp', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('Error getStudentAttendanceHistory:', error);
    return [];
  }
};

/**
 * ============================================================================
 * 3. REAL-TIME LISTENER / ON_SNAPSHOT (SRS-FT-04)
 * ============================================================================
 */

/**
 * Mendengarkan pembaruan seluruh sesi praktikum secara real-time
 */
export const subscribeToSessions = (onUpdate, onError) => {
  const q = query(collection(db, COLLECTIONS.SESSIONS));
  return onSnapshot(
    q,
    (snapshot) => {
      const sessions = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      onUpdate(sessions);
    },
    (err) => {
      console.error('Snapshot error subscribeToSessions:', err);
      if (onError) onError(err);
    }
  );
};

/**
 * Mendengarkan sesi yang berstatus 'open' / 'DIBUKA' secara real-time
 */
export const subscribeToActiveSessions = (onUpdate, onError) => {
  const q = query(
    collection(db, COLLECTIONS.SESSIONS),
    where('status', '==', 'open')
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const activeSessions = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      onUpdate(activeSessions);
    },
    (err) => {
      console.error('Snapshot error subscribeToActiveSessions:', err);
      if (onError) onError(err);
    }
  );
};

/**
 * Mendengarkan daftar presensi praktikan pada satu sesi tertentu secara real-time (Untuk Asisten)
 */
export const subscribeToSessionAttendances = (sessionId, onUpdate, onError) => {
  if (!sessionId) {
    onUpdate([]);
    return () => {};
  }

  const q = query(
    collection(db, COLLECTIONS.ATTENDANCES),
    where('sessionId', '==', sessionId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const attendances = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      onUpdate(attendances);
    },
    (err) => {
      console.error('Snapshot error subscribeToSessionAttendances:', err);
      if (onError) onError(err);
    }
  );
};

/**
 * Mendengarkan status presensi praktikan tertentu pada sesi aktif secara real-time (Untuk Praktikan)
 */
export const subscribeToUserAttendance = (sessionId, studentId, onUpdate, onError) => {
  if (!sessionId || !studentId) {
    onUpdate(null);
    return () => {};
  }

  const docRef = doc(db, COLLECTIONS.ATTENDANCES, `${sessionId}_${studentId}`);
  return onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        onUpdate({ id: docSnap.id, ...docSnap.data() });
      } else {
        onUpdate(null);
      }
    },
    (err) => {
      console.error('Snapshot error subscribeToUserAttendance:', err);
      if (onError) onError(err);
    }
  );
};

