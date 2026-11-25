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
  GeoPoint,
  Timestamp,
} from 'firebase/firestore';
import { auth, db } from '../config/firebase.js';
import { getLabById } from './labService.js';
import {
  calculateDistanceMeters,
  MAX_LOCATION_ACCURACY_METERS,
  validateCoordinates,
} from './locationService.js';
import {
  evaluateAttendanceLateness,
  createLateFineIfNeeded,
} from './fineService.js';

// Nama koleksi utama di Firestore
export const COLLECTIONS = {
  SESSIONS: 'sessions',
  ATTENDANCES: 'attendances',
  CLASSES: 'classes',
  LABS: 'labs',
};

export const validateSessionLabConnection = (sessionData, labData) => {
  if (!sessionData?.labId) {
    throw new Error('Pilih laboratorium sebelum membuka sesi');
  }
  if (!labData || labData.id !== sessionData.labId) {
    throw new Error('Laboratorium sesi tidak ditemukan');
  }
  if (labData.isActive === false) {
    throw new Error('Laboratorium sesi sedang nonaktif');
  }
  if (!labData.location) {
    throw new Error('Laboratorium sesi belum memiliki koordinat');
  }
  return true;
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
    } catch (_error) {
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
    if (!sessionData.namaPraktikum || !sessionData.kelas || !sessionData.labId) {
      throw new Error('Nama praktikum, kelas, dan laboratorium wajib diisi');
    }
    if (!auth.currentUser?.uid) {
      throw new Error('Sesi login asisten tidak tersedia');
    }

    const selectedLab = await getLabById(sessionData.labId);
    if (!selectedLab || selectedLab.isActive === false) {
      throw new Error('Laboratorium yang dipilih tidak tersedia atau sedang nonaktif');
    }

    const payload = {
      kodeMataKuliah: sessionData.kodeMataKuliah || 'PPK-2026',
      namaPraktikum: sessionData.namaPraktikum.trim(),
      topikMateri: sessionData.topikMateri ? sessionData.topikMateri.trim() : 'Praktikum Umum',
      kelas: sessionData.kelas.trim(),
      labId: selectedLab.id,
      ruangLab: selectedLab.name,
      hari: sessionData.hari || 'Senin',
      jamMulai: sessionData.jamMulai || '08:00',
      jamSelesai: sessionData.jamSelesai || '10:30',
      gracePeriodMinutes: Number(sessionData.gracePeriodMinutes ?? selectedLab.gracePeriodMinutes ?? 15),
      lateFineAmount: Number(sessionData.lateFineAmount ?? selectedLab.lateFineAmount ?? 10000),
      namaAsisten: sessionData.namaAsisten?.trim() || 'Asisten Praktikum',
      asistenId: auth.currentUser.uid,
      status: 'closed', // 'open' | 'closed'
      statusSesi: 'DITUTUP', // 'DIBUKA' | 'DITUTUP' | 'SELESAI'
      catatanPembuka: '',
      waktuBuka: null,
      waktuTutup: null,
      daftarPeserta: Array.isArray(sessionData.daftarPeserta)
        ? sessionData.daftarPeserta
        : [],
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
 * Memfilter daftar sesi praktikum agar Asprak hanya melihat dan mengelola sesi
 * pada laboratorium yang ditugaskan kepadanya atau sesi miliknya sendiri (SRS-FT-20).
 *
 * @param {Array<Object>} sessions - Daftar seluruh sesi
 * @param {Array<Object>} labs - Daftar laboratorium
 * @param {string} asprakUid - UID asisten praktikum yang sedang login
 * @returns {Array<Object>} Sesi yang menjadi tanggung jawab Asprak
 */
export const filterSessionsForAsprak = (sessions = [], labs = [], asprakUid) => {
  if (!asprakUid || !Array.isArray(sessions)) return sessions || [];

  const assignedLabIds = new Set(
    (labs || [])
      .filter((lab) => Array.isArray(lab.asprakIds) && lab.asprakIds.includes(asprakUid))
      .map((lab) => lab.id)
  );

  return sessions.filter((session) => {
    // Sesi milik Asprak sendiri
    if (session.asistenId === asprakUid) return true;
    // Sesi berada pada laboratorium yang ditugaskan
    if (session.labId && assignedLabIds.has(session.labId)) return true;
    // Fallback toleran jika belum ada lab yang di-assign sama sekali agar testing tetap berjalan
    if (assignedLabIds.size === 0) return true;
    return false;
  });
};

/**
 * Mengubah data sesi praktikum yang sudah ada (Khusus Asisten - SRS-FT-02)
 */
export const updateSession = async (sessionId, updateData) => {
  try {
    if (!sessionId) {
      throw new Error('Session ID wajib diisi');
    }
    const sanitizedUpdate = { ...updateData };
    if (updateData.labId) {
      const selectedLab = await getLabById(updateData.labId);
      if (!selectedLab || selectedLab.isActive === false) {
        throw new Error('Laboratorium yang dipilih tidak tersedia atau sedang nonaktif');
      }
      sanitizedUpdate.labId = selectedLab.id;
      sanitizedUpdate.ruangLab = selectedLab.name;
    }

    const docRef = doc(db, COLLECTIONS.SESSIONS, sessionId);
    await updateDoc(docRef, {
      ...sanitizedUpdate,
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
export const openSession = async (sessionId, catatan = '') => {
  try {
    const docRef = doc(db, COLLECTIONS.SESSIONS, sessionId);
    const sessionSnapshot = await getDoc(docRef);
    if (!sessionSnapshot.exists()) {
      throw new Error('Sesi praktikum tidak ditemukan');
    }

    const sessionData = sessionSnapshot.data();
    const selectedLab = await getLabById(sessionData.labId);
    validateSessionLabConnection(sessionData, selectedLab);

    const updatePayload = {
      status: 'open',
      statusSesi: 'DIBUKA',
      ruangLab: selectedLab.name,
      waktuBuka: serverTimestamp(),
      catatanPembuka: catatan ? catatan.trim() : '',
      updatedAt: serverTimestamp(),
    };

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
  deviceLocation,
}) => {
  try {
    if (!sessionId || !studentId) {
      throw new Error('Sesi ID dan Mahasiswa ID wajib disertakan');
    }
    if (!auth.currentUser || auth.currentUser.uid !== studentId) {
      throw new Error('Identitas pengguna tidak sesuai dengan akun yang sedang login');
    }
    if (!deviceLocation) {
      throw new Error('Lokasi perangkat wajib disertakan untuk presensi');
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

    if (!sessionData.labId) {
      return {
        success: false,
        message: 'Presensi ditolak: Sesi belum dikaitkan dengan lokasi laboratorium.',
      };
    }

    const labData = await getLabById(sessionData.labId);
    if (!labData || labData.isActive === false || !labData.location) {
      return {
        success: false,
        message: 'Presensi ditolak: Konfigurasi lokasi laboratorium tidak tersedia.',
      };
    }

    const validatedLocation = validateCoordinates(
      deviceLocation.latitude,
      deviceLocation.longitude
    );
    const locationAccuracyMeters = Number(deviceLocation.accuracyMeters);
    if (
      !Number.isFinite(locationAccuracyMeters) ||
      locationAccuracyMeters < 0 ||
      locationAccuracyMeters > MAX_LOCATION_ACCURACY_METERS
    ) {
      return {
        success: false,
        message: `Presensi ditolak: Akurasi lokasi wajib maksimal ${MAX_LOCATION_ACCURACY_METERS} meter.`,
      };
    }
    const capturedAt = Number(deviceLocation.capturedAt);
    if (
      !Number.isFinite(capturedAt) ||
      Date.now() - capturedAt > 60_000 ||
      capturedAt > Date.now() + 5_000
    ) {
      return {
        success: false,
        message: 'Presensi ditolak: Lokasi perangkat sudah kedaluwarsa.',
      };
    }

    const distanceMeters = calculateDistanceMeters(validatedLocation, {
      latitude: labData.location.latitude,
      longitude: labData.location.longitude,
    });
    const labRadiusMeters = Number(labData.radiusMeters) || 50;
    if (distanceMeters > labRadiusMeters) {
      return {
        success: false,
        message: `Presensi ditolak: Jarak perangkat ${Math.round(distanceMeters)} meter, di luar radius ${labRadiusMeters} meter.`,
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

    // 4. Evaluasi toleransi keterlambatan (Grace Period - SRS-FT-21)
    let sessionStartTime = sessionData.waktuBuka;
    if (!sessionStartTime && sessionData.jamMulai) {
      const parts = String(sessionData.jamMulai).split(':').map(Number);
      const startCandidate = new Date();
      startCandidate.setHours(parts[0] || 8, parts[1] || 0, 0, 0);
      sessionStartTime = startCandidate;
    }
    if (!sessionStartTime) {
      sessionStartTime = now;
    }

    const gracePeriodMinutes = Number(
      sessionData.gracePeriodMinutes ?? labData.gracePeriodMinutes ?? 15
    );
    const nominalDenda = Number(
      sessionData.lateFineAmount ?? labData.lateFineAmount ?? 10000
    );

    const lateness = evaluateAttendanceLateness({
      attendanceTime: now,
      sessionStartTime,
      gracePeriodMinutes,
    });

    const payload = {
      id: attendanceDocId,
      sessionId,
      namaPraktikum: sessionData.namaPraktikum || 'Praktikum',
      topikMateri: sessionData.topikMateri || '',
      studentId,
      studentName: studentName || 'Praktikan',
      studentNim: studentNim || '-',
      studentClass: studentClass || sessionData.kelas || 'A',
      statusKehadiran: statusKehadiran.toUpperCase(), // 'HADIR' (tidak pernah diubah oleh pembayaran denda)
      isLate: lateness.isLate,
      lateMinutes: lateness.lateMinutes,
      attendancePunctuality: lateness.attendancePunctuality,
      catatan: catatan ? catatan.trim() : '',
      timestamp: serverTimestamp(),
      waktuPresensi: waktuPresensiStr,
      tanggal: now.toISOString().split('T')[0],
      labId: sessionData.labId,
      location: new GeoPoint(validatedLocation.latitude, validatedLocation.longitude),
      locationAccuracyMeters,
      distanceMeters,
      locationCapturedAt: Timestamp.fromMillis(capturedAt),
    };

    await setDoc(attendanceDocRef, payload);

    // 5. Jika terlambat, buat tagihan denda idempoten pada koleksi fines (SRS-FT-21)
    let fineResult = null;
    if (lateness.isLate) {
      fineResult = await createLateFineIfNeeded({
        session: {
          id: sessionId,
          ...sessionData,
          lateFineAmount: nominalDenda,
          gracePeriodMinutes,
        },
        attendanceId: attendanceDocId,
        student: {
          studentId,
          studentName: studentName || 'Praktikan',
          studentNim: studentNim || '-',
          studentClass: studentClass || sessionData.kelas || 'A',
        },
        latenessResult: lateness,
      });
    }

    return {
      success: true,
      id: attendanceDocId,
      message: lateness.isLate
        ? `Presensi tercatat terlambat (+${lateness.lateMinutes} menit). Tagihan denda sebesar Rp ${nominalDenda.toLocaleString('id-ID')} telah dibuat.`
        : 'Presensi Anda berhasil dicatat tepat waktu ke dalam Cloud Firestore!',
      data: payload,
      isLate: lateness.isLate,
      lateMinutes: lateness.lateMinutes,
      attendancePunctuality: lateness.attendancePunctuality,
      fineCreated: fineResult?.created || false,
      fineAmount: fineResult?.fine?.amount || (lateness.isLate ? nominalDenda : 0),
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
