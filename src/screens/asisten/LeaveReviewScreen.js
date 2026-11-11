// src/screens/asisten/LeaveReviewScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { subscribeAllLeaveRequests, reviewLeaveRequest } from '../../services/permissionService';
import { AIBadge } from '../../components/common/AIBadge';

export const LeaveReviewScreen = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeAllLeaveRequests(
      (data) => {
        setRequests(data);
        setLoading(false);
      },
      () => setLoading(false)
    );

    return () => unsubscribe();
  }, []);

  const handleReview = (requestId, decision) => {
    const label = decision === 'approved' ? 'MENYETUJUI' : 'MENOLAK';
    Alert.alert(
      'Konfirmasi Keputusan',
      `Apakah Anda yakin ingin ${label} pengajuan izin praktikan ini?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya, Simpan',
          onPress: async () => {
            setProcessingId(requestId);
            try {
              await reviewLeaveRequest(
                requestId,
                decision,
                user?.name || user?.displayName || 'Asisten'
              );
            } catch (error) {
              Alert.alert('Gagal', 'Tidak dapat menyimpan keputusan ke Firestore.');
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Memuat daftar pengajuan izin...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Pemeriksaan Izin Praktikan</Text>
      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Belum ada pengajuan izin yang masuk.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.studentName}>{item.studentName}</Text>
                <Text style={styles.studentNim}>NIM: {item.studentNim}</Text>
              </View>
              <Text
                style={[
                  styles.statusLabel,
                  item.status === 'approved' && { color: '#059669' },
                  item.status === 'rejected' && { color: '#DC2626' },
                ]}
              >
                {item.status.toUpperCase()}
              </Text>
            </View>

            <Text style={styles.sessionInfo}>Sesi: {item.sessionName}</Text>
            <Text style={styles.reasonBox}>"{item.reason}"</Text>

            <AIBadge category={item.aiCategory} confidence={item.aiConfidence} />

            {item.status === 'pending' ? (
              <View style={styles.actionRow}>
                {processingId === item.id ? (
                  <ActivityIndicator size="small" color="#2563EB" />
                ) : (
                  <>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.rejectBtn]}
                      onPress={() => handleReview(item.id, 'rejected')}
                    >
                      <Text style={styles.rejectBtnText}>Tolak</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.approveBtn]}
                      onPress={() => handleReview(item.id, 'approved')}
                    >
                      <Text style={styles.approveBtnText}>Terima</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            ) : (
              <Text style={styles.reviewedByText}>Diputuskan oleh: {item.reviewedBy}</Text>
            )}
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#F9FAFB' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 12 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 8, color: '#6B7280', fontSize: 13 },
  emptyBox: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#9CA3AF', fontSize: 14 },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  studentName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  studentNim: { fontSize: 12, color: '#6B7280' },
  statusLabel: { fontSize: 12, fontWeight: '700', color: '#D97706' },
  sessionInfo: { fontSize: 13, fontWeight: '600', color: '#374151', marginTop: 4 },
  reasonBox: {
    fontSize: 14,
    color: '#4B5563',
    fontStyle: 'italic',
    backgroundColor: '#F3F4F6',
    padding: 10,
    borderRadius: 6,
    marginVertical: 8,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  actionBtn: { paddingVertical: 8, paddingHorizontal: 18, borderRadius: 6, marginLeft: 10 },
  rejectBtn: { backgroundColor: '#FEE2E2' },
  approveBtn: { backgroundColor: '#2563EB' },
  rejectBtnText: { color: '#DC2626', fontWeight: '600', fontSize: 13 },
  approveBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 13 },
  reviewedByText: { fontSize: 11, color: '#9CA3AF', marginTop: 6, textAlign: 'right' },
});
