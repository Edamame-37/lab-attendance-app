/**
 * @file src/services/aslabDashboardService.js
 * @description Layanan kalkulasi & agregasi metrik Dashboard Keberlangsungan Laboratorium
 * dan Riwayat Keuangan Denda untuk peran Asisten Laboratorium (Aslab) (SRS-FT-19).
 *
 * @author Aufaarel Nabiil Aryadh Mecca (feature/aslab-dashboard-fines)
 * @srs SRS-FT-19
 */

import { summarizeFineFinances, toTimestampMillis } from './fineService.js';

/**
 * Filter murni koleksi item berdasarkan periode ('hari' | 'minggu' | 'bulan').
 *
 * @template T
 * @param {Array<T>} items - Daftar item yang akan difilter
 * @param {'hari'|'minggu'|'bulan'|string} period - Periode waktu
 * @param {(item: T) => any} dateExtractor - Fungsi pengambil nilai tanggal/timestamp
 * @param {Date|number} [referenceDate=new Date()] - Waktu acuan pengujian/saat ini
 * @returns {Array<T>} Item yang lolos filter
 */
export const filterByPeriod = (
  items = [],
  period = 'hari',
  dateExtractor = (item) => item?.createdAt || item?.timestamp || item?.waktuBuka || item?.waktuTutup,
  referenceDate = new Date()
) => {
  if (!Array.isArray(items)) return [];

  const refTime = referenceDate instanceof Date ? referenceDate : new Date(referenceDate);
  const refYear = refTime.getFullYear();
  const refMonth = refTime.getMonth();
  const refDate = refTime.getDate();

  return items.filter((item) => {
    const rawVal = dateExtractor(item);
    if (!rawVal) return false;

    const itemMs = toTimestampMillis(rawVal);
    const itemDate = new Date(itemMs);

    if (period === 'hari') {
      return (
        itemDate.getFullYear() === refYear &&
        itemDate.getMonth() === refMonth &&
        itemDate.getDate() === refDate
      );
    }

    if (period === 'minggu') {
      // 7 hari terakhir inklusif (dari refTime mundur 7 hari sampai akhir hari refTime)
      const sevenDaysAgoMs = new Date(refYear, refMonth, refDate - 6, 0, 0, 0, 0).getTime();
      const endOfTodayMs = new Date(refYear, refMonth, refDate, 23, 59, 59, 999).getTime();
      return itemMs >= sevenDaysAgoMs && itemMs <= endOfTodayMs;
    }

    if (period === 'bulan') {
      return (
        itemDate.getFullYear() === refYear &&
        itemDate.getMonth() === refMonth
      );
    }

    // Default jika periode tidak spesifik: tampilkan semua
    return true;
  });
};

/**
 * Agregator utama metrik Dashboard Aslab (SRS-FT-19).
 *
 * Menggabungkan data dari koleksi labs, sessions, attendances, dan fines
 * untuk menghasilkan ringkasan 6 blok informasi wajib dashboard.
 *
 * @param {Object} params
 * @param {Array<Object>} [params.labs=[]] - Daftar laboratorium
 * @param {Array<Object>} [params.sessions=[]] - Daftar sesi praktikum
 * @param {Array<Object>} [params.attendances=[]] - Catatan presensi
 * @param {Array<Object>} [params.fines=[]] - Daftar tagihan denda
 * @param {'hari'|'minggu'|'bulan'|string} [params.period='hari'] - Periode aktif
 * @param {Date|number} [params.referenceDate=new Date()] - Waktu acuan
 * @returns {Object} Hasil agregasi metrik dashboard
 */
