/**
 * @file tests/fineCalculation.test.js
 * @description Unit tests untuk evaluasi keterlambatan, toleransi grace period,
 * agregasi finansial denda, dan aturan bisnis Sprint 4 (SRS-FT-19, SRS-FT-21).
 *
 * @author Aufaarel Nabiil Aryadh Mecca (feature/aslab-dashboard-fines)
 */

import {
  evaluateAttendanceLateness,
  summarizeFineFinances,
  toTimestampMillis,
} from '../src/services/fineService';
import {
  filterByPeriod,
  buildAslabDashboardMetrics,
} from '../src/services/aslabDashboardService';

describe('SRS-FT-21: Evaluasi Keterlambatan Presensi & Grace Period', () => {
  const baseStartTime = new Date('2026-10-21T08:00:00.000Z').getTime();

  test('1. Presensi sebelum batas grace period dicatat tepat waktu (ON_TIME)', () => {
    // Sesi mulai 08:00, grace period 15 menit (deadline 08:15). Presensi 08:05.
    const attendanceTime = baseStartTime + 5 * 60_000;
    const result = evaluateAttendanceLateness({
      attendanceTime,
      sessionStartTime: baseStartTime,
      gracePeriodMinutes: 15,
    });

    expect(result.isLate).toBe(false);
    expect(result.lateMinutes).toBe(0);
    expect(result.attendancePunctuality).toBe('ON_TIME');
  });

  test('2. Presensi TEPAT pada batas akhir grace period wajib dianggap tepat waktu', () => {
    // Sesi mulai 08:00, grace period 15 menit (deadline 08:15:00.000). Presensi tepat 08:15:00.000.
    const exactDeadlineTime = baseStartTime + 15 * 60_000;
    const result = evaluateAttendanceLateness({
      attendanceTime: exactDeadlineTime,
      sessionStartTime: baseStartTime,
      gracePeriodMinutes: 15,
    });

    expect(result.isLate).toBe(false);
    expect(result.lateMinutes).toBe(0);
    expect(result.attendancePunctuality).toBe('ON_TIME');
  });

  test('3. Presensi lewat 1 menit dari batas grace period dicatat terlambat (LATE)', () => {
    // Sesi mulai 08:00, grace period 15 menit (deadline 08:15). Presensi 08:16 (terlambat 1 menit).
    const lateTime = baseStartTime + 16 * 60_000;
    const result = evaluateAttendanceLateness({
      attendanceTime: lateTime,
      sessionStartTime: baseStartTime,
      gracePeriodMinutes: 15,
    });

    expect(result.isLate).toBe(true);
    expect(result.lateMinutes).toBe(1);
    expect(result.attendancePunctuality).toBe('LATE');
  });

  test('4. Durasi grace period kustom (misal 10 menit vs 30 menit) dievaluasi akurat', () => {
    // Grace period 10 menit: presensi di menit 12 -> terlambat 2 menit
    const resGrace10 = evaluateAttendanceLateness({
      attendanceTime: baseStartTime + 12 * 60_000,
      sessionStartTime: baseStartTime,
      gracePeriodMinutes: 10,
    });
    expect(resGrace10.isLate).toBe(true);
    expect(resGrace10.lateMinutes).toBe(2);

    // Grace period 30 menit: presensi di menit 25 -> masih tepat waktu
    const resGrace30 = evaluateAttendanceLateness({
      attendanceTime: baseStartTime + 25 * 60_000,
      sessionStartTime: baseStartTime,
      gracePeriodMinutes: 30,
    });
    expect(resGrace30.isLate).toBe(false);
    expect(resGrace30.lateMinutes).toBe(0);
  });

  test('5. Helper toTimestampMillis menangani berbagai format waktu dengan aman', () => {
    const nowMs = 1729500000000;
    const nowDate = new Date(nowMs);
    const mockTimestamp = { toMillis: () => nowMs };

    expect(toTimestampMillis(nowMs)).toBe(nowMs);
    expect(toTimestampMillis(nowDate)).toBe(nowMs);
    expect(toTimestampMillis(mockTimestamp)).toBe(nowMs);
  });
});

