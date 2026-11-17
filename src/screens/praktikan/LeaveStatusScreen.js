
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

  useEffect(() => {
    if (!user?.uid) {
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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text>Memuat riwayat izin...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Status Pengajuan Izin Saya</Text>

      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            Belum ada riwayat pengajuan izin.
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.session}>
              Sesi: {item.sessionName}
            </Text>

            <Text style={styles.reason}>
              Alasan: {item.reason}
            </Text>

            <Text style={styles.status}>
              Status: {item.status?.toUpperCase() || 'UNKNOWN'}
            </Text>

            <AIBadge
              category={item.aiCategory}
              experimental={item.aiExperimental}
            />

            {item.status === 'pending' ? (
              <Text style={styles.pending}>
                Menunggu verifikasi Asisten.
              </Text>
            ) : (
              <Text style={styles.review}>
                Diputuskan oleh: {item.reviewedBy || 'Asisten'}
              </Text>
            )}
          </View>
        )}
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
  card: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  session: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  reason: {
    fontSize: 14,
    color: '#4B5563',
    marginTop: 8,
  },
  status: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
    marginTop: 8,
  },
  pending: {
    fontSize: 12,
    color: '#D97706',
    marginTop: 6,
  },
  review: {
    fontSize: 12,
    color: '#059669',
    marginTop: 6,
  },
  emptyText: {
    textAlign: 'center',
    color: '#9CA3AF',
    marginTop: 30,
  },
});
