import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/ScreenContainer';
import { useApp } from '@/context/AppContext';
import { radius, spacing } from '@/theme';

const ACTIONS = [
  {
    label: 'Presensi Berbasis Lokasi',
    description: 'Validasi sesi, identitas, akurasi GPS, radius laboratorium, dan duplikasi.',
    icon: 'locate-outline' as const,
    route: '/presensi-lokasi' as const,
  },
  {
    label: 'Ajukan Izin',
    description: 'Kirim alasan izin untuk sesi yang sedang dibuka.',
    icon: 'document-text-outline' as const,
    route: '/pengajuan-izin' as const,
  },
  {
    label: 'Status Pengajuan Izin',
    description: 'Pantau keputusan izin dari asisten secara real-time.',
    icon: 'time-outline' as const,
    route: '/status-izin' as const,
  },
];

export default function AttendanceTab(): React.JSX.Element {
  const router = useRouter();
  const { tema } = useApp();

  return (
    <ScreenContainer>
      <View>
        <Text style={[styles.title, { color: tema.textPrimary }]}>Presensi Praktikum</Text>
        <Text style={[styles.subtitle, { color: tema.textSecondary }]}>
          Pilih presensi kehadiran atau alur izin sesuai kebutuhan sesi.
        </Text>
      </View>

      {ACTIONS.map((action, index) => (
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
