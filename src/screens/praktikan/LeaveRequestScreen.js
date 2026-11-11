// src/screens/praktikan/LeaveRequestScreen.js
import React, { useState } from 'react';
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
import { classifyLeaveReason } from '../../services/aiService';
import { submitLeaveRequest } from '../../services/permissionService';

export const LeaveRequestScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Mengambil data sesi dari parameter navigasi (atau fallback sesi aktif)
  const session = route?.params?.session || {
    id: 'SESI-01',
    name: 'Praktikum Pemrograman Bergerak - Modul 2',
  };

  const handleSubmit = async () => {
    const trimmedReason = reason.trim();
    if (trimmedReason.length < 10) {
      Alert.alert('Input Tidak Valid', 'Mohon tuliskan alasan izin secara jelas (minimal 10 karakter).');
      return;
    }

    setSubmitting(true);
    try {
      // Tahap 1: Klasifikasi alasan melalui API AI
      const aiResult = await classifyLeaveReason(trimmedReason);

      // Tahap 2: Simpan dokumen pengajuan ke Cloud Firestore
      await submitLeaveRequest({
        studentId: user?.uid,
        studentName: user?.name || user?.displayName || 'Praktikan',
        studentNim: user?.nim || '-',
        sessionId: session.id,
        sessionName: session.name,
        reason: trimmedReason,
        aiCategory: aiResult.category,
        aiConfidence: aiResult.confidence,
      });

      Alert.alert(
        'Pengajuan Terkirim',
        `Izin berhasil diajukan.\nKategori AI: ${aiResult.category}\nStatus: Menunggu verifikasi asisten.`,
        [
          {
            text: 'Lihat Status',
            onPress: () => navigation.navigate('LeaveStatus'),
          },
        ]
      );
      setReason('');
    } catch (error) {
      Alert.alert('Gagal Mengirim', 'Terjadi gangguan jaringan saat menyimpan pengajuan izin.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Pengajuan Izin Praktikum</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Sesi Praktikum</Text>
        <Text style={styles.sessionValue}>{session.name}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Alasan Ketidakhadiran</Text>
        <TextInput
          style={styles.input}
          placeholder="Contoh: Saya sedang sakit demam dan harus beristirahat..."
          multiline
          numberOfLines={5}
          value={reason}
          onChangeText={setReason}
          editable={!submitting}
        />
        <Text style={styles.helperText}>
          *Alasan akan dianalisis secara otomatis oleh AI sebagai informasi pendukung asisten.
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color="#FFFFFF" size="small" />
            <Text style={styles.submitBtnText}> Memproses & Menganalisis AI...</Text>
          </View>
        ) : (
          <Text style={styles.submitBtnText}>Kirim Pengajuan Izin</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 16, backgroundColor: '#F9FAFB' },
  title: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 16 },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  label: { fontSize: 13, fontWeight: '600', color: '#6B7280', marginBottom: 6 },
  sessionValue: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    minHeight: 110,
    textAlignVertical: 'top',
  },
  helperText: { fontSize: 11, color: '#9CA3AF', marginTop: 8 },
  submitBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitBtnDisabled: { backgroundColor: '#93C5FD' },
  loadingRow: { flexDirection: 'row', alignItems: 'center' },
  submitBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
});
