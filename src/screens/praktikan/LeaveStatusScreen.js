
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';

import { useAuth } from '../../context/AuthContext';
import {
  subscribeStudentLeaveRequests,
} from '../../services/permissionService';
import { AIBadge } from '../../components/common/AIBadge';

const formatDate = (timestamp) => {
  if (!timestamp) return '-';

  const date =
    typeof timestamp.toDate === 'function'
      ? timestamp.toDate()
      : new Date(timestamp);

  if (Number.isNaN(date.getTime())) return '-';

  return date.toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

const getStatusBadge = (status) => {
  switch (status) {
    case 'approved':
      return {
        label: 'DISETUJUI',
        color: '#059669',
        backgroundColor: '#D1FAE5',
      };

    case 'rejected':
      return {
        label: 'DITOLAK',
        color: '#DC2626',
        backgroundColor: '#FEE2E2',
      };

    default:
      return {
        label: 'MENUNGGU',
        color: '#D97706',
        backgroundColor: '#FEF3C7',
      };
  }
};

export const LeaveStatusScreen = () => {
  const { user } = useAuth();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!user?.uid) {
      setRequests([]);
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeStudentLeaveRequests(
      user.uid,
      (data) => {
        setRequests(data);
        setErrorMessage('');
        setLoading(false);
      },
      (error) => {
        console.error('Gagal memuat status pengajuan:', error);
        setErrorMessage('Gagal mengambil riwayat pengajuan izin.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  const renderItem = ({ item }) => {
    const statusStyle = getStatusBadge(item.status);
    const isPending = item.status === 'pending';

    return (
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.sessionTitle}>
            {item.sessionName || 'Sesi Praktikum'}
          </Text>

          <View
            style={[
              styles.statusChip,
              { backgroundColor: statusStyle.backgroundColor },
            ]}
          >
            <Text
              style={[
                styles.statusChipText,
                { color: statusStyle.color },
              ]}
            >
              {statusStyle.label}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Alasan izin</Text>
        <Text style={styles.reasonText}>
          {item.reason || '-'}
        </Text>

        {item.aiCategory ? (
          <AIBadge
            category={item.aiCategory}
            status={item.aiStatus}
            experimental={item.aiExperimental}
          />
        ) : null}

        {isPending ? (
          <Text style={styles.pendingInfo}>
            Pengajuan sedang menunggu verifikasi Asisten.
          </Text>
        ) : (
          <View style={styles.reviewInfo}>
            <Text style={styles.reviewerInfo}>
              Diputuskan oleh: {item.reviewedBy || '-'}
            </Text>

            <Text style={styles.reviewerInfo}>
              Waktu keputusan: {formatDate(item.reviewedAt)}
            </Text>
          </View>
        )}

        <Text style={styles.createdInfo}>
          Diajukan: {formatDate(item.createdAt)}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Memuat riwayat izin...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Status Pengajuan Izin Saya</Text>

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
              Belum ada riwayat pengajuan izin.
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
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
  errorText: {
    color: '#DC2626',
    marginBottom: 12,
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
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
    marginRight: 8,
  },
  statusChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 5,
  },
  reasonText: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 6,
  },
  pendingInfo: {
    fontSize: 12,
    color: '#D97706',
    marginTop: 8,
  },
  reviewInfo: {
    marginTop: 8,
  },
  reviewerInfo: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  createdInfo: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 10,
  },
});
