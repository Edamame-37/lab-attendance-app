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
import {
  subscribeAllLeaveRequests,
  reviewLeaveRequest,
} from '../../services/permissionService';
import { AIBadge } from '../../components/common/AIBadge';

const formatDate = (timestamp) => {
  if (!timestamp) return '-';

  const date = timestamp.toDate
    ? timestamp.toDate()
    : new Date(timestamp);

  return Number.isNaN(date.getTime())
    ? '-'
    : date.toLocaleString('id-ID');
};

const getStatusLabel = (status) => {
  switch (status) {
    case 'approved':
      return 'DISETUJUI';
    case 'rejected':
      return 'DITOLAK';
    default:
      return 'MENUNGGU';
  }
};

export const LeaveReviewScreen = () => {
  const { userProfile } = useAuth();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeAllLeaveRequests(
      (data) => {
        setRequests(data);
        setErrorMessage('');
        setLoading(false);
      },
      (error) => {
        console.error('Gagal memuat pengajuan:', error);
        setErrorMessage('Tidak dapat memuat daftar pengajuan izin.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleReview = (requestId, decision) => {
    const label = decision === 'approved' ? 'menyetujui' : 'menolak';

    Alert.alert(
      'Konfirmasi Keputusan',
      `Apakah kamu yakin ingin ${label} pengajuan izin ini?`,
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
                userProfile?.nama
              );

              Alert.alert(
                'Berhasil',
                `Pengajuan berhasil ${
                  decision === 'approved' ? 'disetujui' : 'ditolak'
                }.`
              );
            } catch (error) {
              console.error('Gagal menyimpan keputusan:', error);

              Alert.alert(
                'Gagal',
                error.message || 'Keputusan tidak dapat disimpan.'
              );
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }) => {
    const isPending = item.status === 'pending';
    const isProcessing = processingId === item.id;

    return (
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.studentInfo}>
            <Text style={styles.studentName}>
              {item.studentName || 'Nama tidak tersedia'}
            </Text>
            <Text style={styles.studentNim}>
              NIM: {item.studentNim || '-'}
            </Text>
          </View>

          <Text
            style={[
              styles.statusLabel,
              item.status === 'approved' && styles.approved,
              item.status === 'rejected' && styles.rejected,
              isPending && styles.pending,
            ]}
          >
            {getStatusLabel(item.status)}
          </Text>
        </View>

        <Text style={styles.sessionInfo}>
          Sesi: {item.sessionName || '-'}
        </Text>

        <Text style={styles.sectionLabel}>Alasan izin</Text>
        <Text style={styles.reasonBox}>
          {item.reason || 'Alasan tidak tersedia'}
        </Text>

        <AIBadge
          category={item.aiCategory}
          experimental={item.aiExperimental}
        />

        {isPending ? (
          <View style={styles.actionRow}>
            {isProcessing ? (
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
                  <Text style={styles.approveBtnText}>Setujui</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        ) : (
          <View style={styles.reviewInfo}>
            <Text style={styles.reviewInfoText}>
              Diputuskan oleh: {item.reviewedBy || '-'}
            </Text>
            <Text style={styles.reviewInfoText}>
              Waktu keputusan: {formatDate(item.reviewedAt)}
            </Text>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>
          Memuat daftar pengajuan izin...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>
        Pemeriksaan Izin Praktikan
      </Text>

      {errorMessage ? (
        <Text style={styles.errorText}>{errorMessage}</Text>
      ) : null}

      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>
              Belum ada pengajuan izin yang masuk.
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F9FAFB',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#6B7280',
    fontSize: 13,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  errorText: {
    color: '#DC2626',
    marginBottom: 10,
  },
  emptyBox: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  studentInfo: {
    flex: 1,
    marginRight: 8,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  studentNim: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 3,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  pending: {
    color: '#D97706',
  },
  approved: {
    color: '#059669',
  },
  rejected: {
    color: '#DC2626',
  },
  sessionInfo: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginTop: 4,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
    marginBottom: 5,
  },
  reasonBox: {
    fontSize: 14,
    color: '#4B5563',
    backgroundColor: '#F3F4F6',
    padding: 10,
    borderRadius: 6,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  actionBtn: {
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: 6,
    marginLeft: 10,
  },
  rejectBtn: {
    backgroundColor: '#FEE2E2',
  },
  approveBtn: {
    backgroundColor: '#2563EB',
  },
  rejectBtnText: {
    color: '#DC2626',
    fontWeight: '600',
    fontSize: 13,
  },
  approveBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  reviewInfo: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  reviewInfoText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 3,
  },
});