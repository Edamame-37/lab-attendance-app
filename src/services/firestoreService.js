/**
 * @file src/services/firestoreService.js
 * @author Farrel (feature/lab-attendance-firestore)
 * @description Layanan Firestore terpusat untuk CRUD Sesi & Kelas, Presensi Terintegrasi 1x,
 * dan Sinkronisasi Real-Time (SRS-FT-02, SRS-FT-03, SRS-FT-04).
 * Sesuai panduan revisi resmi ppk praktikum.pdf.
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
import { db } from '../config/firebase.js';

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
 * Mengambil seluruh sesi praktikum dari Firestore
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
    // Fallback query tanpa orderBy jika index belum dibuat
    try {
      const fallbackSnap = await getDocs(collection(db, COLLECTIONS.SESSIONS));
      return fallbackSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (e) {
      throw error;
    }
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
 * Menambahkan sesi praktikum baru ke Firestore (Khusus Asisten - SRS-FT-02)
 * @param {Object} sessionData - Data sesi (namaPraktikum, kelas, ruangLab, topikMateri, dll)
 */
export const createSession = async (sessionData) => {
  try {
    if (!sessionData.namaPraktikum || !sessionData.kelas) {
      throw new Error('Nama praktikum dan kelas wajib diisi');
    }

    const payload = {
      kodeMataKuliah: sessionData.kodeMataKuliah || 'PPK-2026',
      namaPraktikum: sessionData.namaPraktikum.trim(),
      topikMateri: sessionData.topikMateri ? sessionData.topikMateri.trim() : 'Praktikum Umum',
      kelas: sessionData.kelas.trim(),
      ruangLab: sessionData.ruangLab ? sessionData.ruangLab.trim() : 'Lab RPL 1',
      hari: sessionData.hari || 'Senin',
      jamMulai: sessionData.jamMulai || '08:00',
      jamSelesai: sessionData.jamSelesai || '10:30',
      namaAsisten: sessionData.namaAsisten || 'Farrel (Asisten Lab)',
      asistenId: sessionData.asistenId || 'asisten-1',
      status: 'closed', // 'open' | 'closed'
      statusSesi: 'DITUTUP', // 'DIBUKA' | 'DITUTUP' | 'SELESAI'
      catatanPembuka: '',
      waktuBuka: null,
      waktuTutup: null,
      daftarPeserta: sessionData.daftarPeserta || [
        { nim: '21120122140001', nama: 'Budi Santoso' },
        { nim: '21120122140002', nama: 'Siti Rahma' },
        { nim: '21120122140003', nama: 'Ahmad Fauzi' },
        { nim: '21120122140004', nama: 'Farrel Hidayat' },
        { nim: '21120122140005', nama: 'Dewi Lestari' },
      ],
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
 * Mengubah data sesi praktikum yang sudah ada (Khusus Asisten - SRS-FT-02)
 */
export const updateSession = async (sessionId, updateData) => {
  try {
    if (!sessionId) {
      throw new Error('Session ID wajib diisi');
    }
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
 * Menghapus dokumen sesi praktikum dari Firestore (Khusus Asisten - SRS-FT-02)
 */
export const deleteSession = async (sessionId) => {
  try {
    if (!sessionId) {
      throw new Error('Session ID wajib diisi');
    }
    const docRef = doc(db, COLLECTIONS.SESSIONS, sessionId);
    await deleteDoc(docRef);
    return { success: true, message: 'Sesi praktikum berhasil dihapus' };
  } catch (error) {
    console.error('Error deleteSession:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Membuka sesi praktikum agar praktikan bisa presensi (SRS-FT-02 & SRS-FT-04)
 */
export const openSession = async (sessionId, ruangLab = '', catatan = '') => {
  try {
    const docRef = doc(db, COLLECTIONS.SESSIONS, sessionId);
    const updatePayload = {
      status: 'open',
      statusSesi: 'DIBUKA',
      waktuBuka: serverTimestamp(),
      catatanPembuka: catatan ? catatan.trim() : '',
      updatedAt: serverTimestamp(),
    };
    if (ruangLab && ruangLab.trim()) {
      updatePayload.ruangLab = ruangLab.trim();
    }

    await updateDoc(docRef, updatePayload);
    return { success: true, message: 'Sesi praktikum berhasil dibuka' };
  } catch (error) {
    console.error('Error openSession:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Menutup sesi praktikum dan mengunci presensi (SRS-FT-02 & SRS-FT-04)
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
 * Mengisi data awal (Seed Data) master praktikum, kelas, dan peserta jika database masih kosong (SRS-FT-02)
 */
export const seedInitialPracticalData = async () => {
  try {
    const initialSessions = [
      {
        kodeMataKuliah: 'PPK-301',
        namaPraktikum: 'Praktikum Pemrograman Perangkat Keras',
        topikMateri: 'Modul 3: Integrasi Cloud Firestore & Realtime Sync',
        kelas: 'TI-3A',
        ruangLab: 'Laboratorium Sistem Tertanam',
        hari: 'Senin',
        jamMulai: '08:00',
        jamSelesai: '10:30',
        namaAsisten: 'Farrel Hidayat',
        asistenId: 'asisten-farrel',
        status: 'open',
        statusSesi: 'DIBUKA',
        catatanPembuka: 'Silakan segera presensi melalui aplikasi.',
        waktuBuka: serverTimestamp(),
        waktuTutup: null,
        daftarPeserta: [
          { nim: '21120122140001', nama: 'Budi Santoso' },
          { nim: '21120122140002', nama: 'Siti Rahmawati' },
          { nim: '21120122140003', nama: 'Ahmad Fauzan' },
          { nim: '21120122140004', nama: 'Rian Kurniawan' },
          { nim: '21120122140005', nama: 'Nadia Putri' },
        ],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      {
        kodeMataKuliah: 'JARKOM-202',
        namaPraktikum: 'Praktikum Jaringan Komputer',
        topikMateri: 'Modul 2: Konfigurasi Routing Dinamis OSPF',
        kelas: 'TI-3B',
        ruangLab: 'Laboratorium Jaringan Komputer',
        hari: 'Rabu',
        jamMulai: '13:00',
        jamSelesai: '15:30',
        namaAsisten: 'Farrel Hidayat',
        asistenId: 'asisten-farrel',
        status: 'closed',
        statusSesi: 'DITUTUP',
        catatanPembuka: '',
        waktuBuka: null,
        waktuTutup: null,
        daftarPeserta: [
          { nim: '21120122140010', nama: 'Dimas Anggara' },
          { nim: '21120122140011', nama: 'Alisa Zahra' },
        ],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      {
        kodeMataKuliah: 'BD-101',
        namaPraktikum: 'Praktikum Basis Data Lanjut',
        topikMateri: 'Modul 1: Query Optimasi & Indeks NoSQL',
        kelas: 'TI-3A',
        ruangLab: 'Laboratorium Basis Data',
        hari: 'Kamis',
        jamMulai: '10:00',
        jamSelesai: '12:30',
        namaAsisten: 'Farrel Hidayat',
        asistenId: 'asisten-farrel',
        status: 'closed',
        statusSesi: 'DITUTUP',
        catatanPembuka: '',
        waktuBuka: null,
        waktuTutup: null,
        daftarPeserta: [
          { nim: '21120122140001', nama: 'Budi Santoso' },
          { nim: '21120122140002', nama: 'Siti Rahmawati' },
        ],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
    ];

    for (const item of initialSessions) {
      await addDoc(collection(db, COLLECTIONS.SESSIONS), item);
    }

    return { success: true, message: 'Data awal praktikum, kelas, dan peserta berhasil dimuat ke Firestore!' };
  } catch (error) {
    console.error('Error seedInitialPracticalData:', error);
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

    // 1. Cek langsung via deterministic doc ID: `${sessionId}_${studentId}`
    const docRef = doc(db, COLLECTIONS.ATTENDANCES, `${sessionId}_${studentId}`);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return true;
    }

    // 2. Fallback query where
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
 * Mencatat presensi praktikan ke Firestore dengan pencegahan presensi ganda (SRS-FT-03)
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

    // 1. Validasi keberadaan & status sesi
    const sessionSnap = await getDoc(doc(db, COLLECTIONS.SESSIONS, sessionId));
    if (!sessionSnap.exists()) {
      throw new Error('Sesi praktikum tidak ditemukan di sistem');
    }
    const sessionData = sessionSnap.data();
    const isSesiOpen = sessionData.status === 'open' || sessionData.statusSesi === 'DIBUKA';

    if (!isSesiOpen) {
      return {
        success: false,
        message: 'Presensi ditolak: Sesi praktikum saat ini belum dibuka atau sudah ditutup oleh asisten.',
      };
    }

    // 2. Validasi pencegahan presensi ganda (SRS-FT-03: tidak dapat presensi 2x pada sesi yang sama)
    const alreadyAttended = await checkExistingAttendance(sessionId, studentId);
    if (alreadyAttended) {
      return {
        success: false,
        message: 'Presensi ditolak: Anda sudah melakukan presensi pada sesi ini. Presensi hanya diperbolehkan satu kali.',
      };
    }

    // 3. Gunakan Deterministic Doc ID `${sessionId}_${studentId}` untuk proteksi idempotensi level basis data
    const attendanceDocId = `${sessionId}_${studentId}`;
    const attendanceDocRef = doc(db, COLLECTIONS.ATTENDANCES, attendanceDocId);

    const now = new Date();
    const jamStr = String(now.getHours()).padStart(2, '0');
    const menitStr = String(now.getMinutes()).padStart(2, '0');
    const detikStr = String(now.getSeconds()).padStart(2, '0');
    const waktuPresensiStr = `${jamStr}:${menitStr}:${detikStr} WIB`;

    const payload = {
      id: attendanceDocId,
      sessionId,
      namaPraktikum: sessionData.namaPraktikum || 'Praktikum',
      topikMateri: sessionData.topikMateri || '',
      studentId,
      studentName: studentName || 'Praktikan',
      studentNim: studentNim || '-',
      studentClass: studentClass || sessionData.kelas || 'A',
      statusKehadiran: statusKehadiran.toUpperCase(), // 'HADIR' | 'IZIN' | 'SAKIT'
      catatan: catatan ? catatan.trim() : '',
      timestamp: serverTimestamp(),
      waktuPresensi: waktuPresensiStr,
      tanggal: now.toISOString().split('T')[0],
    };

    await setDoc(attendanceDocRef, payload);

    return {
      success: true,
      id: attendanceDocId,
      message: 'Presensi Anda berhasil dicatat ke dalam Cloud Firestore!',
      data: payload,
    };
  } catch (error) {
    console.error('Error submitAttendance:', error);
    return {
      success: false,
      message: error.message || 'Gagal menyimpan presensi ke Firestore',
    };
  }
};

/**
 * Mengambil riwayat kehadiran seorang praktikan dari Firestore
 */
export const getStudentAttendanceHistory = async (studentId) => {
  try {
    const q = query(
      collection(db, COLLECTIONS.ATTENDANCES),
      where('studentId', '==', studentId)
    );
    const snap = await getDocs(q);
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    // Sort descending by timestamp or tanggal
    return list.sort((a, b) => (b.tanggal || '').localeCompare(a.tanggal || ''));
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
 * Mendengarkan daftar presensi pada satu sesi tertentu secara real-time (Untuk Asisten)
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
