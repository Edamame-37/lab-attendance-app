/**
 * @file src/components/aslab/LabActivitySummaryCard.js
 * @description Komponen kartu ringkasan aktivitas laboratorium dan metrik KPI Aslab (SRS-FT-19).
 * Menggunakan tema dinamis (light/dark) dan Ionicons (bebas emoji).
 *
 * @author Aufaarel Nabiil Aryadh Mecca (feature/aslab-dashboard-fines)
 * @srs SRS-FT-19
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';

/**
 * Kartu KPI Ringkasan Utama (Total Lab & Total Mahasiswa)
 */
export const KpiMetricsCard = ({
  totalLabs = 0,
  activeLabsCount = 0,
  totalStudents = 0,
  ongoingSessionsCount = 0,
}) => {
  const { tema } = useApp();

  return (
    <View style={[styles.kpiContainer, { backgroundColor: tema.surface, borderColor: tema.border }]}>
      <View style={styles.kpiRow}>
        {/* Box 1: Total Lab */}
        <View style={[styles.kpiBox, { backgroundColor: tema.surfaceRaised, borderColor: tema.borderSubtle }]}>
          <View style={[styles.kpiIconBox, { backgroundColor: '#DBEAFE' }]}>
            <Ionicons name="business" size={18} color="#2563EB" />
          </View>
          <View style={styles.kpiMeta}>
            <Text style={[styles.kpiValue, { color: tema.textPrimary }]}>{totalLabs}</Text>
            <Text style={[styles.kpiLabel, { color: tema.textSecondary }]}>
              {activeLabsCount} Lab Aktif
            </Text>
          </View>
        </View>

        {/* Box 2: Total Mahasiswa */}
        <View style={[styles.kpiBox, { backgroundColor: tema.surfaceRaised, borderColor: tema.borderSubtle }]}>
          <View style={[styles.kpiIconBox, { backgroundColor: '#DCFCE7' }]}>
            <Ionicons name="people" size={18} color="#16A34A" />
          </View>
          <View style={styles.kpiMeta}>
            <Text style={[styles.kpiValue, { color: tema.textPrimary }]}>{totalStudents}</Text>
            <Text style={[styles.kpiLabel, { color: tema.textSecondary }]}>Praktikan</Text>
          </View>
        </View>
      </View>

      {ongoingSessionsCount > 0 && (
        <View style={[styles.kpiHighlight, { backgroundColor: tema.accentSurface || '#ECFDF5', borderColor: tema.accent }]}>
          <View style={[styles.liveDot, { backgroundColor: '#16A34A' }]} />
          <Text style={[styles.kpiHighlightText, { color: tema.accentText }]}>
            {ongoingSessionsCount} Praktikum sedang berlangsung saat ini
          </Text>
        </View>
      )}
    </View>
  );
};

/**
 * Kartu Status Kegiatan Per Laboratorium (SRS-FT-19 blok 2)
 */
