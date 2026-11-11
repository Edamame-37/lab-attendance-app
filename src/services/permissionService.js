// src/services/permissionService.js
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
import { db } from '../config/firebase'; // Diinisialisasi oleh Azlan

const COLLECTION_NAME = 'leave_requests';

// 1. Praktikan mengirim pengajuan izin baru
export const submitLeaveRequest = async (payload) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      studentId: payload.studentId,
      studentName: payload.studentName,
      studentNim: payload.studentNim,
      sessionId: payload.sessionId,
      sessionName: payload.sessionName,
      reason: payload.reason,
      aiCategory: payload.aiCategory,
      aiConfidence: payload.aiConfidence ?? null,
      status: 'pending',
      reviewedBy: null,
      reviewedAt: null,
      createdAt: serverTimestamp(),
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('[permissionService] Error submitLeaveRequest:', error);
    throw error;
  }
};

// 2. Real-time listener khusus untuk Praktikan (Data Isolation: hanya milik sendiri)
export const subscribeStudentLeaveRequests = (studentId, onUpdate, onError) => {
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
      console.error('[permissionService] Error subscribeStudentLeaveRequests:', error);
      if (onError) onError(error);
    }
  );
};

// 3. Real-time listener untuk Asisten (melihat seluruh pengajuan)
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
      console.error('[permissionService] Error subscribeAllLeaveRequests:', error);
      if (onError) onError(error);
    }
  );
};

// 4. Asisten memberikan keputusan (approved / rejected)
export const reviewLeaveRequest = async (requestId, decision, assistantName) => {
  if (!['approved', 'rejected'].includes(decision)) {
    throw new Error('Keputusan harus berupa "approved" atau "rejected".');
  }

  try {
    const requestRef = doc(db, COLLECTION_NAME, requestId);
    await updateDoc(requestRef, {
      status: decision,
      reviewedBy: assistantName || 'Asisten',
      reviewedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.error('[permissionService] Error reviewLeaveRequest:', error);
    throw error;
  }
};
