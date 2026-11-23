import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Mengatur tampilan notifikasi ketika aplikasi sedang terbuka.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Meminta izin dan mengambil Expo Push Token perangkat.
export const registerForPushNotifications = async () => {
  try {
    if (!Device.isDevice) {
      return {
        success: false,
        message: 'Push notification memerlukan perangkat fisik.',
        token: null,
      };
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('praktikum', {
        name: 'Praktikum',
        description: 'Pembukaan sesi, perubahan jadwal, dan keputusan izin.',
        importance: AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#047857',
      });
    }

    let permission = await Notifications.getPermissionsAsync();

    if (!permission.granted) {
      permission = await Notifications.requestPermissionsAsync();
    }

    if (!permission.granted) {
      return {
        success: false,
        message: 'Izin notifikasi belum diberikan.',
        token: null,
      };
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ||
      Constants.easConfig?.projectId ||
      'a937d8b0-1a28-45c4-8b57-25484df719d1';

    if (!projectId) {
      return {
        success: false,
        message: 'EAS Project ID belum dikonfigurasi.',
        token: null,
      };
    }

    const response = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    return {
      success: true,
      message: 'Push token berhasil diperoleh.',
      token: response.data,
    };
  } catch (_error) {
    return {
      success: false,
      message: 'Gagal mendaftarkan push notification.',
      token: null,
    };
  }
};

// Mengirim notifikasi lokal untuk pengujian.
export const sendLocalNotification = async ({
  title,
  body,
  data = {},
}) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: null,
    });

    return true;
  } catch (_error) {
    return false;
  }
};

// Mendengarkan notifikasi yang diterima aplikasi.
export const addNotificationReceivedListener = (callback) => {
  return Notifications.addNotificationReceivedListener(callback);
};

// Mendengarkan notifikasi yang diklik pengguna.
export const addNotificationResponseListener = (callback) => {
  return Notifications.addNotificationResponseReceivedListener(callback);
};

// Menghapus badge notifikasi.
export const clearNotificationBadge = async () => {
  try {
    await Notifications.setBadgeCountAsync(0);
  } catch (error) {
    console.log('Gagal menghapus badge notifikasi:', error);
  }
};

/**
 * Mengirim notifikasi pembukaan sesi yang hanya ditargetkan kepada peserta kelas terkait (FT-13 & Sprint 3).
 */
export const notifySessionOpened = async ({ session, recipientStudentIds = [], currentUserId = null }) => {
  try {
    if (!session) return { success: false, message: 'Data sesi tidak ditemukan.' };

    const enrolledIds = Array.isArray(session.daftarPeserta)
      ? session.daftarPeserta.map((p) => p.nim || p.studentId || p.id).filter(Boolean)
      : [];

    const effectiveTargetIds = (recipientStudentIds.length > 0 ? recipientStudentIds : enrolledIds)
      .filter((id) => id !== currentUserId);

    const title = 'Sesi Praktikum Dibuka 🔔';
    const body = `${session.namaPraktikum || 'Praktikum'} (${session.kelas || ''}) di ${session.ruangLab || 'Lab'} telah dibuka. Segera lakukan presensi!`;

    await sendLocalNotification({
      title,
      body,
      data: {
        type: 'session_opened',
        sessionId: session.id,
        targetStudentIds: effectiveTargetIds,
      },
    });

    return {
      success: true,
      message: 'Notifikasi pembukaan sesi berhasil dikirim.',
      targetCount: effectiveTargetIds.length,
    };
  } catch (error) {
    console.error('Error notifySessionOpened:', error);
    return { success: false, message: error.message || 'Gagal mengirim notifikasi sesi.' };
  }
};

/**
 * Mengirim notifikasi perubahan jadwal praktikum ke peserta kelas yang relevan (FT-13).
 */
export const notifyScheduleChanged = async ({ session, recipientStudentIds = [], currentUserId = null }) => {
  try {
    if (!session) return { success: false, message: 'Data sesi tidak ditemukan.' };

    const enrolledIds = Array.isArray(session.daftarPeserta)
      ? session.daftarPeserta.map((p) => p.nim || p.studentId || p.id).filter(Boolean)
      : [];

    const effectiveTargetIds = (recipientStudentIds.length > 0 ? recipientStudentIds : enrolledIds)
      .filter((id) => id !== currentUserId);

    const title = 'Perubahan Jadwal Praktikum 📅';
    const body = `Jadwal ${session.namaPraktikum || 'Praktikum'} (${session.kelas || ''}) diperbarui: ${session.hari || ''}, ${session.jamMulai || ''} - ${session.jamSelesai || ''}.`;

    await sendLocalNotification({
      title,
      body,
      data: {
        type: 'schedule_changed',
        sessionId: session.id,
        targetStudentIds: effectiveTargetIds,
      },
    });

    return {
      success: true,
      message: 'Notifikasi perubahan jadwal berhasil dikirim.',
      targetCount: effectiveTargetIds.length,
    };
  } catch (error) {
    console.error('Error notifyScheduleChanged:', error);
    return { success: false, message: error.message || 'Gagal mengirim notifikasi jadwal.' };
  }
};

/**
 * Mengirim notifikasi keputusan izin hanya ke mahasiswa yang mengajukan (FT-13).
 */
export const notifyLeaveDecision = async ({ studentId, decision, namaPraktikum = 'Praktikum' }) => {
  try {
    if (!studentId) {
      return { success: false, message: 'Target studentId penerima izin wajib diisi.' };
    }

    const isApproved = decision === 'approved' || decision === 'DISETUJUI';
    const title = isApproved ? 'Pengajuan Izin Disetujui ✅' : 'Pengajuan Izin Ditolak ❌';
    const body = `Pengajuan izin Anda untuk ${namaPraktikum} telah ${isApproved ? 'DISETUJUI' : 'DITOLAK'} oleh asisten.`;

    await sendLocalNotification({
      title,
      body,
      data: {
        type: 'leave_decision',
        studentId,
        decision,
      },
    });

    return {
      success: true,
      message: `Notifikasi keputusan izin berhasil dikirim ke mahasiswa ${studentId}.`,
    };
  } catch (error) {
    console.error('Error notifyLeaveDecision:', error);
    return { success: false, message: error.message || 'Gagal mengirim notifikasi izin.' };
  }
};
