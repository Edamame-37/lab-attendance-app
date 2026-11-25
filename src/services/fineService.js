/**
 * @file src/services/fineService.js
 * @description Engine evaluasi batas toleransi keterlambatan (grace period),
 * pembuatan tagihan denda idempoten deterministik (SRS-FT-21),
 * listener real-time koleksi fines, dan agregasi keuangan denda.
 *
 * @author Aufaarel Nabiil Aryadh Mecca (feature/aslab-dashboard-fines)
 * @srs SRS-FT-19, SRS-FT-21
 */

import {
  collection,
  doc,
  getDoc,
  setDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase.js';

export const FINES_COLLECTION = 'fines';
export const LEAVE_REQUESTS_COLLECTION = 'leave_requests';

/**
 * Konversi berbagai tipe tanggal/waktu (Date, number, Firestore Timestamp, string)
 * menjadi timestamp milidetik (number).
 *
 * @param {Date|number|import('firebase/firestore').Timestamp|string|null|undefined} timeVal
 * @returns {number} Timestamp dalam milidetik
 */
export const toTimestampMillis = (timeVal) => {
  if (timeVal == null) return Date.now();
  if (typeof timeVal === 'number') return timeVal;
  if (typeof timeVal.toMillis === 'function') return timeVal.toMillis();
  if (timeVal instanceof Date) return timeVal.getTime();
  if (typeof timeVal === 'string') {
    const parsed = new Date(timeVal).getTime();
    return Number.isNaN(parsed) ? Date.now() : parsed;
  }
  return Date.now();
};

/**
 * 1. PURE CALCULATION: Evaluasi Keterlambatan Presensi (SRS-FT-21)
 *
 * Rumus sesuai kontrak dokumen Sprint 4:
 * deadlineMs = startMs + gracePeriodMinutes * 60_000
 * - Jika attendanceMs <= deadlineMs: ON_TIME (isLate: false, lateMinutes: 0)
 *   *Edge Case Wajib: Tepat pada akhir masa toleransi (attendanceMs === deadlineMs)
 *   wajib dianggap tepat waktu.
 * - Jika attendanceMs > deadlineMs: LATE (isLate: true, lateMinutes >= 1)
 *
 * @param {Object} params
 * @param {Date|number|import('firebase/firestore').Timestamp} params.attendanceTime
 * @param {Date|number|import('firebase/firestore').Timestamp} params.sessionStartTime
 * @param {number} [params.gracePeriodMinutes=15]
 * @returns {{ isLate: boolean, lateMinutes: number, attendancePunctuality: 'ON_TIME'|'LATE' }}
 */
export const evaluateAttendanceLateness = ({
  attendanceTime,
  sessionStartTime,
  gracePeriodMinutes = 15,
}) => {
  const attendanceMs = toTimestampMillis(attendanceTime);
  const startMs = toTimestampMillis(sessionStartTime);
  const graceMinutes = Math.max(0, Number(gracePeriodMinutes) || 0);

  const deadlineMs = startMs + graceMinutes * 60_000;

  if (attendanceMs <= deadlineMs) {
    return {
      isLate: false,
      lateMinutes: 0,
      attendancePunctuality: 'ON_TIME',
    };
  }

  const diffMs = attendanceMs - deadlineMs;
  const lateMinutes = Math.max(1, Math.ceil(diffMs / 60_000));

  return {
    isLate: true,
    lateMinutes,
    attendancePunctuality: 'LATE',
  };
};

/**
 * 2. IDEMPOTENT FINE CREATION: Pembuatan Tagihan Denda Keterlambatan (SRS-FT-21)
 *
 * Menggunakan Deterministic Document ID: `${sessionId}_${student.studentId}`
 * Menolak duplikasi jika dokumen sudah ada, dan membebaskan denda jika mahasiswa
 * memiliki izin disetujui (excused absence).
 *
 * @param {Object} params
 * @param {Object} params.session - Dokumen sesi praktikum
 * @param {string} params.attendanceId - ID presensi (${sessionId}_${studentId})
 * @param {Object} params.student - Data mahasiswa ({ studentId, studentName, studentNim, studentClass })
 * @param {Object} params.latenessResult - Hasil dari evaluateAttendanceLateness
 * @returns {Promise<{ created: boolean, id?: string, fine?: Object, alreadyExists?: boolean, excused?: boolean, reason?: string }>}
 */
export const createLateFineIfNeeded = async ({
  session,
  attendanceId,
  student,
  latenessResult,
}) => {
  try {
    if (!latenessResult || !latenessResult.isLate) {
      return { created: false, fine: null, reason: 'Presensi tercatat tepat waktu.' };
    }

    if (!session || !session.id || !student || !student.studentId) {
      throw new Error('Data sesi dan mahasiswa wajib disertakan untuk pembuatan tagihan denda.');
    }

    const deterministicFineId = `${session.id}_${student.studentId}`;
    const fineDocRef = doc(db, FINES_COLLECTION, deterministicFineId);

    // 1. Cek idempotensi: Apakah denda sudah pernah dibuat sebelumnya?
    const existingFineSnap = await getDoc(fineDocRef);
    if (existingFineSnap.exists()) {
      return {
        created: false,
        id: deterministicFineId,
        alreadyExists: true,
        fine: { id: existingFineSnap.id, ...existingFineSnap.data() },
        reason: 'Tagihan denda untuk sesi ini sudah ada.',
      };
    }

    // 2. Cek apakah ada izin disetujui (Excused Absence - SRS-FT-21)
    const leaveDocRef = doc(db, LEAVE_REQUESTS_COLLECTION, `${session.id}_${student.studentId}`);
    try {
      const leaveSnap = await getDoc(leaveDocRef);
      if (leaveSnap.exists()) {
        const leaveData = leaveSnap.data();
        if (leaveData.status === 'approved') {
          return {
            created: false,
            id: deterministicFineId,
            excused: true,
            reason: 'Praktikan memiliki izin disetujui (Excused Absence), dibebaskan dari denda.',
          };
        }
      }
    } catch (leaveErr) {
      console.warn('Pengecekan leave_requests gagal (diabaikan jika collection belum siap):', leaveErr);
    }

    // 3. Susun payload tagihan denda sesuai kontrak PRAKMOBILE4.md
    const nominalDenda = Number(session.lateFineAmount ?? 10_000);
    const finePayload = {
      id: deterministicFineId,
      attendanceId: attendanceId || `${session.id}_${student.studentId}`,
      sessionId: session.id,
      sessionName: session.namaPraktikum || session.sessionName || 'Praktikum',
      labId: session.labId || '',
      labName: session.ruangLab || session.labName || '',
      studentId: student.studentId,
      studentName: student.studentName || 'Praktikan',
      studentNim: student.studentNim || '-',
      studentClass: student.studentClass || session.kelas || '-',
      lateMinutes: latenessResult.lateMinutes,
      gracePeriodMinutes: Number(session.gracePeriodMinutes ?? 15),
      amount: nominalDenda,
      paymentStatus: 'pending', // 'pending' | 'success' | 'failed'
      latestOrderId: null,
      latestInvoiceId: null,
      latestInvoiceUrl: null,
      paidAt: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(fineDocRef, finePayload);

    return {
      created: true,
      id: deterministicFineId,
      fine: finePayload,
      reason: `Tagihan denda keterlambatan sebesar Rp ${nominalDenda.toLocaleString('id-ID')} berhasil dibuat.`,
    };
  } catch (error) {
    console.error('Error createLateFineIfNeeded:', error);
    throw error;
  }
};

/**
 * 3. REAL-TIME LISTENER: Tagihan Denda Mahasiswa Tertentu (SRS-FT-23)
 * Di-sort descending di sisi client agar bebas dependensi composite index Firestore.
 *
 * @param {string} studentId
 * @param {(fines: Array<Object>) => void} onUpdate
 * @param {(error: Error) => void} [onError]
 * @returns {() => void} Unsubscribe function
 */
export const subscribeStudentFines = (studentId, onUpdate, onError) => {
  if (!studentId) {
    onUpdate([]);
    return () => {};
  }

  const q = query(
    collection(db, FINES_COLLECTION),
    where('studentId', '==', studentId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const fines = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      // Sort client-side descending berdasarkan waktu dibuat
      fines.sort((a, b) => {
        const timeA = toTimestampMillis(a.createdAt);
        const timeB = toTimestampMillis(b.createdAt);
        return timeB - timeA;
      });

      onUpdate(fines);
    },
    (err) => {
      console.error('Error subscribeStudentFines:', err);
      if (onError) onError(err);
    }
  );
};

/**
 * 4. REAL-TIME LISTENER: Seluruh Dokumen Denda untuk Aslab (SRS-FT-19)
 *
 * @param {(fines: Array<Object>) => void} onUpdate
 * @param {(error: Error) => void} [onError]
 * @returns {() => void} Unsubscribe function
 */
export const subscribeAllFines = (onUpdate, onError) => {
  const q = query(collection(db, FINES_COLLECTION));

  return onSnapshot(
    q,
    (snapshot) => {
      const fines = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      fines.sort((a, b) => {
        const timeA = toTimestampMillis(a.createdAt);
        const timeB = toTimestampMillis(b.createdAt);
        return timeB - timeA;
      });

      onUpdate(fines);
    },
    (err) => {
      console.error('Error subscribeAllFines:', err);
      if (onError) onError(err);
    }
  );
};

/**
 * 5. AGREGASI FINANSIAL DENDA: Ringkasan Status dan Total Nominal (SRS-FT-19)
 *
 * @param {Array<Object>} fines - Daftar objek dokumen denda
 * @returns {{
 *   totalFinesCount: number,
 *   totalCollectedAmount: number,
 *   totalPendingAmount: number,
 *   totalFailedAmount: number,
 *   paidCount: number,
 *   pendingCount: number,
 *   failedCount: number
 * }}
 */
export const summarizeFineFinances = (fines = []) => {
  if (!Array.isArray(fines) || fines.length === 0) {
    return {
      totalFinesCount: 0,
      totalCollectedAmount: 0,
      totalPendingAmount: 0,
      totalFailedAmount: 0,
      paidCount: 0,
      pendingCount: 0,
      failedCount: 0,
    };
  }

  let totalCollectedAmount = 0;
  let totalPendingAmount = 0;
  let totalFailedAmount = 0;
  let paidCount = 0;
  let pendingCount = 0;
  let failedCount = 0;

  fines.forEach((fine) => {
    const amount = Number(fine.amount) || 0;
    const status = String(fine.paymentStatus || 'pending').toLowerCase();

    if (status === 'success' || status === 'paid' || status === 'settled') {
      paidCount += 1;
      totalCollectedAmount += amount;
    } else if (status === 'failed' || status === 'expired') {
      failedCount += 1;
      totalFailedAmount += amount;
    } else {
      pendingCount += 1;
      totalPendingAmount += amount;
    }
  });

  return {
    totalFinesCount: fines.length,
    totalCollectedAmount,
    totalPendingAmount,
    totalFailedAmount,
    paidCount,
    pendingCount,
    failedCount,
  };
};
