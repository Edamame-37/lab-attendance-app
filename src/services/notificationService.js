import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

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
      Constants.easConfig?.projectId;

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
  } catch (error) {
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
  } catch (error) {
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