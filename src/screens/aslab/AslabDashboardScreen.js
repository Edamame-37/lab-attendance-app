/**
 * @file src/screens/aslab/AslabDashboardScreen.js
 * @description Layar Dashboard Keberlangsungan Laboratorium dan Keuangan Denda
 * untuk peran Asisten Laboratorium (Aslab) (SRS-FT-19).
 *
 * Menampilkan 6 blok informasi wajib dari spesifikasi Sprint 4:
 * 1. KPI Jumlah Laboratorium & Jumlah Praktikan.
 * 2. Status Kegiatan Praktikum pada Setiap Laboratorium (lokasi & waktu).
 * 3. Jadwal Praktikum yang Sedang Berlangsung & yang Akan Datang.
 * 4. Riwayat Kegiatan Laboratorium (terfilter Hari/Minggu/Bulan).
 * 5. Riwayat Keuangan Hasil Denda Praktikum (Total Lunas, Pending, Gagal & detail transaksi).
 * 6. Pintasan Cepat Aslab ke /lokasi-lab, /bulk-insert, dan /transfer-lab.
 *
 * @author Aufaarel Nabiil Aryadh Mecca (feature/aslab-dashboard-fines)
 * @srs SRS-FT-19
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { ScreenContainer } from '../../components/ScreenContainer';
import { SegmentedControl } from '../../components/common/SegmentedControl';
import {
  FineFinanceSummaryCard,
  KpiMetricsCard,
  LabStatusCard,
} from '../../components/aslab/LabActivitySummaryCard';
import { useApp } from '../../context/AppContext';
import { buildAslabDashboardMetrics } from '../../services/aslabDashboardService';
import { subscribeAllFines } from '../../services/fineService';
import { subscribeToSessions } from '../../services/firestoreService';
import { subscribeToLabs } from '../../services/labService';

const PERIOD_OPTIONS = [
  { value: 'hari', label: 'Hari Ini', iconName: 'today-outline' },
  { value: 'minggu', label: '7 Hari', iconName: 'calendar-outline' },
  { value: 'bulan', label: 'Bulan Ini', iconName: 'calendar' },
];

export default function AslabDashboardScreen() {
  const router = useRouter();
  const { tema } = useApp();

  const [period, setPeriod] = useState('hari');
  const [labs, setLabs] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [fines, setFines] = useState([]);

  const [loadingLabs, setLoadingLabs] = useState(true);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingFines, setLoadingFines] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 1. Real-time Subscription ke Labs, Sessions, Attendances, dan Fines
  useEffect(() => {
    const unsubLabs = subscribeToLabs(
      (data) => {
        setLabs(data || []);
        setLoadingLabs(false);
      },
      (err) => {
        console.warn('Gagal memuat labs dashboard:', err);
        setLoadingLabs(false);
      }
    );

    const unsubSessions = subscribeToSessions(
      (data) => {
        setSessions(data || []);
        setLoadingSessions(false);
      },
      (err) => {
        console.warn('Gagal memuat sessions dashboard:', err);
        setLoadingSessions(false);
      }
    );

    const unsubFines = subscribeAllFines(
      (data) => {
        setFines(data || []);
        setLoadingFines(false);
      },
      (err) => {
        console.warn('Gagal memuat fines dashboard:', err);
        setLoadingFines(false);
      }
    );

    const qAttendances = query(collection(db, 'attendances'));
    const unsubAttendances = onSnapshot(
      qAttendances,
      (snapshot) => {
        const list = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
        setAttendances(list);
      },
      (err) => {
        console.warn('Gagal memuat attendances dashboard:', err);
      }
    );

    return () => {
      unsubLabs();
      unsubSessions();
      unsubFines();
      unsubAttendances();
    };
  }, []);

  // 2. Kalkulasi Metrik Agregasi Berdasarkan Periode
  const metrics = useMemo(() => {
    return buildAslabDashboardMetrics({
      labs,
      sessions,
      attendances,
      fines,
      period,
      referenceDate: new Date(),
    });
  }, [labs, sessions, attendances, fines, period]);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  const isLoading = loadingLabs || loadingSessions || loadingFines;

  return (
    <ScreenContainer showHeader={false}>
      {/* Top Header Bar Dashboard Aslab */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={[styles.backBtn, { borderColor: tema.border, backgroundColor: tema.surface }]}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color={tema.textPrimary} />
        </TouchableOpacity>

        <View style={styles.topHeaderTitleCol}>
          <Text style={[styles.screenTitle, { color: tema.textPrimary }]}>
            Dashboard Aslab
          </Text>
          <Text style={[styles.screenSubtitle, { color: tema.textSecondary }]}>
            Monitoring Keberlangsungan Lab & Keuangan Denda (SRS-FT-19)
          </Text>
        </View>

        <View style={[styles.roleBadge, { backgroundColor: '#DBEAFE' }]}>
          <Ionicons name="shield-checkmark" size={13} color="#2563EB" />
          <Text style={styles.roleBadgeText}>ASLAB</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[tema.accent]} />}
      >
        {/* PINTASAN CEPAT ASLAB (BLOK 6 WAJIB) */}
        <View style={[styles.quickActionsCard, { backgroundColor: tema.surface, borderColor: tema.border }]}>
          <Text style={[styles.sectionHeading, { color: tema.textPrimary }]}>
            Pintasan Aksi Laboratorium
          </Text>
          <View style={styles.quickActionsRow}>
            <TouchableOpacity
              style={[styles.quickActionBtn, { backgroundColor: tema.accent }]}
              onPress={() => router.push('/lokasi-lab')}
              activeOpacity={0.8}
            >
              <Ionicons name="location-outline" size={16} color="#FFFFFF" />
              <Text style={styles.quickActionText}>Kelola Lab</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionBtn, { backgroundColor: '#2563EB' }]}
              onPress={() => router.push('/bulk-insert')}
              activeOpacity={0.8}
            >
              <Ionicons name="documents-outline" size={16} color="#FFFFFF" />
              <Text style={styles.quickActionText}>Bulk Insert</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionBtn, { backgroundColor: '#7C3AED' }]}
              onPress={() => router.push('/transfer-lab')}
              activeOpacity={0.8}
            >
              <Ionicons name="swap-horizontal-outline" size={16} color="#FFFFFF" />
              <Text style={styles.quickActionText}>Transfer Lab</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* FILTER WAKTU: HARI INI | MINGGU INI | BULAN INI */}
        <View style={styles.filterSection}>
          <Text style={[styles.filterLabel, { color: tema.textSecondary }]}>
            Filter Rentang Waktu Dashboard:
          </Text>
          <SegmentedControl
            options={PERIOD_OPTIONS}
            selectedValue={period}
            onSelect={(val) => setPeriod(val)}
          />
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={tema.accent} />
            <Text style={[styles.loadingText, { color: tema.textMuted }]}>
              Menghubungkan & mengakumulasi data Firestore...
            </Text>
          </View>
        ) : (
          <>
            {/* BLOK 1: KPI JUMLAH LABORATORIUM & PRAKTIKAN */}
            <KpiMetricsCard
              totalLabs={metrics.totalLabs}
              activeLabsCount={metrics.activeLabsCount}
              totalStudents={metrics.totalStudents}
              ongoingSessionsCount={metrics.ongoingSessions.length}
            />

            {/* BLOK 5: RIWAYAT KEUANGAN HASIL DENDA PRAKTIKUM */}
            <FineFinanceSummaryCard
              summary={metrics.fineFinanceSummary}
              period={period}
            />

            {/* DAFTAR TRANSAKSI DENDA TERFILTER PERIODE */}
            {metrics.fineHistory.length > 0 && (
              <View style={[styles.sectionCard, { backgroundColor: tema.surface, borderColor: tema.border }]}>
                <View style={styles.cardHeaderRow}>
                  <Text style={[styles.cardHeaderTitle, { color: tema.textPrimary }]}>
                    Daftar Tagihan Denda ({metrics.fineHistory.length})
                  </Text>
                  <Text style={[styles.cardHeaderBadge, { color: tema.textMuted }]}>
                    {period === 'hari' ? 'Hari Ini' : period === 'minggu' ? '7 Hari Terakhir' : 'Bulan Ini'}
                  </Text>
                </View>
                {metrics.fineHistory.map((item, idx) => {
                  const isSuccess = item.paymentStatus === 'success';
                  const isFailed = item.paymentStatus === 'failed';
                  const pillBg = isSuccess ? '#DCFCE7' : isFailed ? '#FEE2E2' : '#FEF3C7';
                  const pillColor = isSuccess ? '#16A34A' : isFailed ? '#DC2626' : '#D97706';

                  return (
                    <View
                      key={item.id || idx}
                      style={[
                        styles.transactionRow,
                        { borderBottomColor: tema.borderSubtle },
                        idx === metrics.fineHistory.length - 1 && { borderBottomWidth: 0 },
                      ]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.transStudentName, { color: tema.textPrimary }]}>
                          {item.studentName || 'Praktikan'}
                        </Text>
                        <Text style={[styles.transSessionMeta, { color: tema.textSecondary }]}>
                          {item.sessionName || 'Praktikum'} · Terlambat +{item.lateMinutes || 0} mnt
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end', gap: 4 }}>
                        <Text style={[styles.transAmount, { color: tema.textPrimary }]}>
                          Rp {Number(item.amount || 0).toLocaleString('id-ID')}
                        </Text>
                        <View style={[styles.transPill, { backgroundColor: pillBg }]}>
                          <Text style={[styles.transPillText, { color: pillColor }]}>
                            {String(item.paymentStatus || 'pending').toUpperCase()}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* BLOK 2: STATUS KEGIATAN PRAKTIKUM SETIAP LABORATORIUM */}
            <View style={styles.sectionWrap}>
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionHeading, { color: tema.textPrimary }]}>
                  Status Kegiatan Laboratorium ({metrics.labStatuses.length})
                </Text>
                <TouchableOpacity onPress={() => router.push('/lokasi-lab')}>
                  <Text style={[styles.sectionActionText, { color: tema.accent }]}>
                    Kelola
                  </Text>
                </TouchableOpacity>
              </View>

              {metrics.labStatuses.length === 0 ? (
                <View style={[styles.emptyCard, { backgroundColor: tema.surface, borderColor: tema.border }]}>
                  <Ionicons name="business-outline" size={32} color={tema.textMuted} />
                  <Text style={[styles.emptyCardTitle, { color: tema.textPrimary }]}>
                    Belum Ada Laboratorium
                  </Text>
                  <Text style={[styles.emptyCardSub, { color: tema.textSecondary }]}>
                    Buat laboratorium pertama melalui menu Kelola Lab atau Bulk Insert.
                  </Text>
                </View>
              ) : (
                metrics.labStatuses.map((lab) => (
                  <LabStatusCard
                    key={lab.id}
                    lab={lab}
                    onPress={() => router.push('/lokasi-lab')}
                  />
                ))
              )}
            </View>

            {/* BLOK 3: JADWAL PRAKTIKUM BERLANGSUNG & AKAN DATANG */}
            <View style={styles.sectionWrap}>
              <Text style={[styles.sectionHeading, { color: tema.textPrimary }]}>
                Jadwal Praktikum Aktif & Mendatang
              </Text>

              {metrics.ongoingSessions.length === 0 && metrics.upcomingSessions.length === 0 ? (
                <View style={[styles.emptyCard, { backgroundColor: tema.surface, borderColor: tema.border }]}>
                  <Ionicons name="calendar-outline" size={28} color={tema.textMuted} />
                  <Text style={[styles.emptyCardTitle, { color: tema.textPrimary }]}>
                    Tidak Ada Jadwal Berlangsung
                  </Text>
                  <Text style={[styles.emptyCardSub, { color: tema.textSecondary }]}>
                    Belum ada sesi praktikum yang dibuka atau dijadwalkan saat ini.
                  </Text>
                </View>
              ) : (
                <>
                  {metrics.ongoingSessions.map((session) => (
                    <View
                      key={session.id}
                      style={[styles.activeSessionCard, { backgroundColor: tema.surface, borderColor: '#10B981' }]}
                    >
                      <View style={styles.activeSessionBadge}>
                        <View style={styles.livePulse} />
                        <Text style={styles.activeSessionBadgeText}>SEDANG BERLANGSUNG</Text>
                      </View>
                      <Text style={[styles.activeSessionTitle, { color: tema.textPrimary }]}>
                        {session.namaPraktikum}
                      </Text>
                      <Text style={[styles.activeSessionSub, { color: tema.textSecondary }]}>
                        {session.ruangLab} · {session.kelas} · {session.hari}, {session.jamMulai} - {session.jamSelesai} WIB
                      </Text>
                    </View>
                  ))}

                  {metrics.upcomingSessions.map((session) => (
                    <View
                      key={session.id}
                      style={[styles.upcomingSessionCard, { backgroundColor: tema.surface, borderColor: tema.border }]}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={[styles.upcomingSessionTitle, { color: tema.textPrimary }]}>
                          {session.namaPraktikum}
                        </Text>
                        <View style={[styles.scheduledPill, { backgroundColor: '#FEF3C7' }]}>
                          <Text style={styles.scheduledPillText}>TERJADWAL</Text>
                        </View>
                      </View>
                      <Text style={[styles.upcomingSessionSub, { color: tema.textSecondary }]}>
                        {session.ruangLab} · {session.kelas} · {session.hari}, {session.jamMulai} - {session.jamSelesai} WIB
                      </Text>
                    </View>
                  ))}
                </>
              )}
            </View>

            {/* BLOK 4: RIWAYAT KEGIATAN LABORATORIUM (SELESAI) */}
            <View style={styles.sectionWrap}>
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionHeading, { color: tema.textPrimary }]}>
                  Riwayat Kegiatan Laboratorium ({metrics.activityHistory.length})
                </Text>
                <Text style={[styles.periodIndicator, { color: tema.textMuted }]}>
                  {period === 'hari' ? 'Hari Ini' : period === 'minggu' ? '7 Hari Terakhir' : 'Bulan Ini'}
                </Text>
              </View>

              {metrics.activityHistory.length === 0 ? (
                <View style={[styles.emptyCard, { backgroundColor: tema.surface, borderColor: tema.border }]}>
                  <Ionicons name="time-outline" size={28} color={tema.textMuted} />
                  <Text style={[styles.emptyCardTitle, { color: tema.textPrimary }]}>
                    Belum Ada Riwayat Kegiatan Selesai
                  </Text>
                  <Text style={[styles.emptyCardSub, { color: tema.textSecondary }]}>
                    Praktikum yang telah selesai pada rentang waktu terpilih akan muncul di sini.
                  </Text>
                </View>
              ) : (
                metrics.activityHistory.map((session) => (
                  <View
                    key={session.id}
                    style={[styles.historyCard, { backgroundColor: tema.surface, borderColor: tema.border }]}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.historyTitle, { color: tema.textPrimary }]}>
                          {session.namaPraktikum}
                        </Text>
                        <Text style={[styles.historySub, { color: tema.textSecondary }]}>
                          {session.ruangLab} · Kelas {session.kelas}
                        </Text>
                      </View>
                      <View style={[styles.completedBadge, { backgroundColor: '#E0E7FF' }]}>
                        <Text style={styles.completedBadgeText}>SELESAI</Text>
                      </View>
                    </View>
                    <View style={[styles.historyFooter, { borderTopColor: tema.borderSubtle }]}>
                      <Text style={[styles.historyFooterText, { color: tema.textMuted }]}>
                        Asisten: {session.namaAsisten || 'Asprak'}
                      </Text>
                      <Text style={[styles.historyFooterText, { color: tema.textMuted }]}>
                        {session.hari}, {session.jamMulai} - {session.jamSelesai} WIB
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topHeaderTitleCol: {
    flex: 1,
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  screenSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1E40AF',
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingBottom: 40,
    gap: 12,
  },
  quickActionsCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '800',
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  quickActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  filterSection: {
    gap: 6,
  },
  filterLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
  },
  sectionWrap: {
    gap: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionActionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  periodIndicator: {
    fontSize: 11,
  },
  emptyCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  emptyCardTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  emptyCardSub: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
  activeSessionCard: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  activeSessionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  livePulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  activeSessionBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },
  activeSessionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  activeSessionSub: {
    fontSize: 11,
  },
  upcomingSessionCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  upcomingSessionTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  upcomingSessionSub: {
    fontSize: 11,
  },
  scheduledPill: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  scheduledPillText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#D97706',
  },
  historyCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  historyTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  historySub: {
    fontSize: 11,
  },
  completedBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  completedBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#4338CA',
  },
  historyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 6,
  },
  historyFooterText: {
    fontSize: 10,
  },
  sectionCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 8,
    marginBottom: 10,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardHeaderTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  cardHeaderBadge: {
    fontSize: 11,
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    gap: 8,
  },
  transStudentName: {
    fontSize: 13,
    fontWeight: '600',
  },
  transSessionMeta: {
    fontSize: 11,
    marginTop: 2,
  },
  transAmount: {
    fontSize: 12,
    fontWeight: '700',
  },
  transPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  transPillText: {
    fontSize: 9,
    fontWeight: '700',
  },
});
