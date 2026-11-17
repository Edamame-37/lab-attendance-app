
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';

import { useAuth } from '../../context/AuthContext';
import { subscribeStudentLeaveRequests } from '../../services/permissionService';
import { AIBadge } from '../../components/common/AIBadge';

export const LeaveStatusScreen = () => {
  const { user } = useAuth();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // Memantau pengajuan milik Praktikan yang sedang login
  useEffect(() => {
    if (!user?.uid) {
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

    // Menghentikan listener saat halaman ditutup
    return () => unsubscribe();
  }, [user?.uid]);

  // Menentukan tampilan berdasarkan status pengajuan
  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return {
          label: 'DISETUJUI',
          color: '#059669',
          bg: '#D1FAE5',
        };

      case 'rejected':
        return {
          label: 'DITOLAK',
          color: '#DC2626',
          bg: '#FEE2E2',
        };

      default:
        return {
          label: 'MENUNGGU',
          color: '#D97706',
          bg: '#FEF3C7',
        };
    }
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

      {/* Menampilkan pesan jika Firestore gagal dibaca */}
      {errorMessage ? (
        <Text style={styles.errorText}>{errorMessage}</Text>
      ) : null}

      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>
              Belum ada riwayat pengajuan izin.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const statusStyle = getStatusBadge(item.status);

          return (
            <View style={styles.card}>
              <View style={styles.rowBetween}>
                <Text style={styles.sessionTitle}>
                  {item.sessionName}
                </Text>

                <View
                  style={[
                    styles.statusChip,
                    { backgroundColor: statusStyle.bg },
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

              <Text style={styles.reasonText}>
                "{item.reason}"
              </Text>

              {/* Badge AI muncul setelah hasil EDOM tersedia */}
              {item.aiCategory ? (
                <AIBadge
                  category={item.aiCategory}
                  confidence={item.aiConfidence}
                />
              ) : null}

              {item.reviewedBy ? (
                <Text style={styles.reviewerInfo}>
                  Diverifikasi oleh: {item.reviewedBy}
                </Text>
              ) : null}
            </View>
          );
        }}
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
    fontSize: 13,
    marginBottom: 12,
  },
  emptyBox: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 14,
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
  reasonText: {
    fontSize: 14,
    color: '#4B5563',
    fontStyle: 'italic',
    marginBottom: 6,
  },
  reviewerInfo: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 6,
  },
});
