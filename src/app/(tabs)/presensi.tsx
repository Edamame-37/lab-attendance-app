import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/ScreenContainer';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { radius, spacing } from '@/theme';

export default function AttendanceTab(): React.JSX.Element {
  const router = useRouter();
  const { role } = useAuth();
  const { tema } = useApp();

  const actions = role === 'asisten'
    ? [
        { label: 'Kelola dan Buka Sesi', description: 'Pilih laboratorium lalu buka sesi untuk praktikan.', icon: 'calendar-outline' as const, route: '/sesi' as const },
        { label: 'Review Pengajuan Izin', description: 'Periksa pengajuan izin dari praktikan.', icon: 'document-text-outline' as const, route: '/review-izin' as const },
      ]
    : [
        { label: 'Presensi Berbasis Lokasi', description: 'Gunakan sesi Firestore dan radius laboratorium yang dibuka asisten.', icon: 'locate-outline' as const, route: '/presensi-lokasi' as const },
        { label: 'Status Pengajuan Izin', description: 'Lihat hasil review izin praktikum.', icon: 'time-outline' as const, route: '/status-izin' as const },
      ];

  return (
    <ScreenContainer>
      <View>
        <Text style={[styles.title, { color: tema.textPrimary }]}>{role === 'asisten' ? 'Kontrol Presensi' : 'Presensi Praktikum'}</Text>
        <Text style={[styles.subtitle, { color: tema.textSecondary }]}>Seluruh data menggunakan sesi dan laboratorium Cloud Firestore yang sama.</Text>
      </View>

      {actions.map((action, index) => (
        <TouchableOpacity
          key={action.route}
          style={[
            styles.actionCard,
            {
              backgroundColor: index === 0 ? tema.accent : tema.surface,
              borderColor: index === 0 ? tema.accent : tema.border,
            },
          ]}
          onPress={() => router.push(action.route)}
          accessibilityRole="button"
          accessibilityLabel={action.label}
          accessibilityHint={action.description}
        >
          <Ionicons name={action.icon} size={25} color={index === 0 ? '#FFFFFF' : tema.accent} />
          <View style={styles.actionText}>
            <Text style={[styles.actionTitle, { color: index === 0 ? '#FFFFFF' : tema.textPrimary }]}>{action.label}</Text>
            <Text style={[styles.actionDescription, { color: index === 0 ? '#E5F4EF' : tema.textSecondary }]}>{action.description}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={index === 0 ? '#FFFFFF' : tema.textMuted} />
        </TouchableOpacity>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: '800' },
  subtitle: { fontSize: 12, lineHeight: 18, marginTop: 3 },
  actionCard: { minHeight: 104, borderRadius: radius.lg, borderWidth: 1, padding: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  actionText: { flex: 1 },
  actionTitle: { fontSize: 14, fontWeight: '800' },
  actionDescription: { fontSize: 12, lineHeight: 18, marginTop: 4 },
});