export const buildAslabDashboardMetrics = ({
  labs = [],
  sessions = [],
  attendances = [],
  fines = [],
  period = 'hari',
  referenceDate = new Date(),
} = {}) => {
  const safeLabs = Array.isArray(labs) ? labs : [];
  const safeSessions = Array.isArray(sessions) ? sessions : [];
  const safeAttendances = Array.isArray(attendances) ? attendances : [];
  const safeFines = Array.isArray(fines) ? fines : [];

  // 1. KPI Jumlah Laboratorium & Jumlah Praktikan Terdaftar Unik
  const totalLabs = safeLabs.length;
  const activeLabsCount = safeLabs.filter((lab) => lab.isActive !== false).length;

  const uniqueStudentIdentifiers = new Set();
  safeLabs.forEach((lab) => {
    // Kumpulkan dari studentMembers (array objek ringkas)
    if (Array.isArray(lab.studentMembers)) {
      lab.studentMembers.forEach((member) => {
        const id = member?.uid || member?.studentId || member?.nomorInduk || member?.nim;
        if (id) uniqueStudentIdentifiers.add(String(id));
      });
    }
    // Kumpulkan juga dari studentIds
    if (Array.isArray(lab.studentIds)) {
      lab.studentIds.forEach((studentId) => {
        if (studentId) uniqueStudentIdentifiers.add(String(studentId));
      });
    }
  });

  // Jika di labs belum ada data mahasiswa, fallback ke peserta sesi atau attendances
  if (uniqueStudentIdentifiers.size === 0) {
    safeSessions.forEach((s) => {
      if (Array.isArray(s.daftarPeserta)) {
        s.daftarPeserta.forEach((p) => {
          if (p?.nim || p?.uid) uniqueStudentIdentifiers.add(String(p.nim || p.uid));
        });
      }
    });
    safeAttendances.forEach((att) => {
      const id = att?.studentId || att?.praktikanId || att?.studentNim;
      if (id) uniqueStudentIdentifiers.add(String(id));
    });
  }
  const totalStudents = uniqueStudentIdentifiers.size;

  // 2. Status Kegiatan Praktikum pada Setiap Laboratorium (BERLANGSUNG, TERJADWAL, IDLE)
  const labStatuses = safeLabs.map((lab) => {
    const labSessions = safeSessions.filter((s) => s.labId === lab.id);

    // Cari sesi yang sedang berlangsung (open / DIBUKA)
    const ongoingSession = labSessions.find(
      (s) => s.status === 'open' || s.statusSesi === 'DIBUKA'
    );

    // Cari sesi mendatang (closed / DITUTUP)
    const upcomingSession = labSessions.find(
      (s) => s.status === 'closed' && s.statusSesi === 'DITUTUP'
    );

    let statusKegiatan = 'IDLE';
    if (ongoingSession) {
      statusKegiatan = 'BERLANGSUNG';
    } else if (upcomingSession) {
      statusKegiatan = 'TERJADWAL';
    }

    // Hitung jumlah praktikan lab
    const studentCount =
      lab.studentMembers?.length ||
      lab.studentIds?.length ||
      0;

    return {
      id: lab.id,
      name: lab.name || 'Laboratorium',
      code: lab.code || '-',
      courseCode: lab.courseCode || '-',
      courseName: lab.courseName || '-',
      address: lab.address || '-',
      location: lab.location || null,
      radiusMeters: Number(lab.radiusMeters ?? 50),
      gracePeriodMinutes: Number(lab.gracePeriodMinutes ?? 15),
      lateFineAmount: Number(lab.lateFineAmount ?? 10000),
      isActive: lab.isActive !== false,
      statusKegiatan,
      studentCount,
      currentSession: ongoingSession || upcomingSession || null,
    };
  });

  // 3. Jadwal Praktikum Sedang Berlangsung & Akan Datang
  const ongoingSessions = safeSessions.filter(
    (s) => s.status === 'open' || s.statusSesi === 'DIBUKA'
  );

  const upcomingSessions = safeSessions.filter(
    (s) => s.statusSesi === 'DITUTUP' && s.status !== 'open'
  );

  // 4. Riwayat Kegiatan Praktikum Selesai (Terfilter Periode Waktu)
  const completedSessions = safeSessions.filter(
    (s) => s.statusSesi === 'SELESAI' || (!s.statusSesi && s.status === 'closed' && s.waktuTutup)
  );

  const activityHistory = filterByPeriod(
    completedSessions,
    period,
    (s) => s.waktuTutup || s.updatedAt || s.tanggalAktif || s.createdAt,
    referenceDate
  );

  // 5. Riwayat Keuangan Hasil Denda Praktikum (Terfilter Periode Waktu)
  const fineHistory = filterByPeriod(
    safeFines,
    period,
    (f) => f.paidAt || f.createdAt || f.updatedAt,
    referenceDate
  );

  const fineFinanceSummary = summarizeFineFinances(fineHistory);

  return {
    totalLabs,
    activeLabsCount,
    totalStudents,
    labStatuses,
    ongoingSessions,
    upcomingSessions,
    activityHistory,
    fineFinanceSummary,
    fineHistory,
    totalFinesAllTime: summarizeFineFinances(safeFines),
  };
};
