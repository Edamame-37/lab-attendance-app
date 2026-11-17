
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  ScrollView,
} from 'react-native';

import { useAuth } from '../../context/AuthContext';
import { subscribeToSessions } from '../../services/firestoreService';
import { submitLeaveRequest } from '../../services/permissionService';

export const LeaveRequestScreen = ({ navigation, route }) => {
  // user berisi data Firebase Authentication
  // userProfile berisi nama, NIM, dan kelas dari Firestore
  const { user, userProfile } = useAuth();

  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(
    route?.params?.session?.id || ''
  );
  const [reason, setReason] = useState('');
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Mengambil daftar sesi praktikum secara real-time
  useEffect(() => {
    const unsubscribe = subscribeToSessions(
      (data) => {
        // Hanya tampilkan sesi yang sedang dibuka
        const activeSessions = data.filter(
          (item) =>
            item.status === 'open' ||
            item.statusSesi === 'DIBUKA'
        );

        setSessions(activeSessions);
        setLoadingSessions(false);

        // Pilih sesi dari halaman sebelumnya jika masih tersedia
        if (
          route?.params?.session?.id &&
          activeSessions.some(
            (item) => item.id === route.params.session.id
          )
        ) {
          setSelectedSessionId(route.params.session.id);
        }
      },
      (error) => {
        console.error('Gagal mengambil sesi:', error);
        setLoadingSessions(false);
        Alert.alert('Gagal Memuat Sesi', 'Tidak dapat mengambil data sesi praktikum.');
      }
    );

    // Hentikan listener saat halaman ditutup
    return () => unsubscribe();
  }, []);

  // Mencari sesi yang dipilih oleh Praktikan
  const selectedSession = sessions.find(
    (item) => item.id === selectedSessionId
  );

  // Mengirim pengajuan izin ke Firestore
  const handleSubmit = async () => {
    const trimmedReason = reason.trim();

    if (!user?.uid || !userProfile) {
      Alert.alert('Profil Tidak Tersedia', 'Silakan login kembali.');
      return;
    }

    if (!selectedSession) {
      Alert.alert('Sesi Belum Dipilih', 'Pilih sesi praktikum terlebih dahulu.');
      return;
    }

    if (trimmedReason.length < 10) {
      Alert.alert(
        'Input Tidak Valid',
        'Tuliskan alasan izin minimal 10 karakter.'
      );
      return;
    }

    setSubmitting(true);

    try {
      // Simpan identitas, sesi, alasan, dan status awal ke Firestore
      await submitLeaveRequest({
        studentId: user.uid,
        studentName: userProfile.nama,
        studentNim: userProfile.nomorInduk,
        sessionId: selectedSession.id,
        sessionName:
          selectedSession.namaPraktikum ||
          selectedSession.topikMateri ||
          selectedSession.name ||
          'Sesi Praktikum',
        reason: trimmedReason,
      });

      Alert.alert(
        'Pengajuan Terkirim',
        'Pengajuan izin berhasil disimpan. Status saat ini: Menunggu verifikasi Asisten.',
        [
          {
            text: 'Lihat Status',
            onPress: () => navigation.navigate('LeaveStatus'),
          },
        ]
      );

      setReason('');
    } catch (error) {
      console.error('Gagal mengirim pengajuan:', error);

      Alert.alert(
        'Gagal Mengirim',
        error.message || 'Pengajuan izin gagal disimpan. Silakan coba kembali.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Pengajuan Izin Praktikum</Text>

      {/* Pilihan sesi yang sedang dibuka */}
      <View style={styles.card}>
        <Text style={styles.label}>Pilih Sesi Praktikum</Text>

        {loadingSessions ? (
          <ActivityIndicator color="#2563EB" />
        ) : sessions.length === 0 ? (
          <Text style={styles.helperText}>
            Belum ada sesi praktikum yang dibuka.
          </Text>
        ) : (
          sessions.map((item) => {
            const sessionName =
              item.namaPraktikum ||
              item.topikMateri ||
              item.name ||
              'Sesi Praktikum';

            const isSelected = selectedSessionId === item.id;

            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.sessionOption,
                  isSelected && styles.sessionOptionActive,
                ]}
                onPress={() => setSelectedSessionId(item.id)}
                disabled={submitting}
              >
                <Text
                  style={[
                    styles.sessionOptionText,
                    isSelected && styles.sessionOptionTextActive,
                  ]}
                >
                  {sessionName}
                </Text>

                <Text style={styles.sessionStatus}>
                  {isSelected ? 'Dipilih' : 'Pilih sesi'}
                </Text>
              </TouchableOpacity>
            );
          })
        )}
      </View>

      {/* Form alasan izin */}
      <View style={styles.card}>
        <Text style={styles.label}>Alasan Ketidakhadiran</Text>

        <TextInput
          style={styles.input}
          placeholder="Tuliskan alasan izin secara jelas..."
          multiline
          numberOfLines={5}
          value={reason}
          onChangeText={setReason}
          editable={!submitting}
          textAlignVertical="top"
        />

        <Text style={styles.helperText}>
          Minimal 10 karakter. Pengajuan akan menunggu verifikasi Asisten.
        </Text>
      </View>

      {/* Tombol mengirim pengajuan */}
      <TouchableOpacity
        style={[
          styles.submitBtn,
          (submitting || loadingSessions || sessions.length === 0) &&
            styles.submitBtnDisabled,
        ]}
        onPress={handleSubmit}
        disabled={submitting || loadingSessions || sessions.length === 0}
      >
        {submitting ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color="#FFFFFF" size="small" />
            <Text style={styles.submitBtnText}> Mengirim Pengajuan...</Text>
          </View>
        ) : (
          <Text style={styles.submitBtnText}>Kirim Pengajuan Izin</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: '#F9FAFB',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 10,
  },
  sessionOption: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    marginBottom: 8,
  },
  sessionOptionActive: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  sessionOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  sessionOptionTextActive: {
    color: '#1D4ED8',
  },
  sessionStatus: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    minHeight: 110,
  },
  helperText: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 8,
  },
  submitBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    backgroundColor: '#93C5FD',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
