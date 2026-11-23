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
      {/* BANNER KE PRESENSI CLOUD FIRESTORE RESMI (SRS-FT-03 & FT-09) */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() =>
          router.push({
            pathname: '/presensi-lokasi',
            params: selectedSesiId ? { sessionId: selectedSesiId } : {},
          } as any)
        }
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: tema.statusHadirBg || '#DCFCE7',
          borderColor: tema.statusHadir || '#16A34A',
          borderWidth: 1,
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 10,
          marginBottom: 14,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
          <Ionicons name="cloud-upload-outline" size={20} color={tema.statusHadir || '#16A34A'} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: tema.statusHadir || '#16A34A' }}>
              Buka Presensi Berbasis Lokasi
            </Text>
            <Text style={{ fontSize: 11, color: tema.textSecondary }}>
              Validasi sesi, lokasi laboratorium, radius, dan anti-duplikasi
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color={tema.statusHadir || '#16A34A'} />
      </TouchableOpacity>

      {/* SECTION 1: FORMULIR PRESENSI */}
      <SectionHeader title="Formulir Kehadiran" isFirst />

      {peranAktif === 'asisten' ? (
        /* Tampilan Khusus Asisten */
        <View
          style={[
            styles.card,
            styles.asistenNoticeCard,
            {
              backgroundColor: tema.surface,
              borderColor: tema.border,
            },
          ]}
        >
          <View
            style={[
              styles.asistenIconCircle,
              { backgroundColor: tema.accentSurface },
            ]}
          >
            <Ionicons name="eye-outline" size={22} color={tema.accentText} />
          </View>
          <Text style={[styles.asistenTitle, { color: tema.textPrimary }]}>
            Mode Asisten Praktikum
          </Text>
          <Text style={[styles.asistenDesc, { color: tema.textSecondary }]}>
            Asisten memantau kehadiran mahasiswa melalui tab{' '}
            <Text style={{ fontWeight: '700', color: tema.textPrimary }}>
              Rekap
            </Text>
            . Beralih ke peran Praktikan untuk menguji pengisian formulir.
          </Text>
          <TouchableOpacity
            style={[
              styles.btnSwitchRole,
              {
                backgroundColor: tema.surfaceRaised,
                borderColor: tema.border,
              },
            ]}
            onPress={() => gantiPeran('praktikan')}
            activeOpacity={0.7}
          >
            <Ionicons name="swap-horizontal" size={16} color={tema.textPrimary} />
            <Text style={[styles.btnSwitchRoleText, { color: tema.textPrimary }]}>
              Beralih ke Peran Praktikan
            </Text>
          </TouchableOpacity>
        </View>
      ) : sesiDibukaList.length === 0 ? (
        /* Jika Tidak Ada Sesi Dibuka */
        <View
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
