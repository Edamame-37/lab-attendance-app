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
        setLoading(false);
      },
      (error) => {
        console.error('Gagal memuat pengajuan:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  const renderItem = ({ item }) => {
    const statusStyle = getStatusBadge(item.status);

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
            <Text style={[styles.statusChipText, { color: statusStyle.color }]}>
              {statusStyle.label}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Alasan izin</Text>
        <Text style={styles.reasonText}>
          {item.reason || '-'}
        </Text>

        <AIBadge
          category={item.aiCategory}
          experimental={item.aiExperimental}
        />

        {item.status === 'pending' ? (
          <Text style={styles.pendingInfo}>
            Pengajuan sedang menunggu verifikasi Asisten.
          </Text>
        ) : (
          <Text style={styles.reviewerInfo}>
            Diputuskan oleh: {item.reviewedBy || '-'}
          </Text>
        )}
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
      <Text style={styles.title}>Status Pengajuan Izin Saya</Text>

      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            Belum ada riwayat pengajuan izin.
          </Text>
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
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    color: '#111827',
  },
  loadingText: {
    marginTop: 8,
    color: '#6B7280',
    fontSize: 13,
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
  reviewerInfo: {
    fontSize: 12,
    color: '#059669',
    marginTop: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: '#9CA3AF',
    marginTop: 30,
  },
});