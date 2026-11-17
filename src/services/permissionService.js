
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Nama koleksi pengajuan izin di Firestore
const COLLECTION_NAME = 'leave_requests';

// Menyimpan pengajuan izin baru dari Praktikan
export const submitLeaveRequest = async (payload) => {
  // Pastikan identitas dan data pengajuan tersedia
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
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      studentId: payload.studentId,
      studentName: payload.studentName,
      studentNim: payload.studentNim,
      sessionId: payload.sessionId,
      sessionName: payload.sessionName,
      reason: payload.reason,

      // Akan diisi setelah model EDOM diintegrasikan pada FT-06
      aiCategory: null,
      aiConfidence: null,

      status: 'pending',
      reviewedBy: null,
      reviewedAt: null,
      createdAt: serverTimestamp(),
    });

    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('[permissionService] Gagal menyimpan pengajuan:', error);
    throw error;
  }
};

// Memantau pengajuan milik Praktikan yang sedang login
export const subscribeStudentLeaveRequests = (studentId, onUpdate, onError) => {
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
      console.error('[permissionService] Gagal memantau pengajuan:', error);
      if (onError) onError(error);
    }
  );
};

// Memantau seluruh pengajuan untuk kebutuhan Asisten (FT-07)
export const subscribeAllLeaveRequests = (onUpdate, onError) => {
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
      console.error('[permissionService] Gagal memantau seluruh pengajuan:', error);
      if (onError) onError(error);
    }
  );
};

// Memproses keputusan Asisten (akan digunakan pada FT-07)
export const reviewLeaveRequest = async (requestId, decision, assistantName) => {
  if (!['approved', 'rejected'].includes(decision)) {
    throw new Error('Keputusan harus approved atau rejected.');
  }

  try {
    await updateDoc(doc(db, COLLECTION_NAME, requestId), {
      status: decision,
      reviewedBy: assistantName || 'Asisten',
      reviewedAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error('[permissionService] Gagal memproses pengajuan:', error);
    throw error;
  }
};
