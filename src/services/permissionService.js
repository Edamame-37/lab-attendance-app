import {
  collection,
  addDoc,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  runTransaction,
} from 'firebase/firestore';

import { db } from '../config/firebase';

const COLLECTION_NAME = 'leave_requests';

// Menyimpan pengajuan izin baru dari Praktikan
export const submitLeaveRequest = async (payload) => {
  // Validasi data pengajuan
  if (
    !payload.studentId ||
    !payload.studentName ||
    !payload.studentNim ||
    !payload.sessionId ||
    !payload.sessionName ||
    !payload.reason
  ) {
    throw new Error('Data pengajuan izin belum lengkap.');
  }

  try {
    const docRef = await addDoc(
      collection(db, COLLECTION_NAME),
      {
        studentId: payload.studentId,
        studentName: payload.studentName,
        studentNim: payload.studentNim,
        sessionId: payload.sessionId,
        sessionName: payload.sessionName,
        reason: payload.reason,

        // Hasil klasifikasi sentimen AI EDOM
        aiCategory: payload.aiCategory || null,
        aiStatus: payload.aiStatus || 'unknown',
        aiExperimental: payload.aiExperimental ?? true,
        aiScoreType: payload.aiScoreType || null,

        // Status awal pengajuan
        status: 'pending',
        reviewedBy: null,
        reviewedAt: null,
        createdAt: serverTimestamp(),
      }
    );

    return {
      success: true,
      id: docRef.id,
    };
  } catch (error) {
    console.error(
      '[permissionService] Gagal menyimpan pengajuan:',
      error
    );

    throw error;
  }
};

// Memantau pengajuan milik Praktikan yang sedang login
export const subscribeStudentLeaveRequests = (
  studentId,
  onUpdate,
  onError
) => {
  if (!studentId) {
    onUpdate([]);
    return () => {};
  }

  const q = query(
    collection(db, COLLECTION_NAME),
    where('studentId', '==', studentId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      onUpdate(items);
    },
    (error) => {
      console.error(
        '[permissionService] Gagal memantau pengajuan:',
        error
      );

      if (onError) onError(error);
    }
  );
};

// Memantau seluruh pengajuan untuk kebutuhan Asisten
export const subscribeAllLeaveRequests = (
  onUpdate,
  onError
) => {
  const q = query(
    collection(db, COLLECTION_NAME),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      onUpdate(items);
    },
    (error) => {
      console.error(
        '[permissionService] Gagal memantau seluruh pengajuan:',
        error
      );

      if (onError) onError(error);
    }
  );
};

// Memproses keputusan Asisten menggunakan Firestore Transaction
export const reviewLeaveRequest = async (
  requestId,
  decision,
  assistantName
) => {
  if (!requestId) {
    throw new Error('ID pengajuan tidak tersedia.');
  }

  if (!['approved', 'rejected'].includes(decision)) {
    throw new Error('Keputusan harus approved atau rejected.');
  }

  const reviewer = assistantName?.trim();

  if (!reviewer) {
    throw new Error('Nama Asisten tidak tersedia.');
  }

  try {
    const requestRef = doc(
      db,
      COLLECTION_NAME,
      requestId
    );

    await runTransaction(db, async (transaction) => {
      const requestSnapshot = await transaction.get(requestRef);

      if (!requestSnapshot.exists()) {
        throw new Error('Pengajuan izin tidak ditemukan.');
      }

      const requestData = requestSnapshot.data();

      // Pengajuan yang sudah diputuskan tidak boleh diproses ulang
      if (requestData.status !== 'pending') {
        throw new Error(
          'Pengajuan ini sudah pernah diputuskan.'
        );
      }

      transaction.update(requestRef, {
        status: decision,
        reviewedBy: reviewer,
        reviewedAt: serverTimestamp(),
      });
    });

    return { success: true };
  } catch (error) {
    console.error(
      '[permissionService] Gagal memproses pengajuan:',
      error
    );

    throw error;
  }
};