describe('SRS-FT-19: Agregasi Finansial Denda (summarizeFineFinances)', () => {
  test('6. Menghitung ringkasan status lunas (success), menunggu (pending), dan gagal (failed)', () => {
    const mockFines = [
      { id: 'fine-1', amount: 10000, paymentStatus: 'success' },
      { id: 'fine-2', amount: 10000, paymentStatus: 'paid' },
      { id: 'fine-3', amount: 15000, paymentStatus: 'pending' },
      { id: 'fine-4', amount: 10000, paymentStatus: 'pending' },
      { id: 'fine-5', amount: 10000, paymentStatus: 'failed' },
      { id: 'fine-6', amount: 10000, paymentStatus: 'expired' },
    ];

    const summary = summarizeFineFinances(mockFines);

    expect(summary.totalFinesCount).toBe(6);
    expect(summary.paidCount).toBe(2);
    expect(summary.totalCollectedAmount).toBe(20000);
    expect(summary.pendingCount).toBe(2);
    expect(summary.totalPendingAmount).toBe(25000);
    expect(summary.failedCount).toBe(2);
    expect(summary.totalFailedAmount).toBe(20000);
  });

  test('7. Menangani array denda kosong dengan default nilai nol', () => {
    const summary = summarizeFineFinances([]);

    expect(summary.totalFinesCount).toBe(0);
    expect(summary.totalCollectedAmount).toBe(0);
    expect(summary.totalPendingAmount).toBe(0);
    expect(summary.totalFailedAmount).toBe(0);
  });
});

describe('SRS-FT-19: Layanan Dashboard Aslab (aslabDashboardService)', () => {
  const refDate = new Date('2026-10-25T10:00:00.000Z');

  const mockItems = [
    // Hari ini (25 Okt)
    { id: '1', timestamp: new Date('2026-10-25T08:30:00.000Z').getTime() },
    // 3 hari lalu (22 Okt)
    { id: '2', timestamp: new Date('2026-10-22T09:00:00.000Z').getTime() },
    // 10 hari lalu (15 Okt - bulan sama, tapi di luar 7 hari)
    { id: '3', timestamp: new Date('2026-10-15T10:00:00.000Z').getTime() },
    // Bulan lalu (25 Sep)
    { id: '4', timestamp: new Date('2026-09-25T10:00:00.000Z').getTime() },
  ];

  test('8. filterByPeriod memfilter rentang waktu hari, minggu, dan bulan dengan tepat', () => {
    const daily = filterByPeriod(mockItems, 'hari', (i) => i.timestamp, refDate);
    expect(daily.map((i) => i.id)).toEqual(['1']);

    const weekly = filterByPeriod(mockItems, 'minggu', (i) => i.timestamp, refDate);
    expect(weekly.map((i) => i.id)).toEqual(['1', '2']);

    const monthly = filterByPeriod(mockItems, 'bulan', (i) => i.timestamp, refDate);
    expect(monthly.map((i) => i.id)).toEqual(['1', '2', '3']);
  });

  test('9. buildAslabDashboardMetrics menghasilkan KPI lab, mahasiswa unik, dan status kegiatan per lab', () => {
    const mockLabs = [
      {
        id: 'lab-1',
        name: 'Lab RPL 1',
        code: 'RPL-01',
        isActive: true,
        studentMembers: [
          { uid: 'mhs-1', nama: 'Ahmad' },
          { uid: 'mhs-2', nama: 'Budi' },
        ],
      },
      {
        id: 'lab-2',
        name: 'Lab Jaringan',
        code: 'JK-01',
        isActive: true,
        studentMembers: [
          { uid: 'mhs-2', nama: 'Budi' }, // Duplikat mahasiswa di 2 lab
          { uid: 'mhs-3', nama: 'Citra' },
        ],
      },
    ];

    const mockSessions = [
      {
        id: 'sesi-1',
        labId: 'lab-1',
        status: 'open',
        statusSesi: 'DIBUKA',
        namaPraktikum: 'Praktikum PPK',
      },
      {
        id: 'sesi-2',
        labId: 'lab-2',
        status: 'closed',
        statusSesi: 'DITUTUP',
        namaPraktikum: 'Praktikum Jarkom',
      },
    ];

    const metrics = buildAslabDashboardMetrics({
      labs: mockLabs,
      sessions: mockSessions,
      attendances: [],
      fines: [],
      period: 'hari',
      referenceDate: refDate,
    });

    expect(metrics.totalLabs).toBe(2);
    expect(metrics.activeLabsCount).toBe(2);
    // Mahasiswa unik (mhs-1, mhs-2, mhs-3) = 3 orang
    expect(metrics.totalStudents).toBe(3);

    // Status lab-1: BERLANGSUNG karena sesi-1 berstatus open
    const lab1Status = metrics.labStatuses.find((l) => l.id === 'lab-1');
    expect(lab1Status.statusKegiatan).toBe('BERLANGSUNG');

    // Status lab-2: TERJADWAL karena sesi-2 berstatus DITUTUP
    const lab2Status = metrics.labStatuses.find((l) => l.id === 'lab-2');
    expect(lab2Status.statusKegiatan).toBe('TERJADWAL');

    expect(metrics.ongoingSessions.length).toBe(1);
    expect(metrics.upcomingSessions.length).toBe(1);
  });
});
