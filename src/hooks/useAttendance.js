/**
 * @file src/hooks/useAttendance.js
 * @author Farrel (feature/lab-attendance-firestore)
 * @description Custom hook untuk sinkronisasi real-time status sesi praktikum dan
 * rekapitulasi kehadiran menggunakan listener Firestore onSnapshot (SRS-FT-04).
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  subscribeToSessions,
  subscribeToSessionAttendances,
  subscribeToUserAttendance,
  openSession,
  closeSession,
  createSession,
  updateSession,
  deleteSession,
  submitAttendance,
} from '../services/firestoreService';

/**
 * Hook useAttendance
 * @param {string} [sessionId] - ID sesi praktikum yang sedang dipantau/dipilih
 * @param {string} [studentId] - ID/UID pengguna praktikan aktif
 */
export const useAttendance = (sessionId = '', studentId = '') => {
  const [sessions, setSessions] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [userAttendanceRecord, setUserAttendanceRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => {
    setError(null);
    setLoading(true);
    setRefreshKey((prev) => prev + 1);
  }, []);

  // 1. Subscribe ke seluruh sesi praktikum secara real-time
  useEffect(() => {
    setLoading(true);
    setError(null);
    let unsubscribeSessions = () => {};

    try {
      unsubscribeSessions = subscribeToSessions(
        (data) => {
          setSessions(data);
          setLoading(false);
          setError(null);
        },
        (err) => {
          setError(err.message || 'Gagal memuat sesi real-time dari Firestore');
          setLoading(false);
        }
      );
    } catch (e) {
      setError(e.message || 'Terjadi kesalahan inisialisasi Firestore');
      setLoading(false);
    }

    return () => {
      if (typeof unsubscribeSessions === 'function') {
        unsubscribeSessions();
      }
    };
  }, [refreshKey]);

  // 2. Subscribe ke daftar presensi sesi tertentu (untuk Asisten & Rekapitulasi)
  useEffect(() => {
    if (!sessionId) {
      setAttendances([]);
      return;
    }

    const unsubscribeAttendances = subscribeToSessionAttendances(
      sessionId,
      (data) => {
        setAttendances(data);
      },
      (err) => {
        console.error('Error listening to session attendances:', err);
      }
    );

    return () => {
      unsubscribeAttendances();
    };
  }, [sessionId]);

  // 3. Subscribe ke status presensi pengguna tertentu pada sesi (untuk Praktikan)
  useEffect(() => {
    if (!sessionId || !studentId) {
      setUserAttendanceRecord(null);
      return;
    }

    const unsubscribeUserAttendance = subscribeToUserAttendance(
      sessionId,
      studentId,
      (record) => {
        setUserAttendanceRecord(record);
      },
      (err) => {
        console.error('Error listening to user attendance:', err);
      }
    );

    return () => {
      unsubscribeUserAttendance();
    };
  }, [sessionId, studentId]);

  // Sesi-sesi yang saat ini berstatus 'open' atau 'DIBUKA'
  const activeSessions = useMemo(() => {
    return sessions.filter(
      (s) => s.status === 'open' || s.statusSesi === 'DIBUKA'
    );
  }, [sessions]);

  // Data sesi yang sedang aktif dipilih berdasarkan sessionId
  const currentSession = useMemo(() => {
    if (!sessionId) return null;
    return sessions.find((s) => s.id === sessionId) || null;
  }, [sessions, sessionId]);

  // Status apakah praktikan sudah presensi di sesi ini
  const isAlreadyAttended = useMemo(() => {
    if (userAttendanceRecord) return true;
    if (!studentId || attendances.length === 0) return false;
    return attendances.some((att) => att.studentId === studentId);
  }, [userAttendanceRecord, attendances, studentId]);

  // Statistik rekapitulasi kehadiran untuk asisten
  const stats = useMemo(() => {
    const totalHadir = attendances.filter(
      (a) => a.statusKehadiran === 'HADIR'
    ).length;
    const totalIzin = attendances.filter(
      (a) => a.statusKehadiran === 'IZIN'
    ).length;
    const totalSakit = attendances.filter(
      (a) => a.statusKehadiran === 'SAKIT'
    ).length;
    return {
      totalPesertaHadir: attendances.length,
      hadir: totalHadir,
      izin: totalIzin,
      sakit: totalSakit,
    };
  }, [attendances]);

  // Action: Membuka sesi (Asisten)
  const handleOpenSession = useCallback(
    async (targetSessionId, ruangLab = '', catatan = '') => {
      setActionLoading(true);
      try {
        const id = targetSessionId || sessionId;
        const res = await openSession(id, ruangLab, catatan);
        setActionLoading(false);
        return res;
      } catch (err) {
        setActionLoading(false);
        return { success: false, message: err.message };
      }
    },
    [sessionId]
  );

  // Action: Menutup sesi (Asisten)
  const handleCloseSession = useCallback(
    async (targetSessionId) => {
      setActionLoading(true);
      try {
        const id = targetSessionId || sessionId;
        const res = await closeSession(id);
        setActionLoading(false);
        return res;
      } catch (err) {
        setActionLoading(false);
        return { success: false, message: err.message };
      }
    },
    [sessionId]
  );

  // Action: Submit Presensi (Praktikan)
  const handleRecordAttendance = useCallback(
    async ({
      targetSessionId,
      userStudentId,
      studentName,
      studentNim,
      studentClass,
      statusKehadiran = 'HADIR',
      catatan = '',
    }) => {
      setActionLoading(true);
      try {
        const sid = targetSessionId || sessionId;
        const uid = userStudentId || studentId;

        const res = await submitAttendance({
          sessionId: sid,
          studentId: uid,
          studentName,
          studentNim,
          studentClass,
          statusKehadiran,
          catatan,
        });

        setActionLoading(false);
        return res;
      } catch (err) {
        setActionLoading(false);
        return { success: false, message: err.message };
      }
    },
    [sessionId, studentId]
  );

  // Action: Buat Sesi Baru (Asisten)
  const handleCreateSession = useCallback(async (sessionData) => {
    setActionLoading(true);
    const res = await createSession(sessionData);
    setActionLoading(false);
    return res;
  }, []);

  // Action: Hapus Sesi (Asisten)
  const handleDeleteSession = useCallback(async (targetSessionId) => {
    setActionLoading(true);
    const res = await deleteSession(targetSessionId);
    setActionLoading(false);
    return res;
  }, []);

  return {
    sessions,
    activeSessions,
    currentSession,
    attendances,
    userAttendanceRecord,
    isAlreadyAttended,
    stats,
    loading,
    error,
    actionLoading,
    refresh,
    handleOpenSession,
    handleCloseSession,
    handleRecordAttendance,
    handleCreateSession,
    handleDeleteSession,
  };
};

export default useAttendance;