export const LabStatusCard = ({ lab, onPress }) => {
  const { tema } = useApp();

  const isLive = lab.statusKegiatan === 'BERLANGSUNG';
  const isScheduled = lab.statusKegiatan === 'TERJADWAL';

  const badgeBg = isLive ? '#DCFCE7' : isScheduled ? '#FEF3C7' : '#F3F4F6';
  const badgeColor = isLive ? '#16A34A' : isScheduled ? '#D97706' : '#6B7280';
  const badgeIcon = isLive ? 'radio' : isScheduled ? 'calendar' : 'pause-circle';

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[styles.labCard, { backgroundColor: tema.surface, borderColor: tema.border }]}
    >
      <View style={styles.labCardHeader}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[styles.labName, { color: tema.textPrimary }]}>{lab.name}</Text>
            <View style={[styles.codeBadge, { backgroundColor: tema.surfaceRaised }]}>
              <Text style={[styles.codeText, { color: tema.textMuted }]}>{lab.code}</Text>
            </View>
          </View>
          <Text style={[styles.courseText, { color: tema.textSecondary }]}>
            {lab.courseName} {lab.courseCode !== '-' ? `(${lab.courseCode})` : ''}
          </Text>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: badgeBg }]}>
          <Ionicons name={badgeIcon} size={12} color={badgeColor} />
          <Text style={[styles.statusBadgeText, { color: badgeColor }]}>
            {lab.statusKegiatan}
          </Text>
        </View>
      </View>

      <View style={[styles.labDivider, { backgroundColor: tema.borderSubtle }]} />

      <View style={styles.labDetailsGrid}>
        <View style={styles.detailItem}>
          <Ionicons name="location-outline" size={14} color={tema.textMuted} />
          <Text style={[styles.detailText, { color: tema.textSecondary }]} numberOfLines={1}>
            {lab.address}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="people-outline" size={14} color={tema.textMuted} />
          <Text style={[styles.detailText, { color: tema.textSecondary }]}>
            {lab.studentCount} Praktikan
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="timer-outline" size={14} color={tema.textMuted} />
          <Text style={[styles.detailText, { color: tema.textSecondary }]}>
            Toleransi {lab.gracePeriodMinutes} mnt
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="card-outline" size={14} color={tema.textMuted} />
          <Text style={[styles.detailText, { color: '#D97706' }]}>
            Denda Rp {lab.lateFineAmount?.toLocaleString('id-ID')}
          </Text>
        </View>
      </View>

      {lab.currentSession && (
        <View style={[styles.sessionHighlight, { backgroundColor: tema.surfaceRaised, borderColor: tema.borderSubtle }]}>
          <Ionicons
            name={isLive ? 'play-circle-outline' : 'time-outline'}
            size={16}
            color={isLive ? '#16A34A' : '#D97706'}
          />
          <View style={{ flex: 1 }}>
            <Text style={[styles.sessionHighlightTitle, { color: tema.textPrimary }]}>
              {lab.currentSession.namaPraktikum || lab.currentSession.topikMateri}
            </Text>
            <Text style={[styles.sessionHighlightMeta, { color: tema.textSecondary }]}>
              {lab.currentSession.kelas} · {lab.currentSession.hari}, {lab.currentSession.jamMulai} - {lab.currentSession.jamSelesai} WIB
            </Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

/**
 * Kartu Ringkasan Keuangan Denda (SRS-FT-19 blok 5)
 */
export const FineFinanceSummaryCard = ({ summary, period = 'hari' }) => {
  const { tema } = useApp();

  const periodLabel =
    period === 'hari' ? 'Hari Ini' : period === 'minggu' ? '7 Hari Terakhir' : 'Bulan Ini';

  return (
    <View style={[styles.financeCard, { backgroundColor: tema.surface, borderColor: tema.border }]}>
      <View style={styles.financeHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.financeTitle, { color: tema.textPrimary }]}>
            Riwayat Keuangan Hasil Denda
          </Text>
          <Text style={[styles.financeSub, { color: tema.textSecondary }]}>
            Periode: {periodLabel} ({summary.totalFinesCount} Tagihan)
          </Text>
        </View>
        <View style={[styles.financeIconCircle, { backgroundColor: '#FEF3C7' }]}>
          <Ionicons name="wallet-outline" size={18} color="#D97706" />
        </View>
      </View>

      <View style={styles.financeStatsRow}>
        {/* Terkumpul / Lunas */}
        <View style={[styles.financeBox, { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="checkmark-circle" size={14} color="#16A34A" />
            <Text style={[styles.financeBoxLabel, { color: '#16A34A' }]}>Lunas</Text>
          </View>
          <Text style={[styles.financeBoxAmount, { color: '#15803D' }]}>
            Rp {summary.totalCollectedAmount.toLocaleString('id-ID')}
          </Text>
          <Text style={[styles.financeBoxCount, { color: '#16A34A' }]}>
            {summary.paidCount} transaksi
          </Text>
        </View>

        {/* Menunggu Pembayaran */}
        <View style={[styles.financeBox, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="time" size={14} color="#D97706" />
            <Text style={[styles.financeBoxLabel, { color: '#D97706' }]}>Pending</Text>
          </View>
          <Text style={[styles.financeBoxAmount, { color: '#B45309' }]}>
            Rp {summary.totalPendingAmount.toLocaleString('id-ID')}
          </Text>
          <Text style={[styles.financeBoxCount, { color: '#D97706' }]}>
            {summary.pendingCount} tagihan
          </Text>
        </View>

        {/* Gagal / Kedaluwarsa */}
        <View style={[styles.financeBox, { backgroundColor: '#FEE2E2', borderColor: '#FECACA' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="close-circle" size={14} color="#DC2626" />
            <Text style={[styles.financeBoxLabel, { color: '#DC2626' }]}>Gagal</Text>
          </View>
          <Text style={[styles.financeBoxAmount, { color: '#991B1B' }]}>
            Rp {summary.totalFailedAmount.toLocaleString('id-ID')}
          </Text>
          <Text style={[styles.financeBoxCount, { color: '#DC2626' }]}>
            {summary.failedCount} tagihan
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  kpiContainer: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 10,
    marginBottom: 14,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
  },
  kpiBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  kpiIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiMeta: {
    flex: 1,
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  kpiLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  kpiHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  kpiHighlightText: {
    fontSize: 12,
    fontWeight: '600',
  },
  labCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 10,
    marginBottom: 10,
  },
  labCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  labName: {
    fontSize: 14,
    fontWeight: '800',
  },
  codeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  codeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  courseText: {
    fontSize: 12,
    marginTop: 3,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  labDivider: {
    height: 1,
  },
  labDetailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: '45%',
  },
  detailText: {
    fontSize: 11,
    fontWeight: '500',
  },
  sessionHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    marginTop: 2,
  },
  sessionHighlightTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  sessionHighlightMeta: {
    fontSize: 10,
    marginTop: 1,
  },
  financeCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 12,
    marginBottom: 14,
  },
  financeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  financeTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  financeSub: {
    fontSize: 11,
    marginTop: 2,
  },
  financeIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  financeStatsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  financeBox: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    padding: 8,
    gap: 3,
  },
  financeBoxLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  financeBoxAmount: {
    fontSize: 12,
    fontWeight: '800',
  },
  financeBoxCount: {
    fontSize: 9,
    fontWeight: '500',
  },
});
