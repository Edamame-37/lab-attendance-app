/**
 * @file src/components/asisten/AttendanceRecapCard.js
 * @author Farrel (feature/lab-attendance-firestore)
 * @description Komponen kartu rekapitulasi presensi real-time untuk asisten (SRS-FT-04).
 * Menampilkan statistik kehadiran terkini dan daftar praktikan yang sudah presensi.
 */

import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { lightTheme } from '../../theme';

export const AttendanceRecapCard = ({
  session,
  attendances = [],
  loading = false,
}) => {
  const context = useContext(AppContext);
  const tema = context?.tema || lightTheme;

  const totalHadir = attendances.filter((a) => a.statusKehadiran === 'HADIR').length;
  const totalIzin = attendances.filter((a) => a.statusKehadiran === 'IZIN').length;
  const totalSakit = attendances.filter((a) => a.statusKehadiran === 'SAKIT').length;

  return (
    <View style={[styles.card, { backgroundColor: tema.surface, borderColor: tema.border }]}>
      {/* Header Kartu */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: tema.textPrimary }]}>
            {session?.namaPraktikum || 'Sesi Praktikum'}
          </Text>
          <Text style={[styles.subtitle, { color: tema.textSecondary }]}>
            {session?.topikMateri ? `Topik: ${session.topikMateri}` : 'Rekap Kehadiran Real-time'}
          </Text>
        </View>
        <View
          style={[
            styles.liveBadge,
            { backgroundColor: tema.statusHadirBg || '#DCFCE7' },
          ]}
        >
          <View style={[styles.liveDot, { backgroundColor: tema.statusHadir || '#16A34A' }]} />
          <Text style={[styles.liveText, { color: tema.statusHadir || '#16A34A' }]}>
            LIVE
          </Text>
        </View>
      </View>

      {/* Ringkasan Angka Statistik */}
      <View style={[styles.statsContainer, { backgroundColor: tema.surfaceRaised, borderColor: tema.borderSubtle }]}>
        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: tema.statusHadir || '#16A34A' }]}>
            {totalHadir}
          </Text>
          <Text style={[styles.statLabel, { color: tema.textSecondary }]}>Hadir</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: tema.borderSubtle }]} />
        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: tema.statusIzin || '#D97706' }]}>
            {totalIzin}
          </Text>
          <Text style={[styles.statLabel, { color: tema.textSecondary }]}>Izin</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: tema.borderSubtle }]} />
        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: tema.statusSakit || '#DC2626' }]}>
            {totalSakit}
          </Text>
          <Text style={[styles.statLabel, { color: tema.textSecondary }]}>Sakit</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: tema.borderSubtle }]} />
        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: tema.textPrimary }]}>
            {attendances.length}
          </Text>
          <Text style={[styles.statLabel, { color: tema.textSecondary }]}>Total</Text>
        </View>
      </View>

      {/* Daftar Kehadiran Real-Time */}
      <Text style={[styles.sectionHeading, { color: tema.textSecondary }]}>
        Daftar Masuk ({attendances.length})
      </Text>

      {loading ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="small" color={tema.accent} />
          <Text style={[styles.emptyText, { color: tema.textMuted }]}>
            Memuat data presensi...
          </Text>
        </View>
      ) : attendances.length === 0 ? (
        <View style={[styles.emptyContainer, { backgroundColor: tema.surfaceRaised }]}>
          <Text style={[styles.emptyText, { color: tema.textMuted }]}>
            Belum ada praktikan yang melakukan presensi pada sesi ini.
          </Text>
        </View>
      ) : (
        <FlatList
          data={attendances}
          keyExtractor={(item) => item.id || item.studentId + item.timestamp}
          scrollEnabled={false}
          renderItem={({ item, index }) => (
            <View
              style={[
                styles.attendanceRow,
                { borderBottomColor: tema.borderSubtle },
                index === attendances.length - 1 && { borderBottomWidth: 0 },
              ]}
            >
              <View style={styles.studentInfo}>
                <Text style={[styles.studentName, { color: tema.textPrimary }]}>
                  {item.studentName}
                </Text>
                <Text style={[styles.studentNim, { color: tema.textSecondary }]}>
                  {item.studentNim} • {item.studentClass || item.kelasPraktikan || '-'}
                </Text>
              </View>

              <View style={styles.statusCol}>
                <View
                  style={[
                    styles.statusPill,
                    item.statusKehadiran === 'HADIR' && {
                      backgroundColor: tema.statusHadirBg || '#DCFCE7',
                    },
                    item.statusKehadiran === 'IZIN' && {
                      backgroundColor: '#FEF3C7',
                    },
                    item.statusKehadiran === 'SAKIT' && {
                      backgroundColor: '#FEE2E2',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      item.statusKehadiran === 'HADIR' && {
                        color: tema.statusHadir || '#16A34A',
                      },
                      item.statusKehadiran === 'IZIN' && { color: '#D97706' },
                      item.statusKehadiran === 'SAKIT' && { color: '#DC2626' },
                    ]}
                  >
                    {item.statusKehadiran}
                  </Text>
                </View>
                <Text style={[styles.timeText, { color: tema.textMuted }]}>
                  {item.waktuPresensi || '-'}
                </Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginVertical: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statsContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    paddingVertical: 10,
    borderWidth: 1,
    marginBottom: 14,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: '70%',
    alignSelf: 'center',
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  attendanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 14,
    fontWeight: '600',
  },
  studentNim: {
    fontSize: 12,
    marginTop: 2,
  },
  statusCol: {
    alignItems: 'flex-end',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  timeText: {
    fontSize: 10,
    marginTop: 3,
  },
  emptyContainer: {
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 12,
    textAlign: 'center',
  },
});

export default AttendanceRecapCard;

