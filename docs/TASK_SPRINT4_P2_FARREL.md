# Panduan Kerja Teknis Sprint 4 — Programmer 2 (Aufaarel Nabiil Aryadh Mecca)

* **PIC:** Aufaarel Nabiil Aryadh Mecca (`24060124140206`)
* **Branch Git:** `feature/aslab-dashboard-fines`
* **Cakupan SRS:** `SRS-FT-19`, `SRS-FT-20`, `SRS-FT-21`
* **Dokumen Kontrak Utama:** [PRAKMOBILE4.md](../PRAKMOBILE4.md)
* **Urutan Merge:** **Gelombang 2 (Setelah PR P1 Azlan di-merge ke `main`)**

---

## 1. Strict Scope — Kepemilikan File Eksklusif (0% Merge Conflict)

Kamu **HANYA** boleh memodifikasi/membuat **10 berkas** berikut. Jangan menyentuh file milik P1 (`src/types/index.ts`, `src/domain/auth.ts`, `labService.js`, `firestore.rules`, dll.) maupun P3 (`backend/`, `paymentService.js`, `notificationService.js`, `src/app/_layout.tsx`, `src/app/(tabs)/*`), dan **jangan mengubah `package.json` / `package-lock.json`**.

```text
[NEW]    src/services/fineService.js
[NEW]    src/services/aslabDashboardService.js
[NEW]    src/components/aslab/LabActivitySummaryCard.js
[NEW]    src/screens/aslab/AslabDashboardScreen.js
[NEW]    src/app/dashboard-aslab.tsx
[MODIFY] src/services/firestoreService.js
[MODIFY] src/app/sesi.tsx
[MODIFY] src/screens/praktikan/AttendanceCheckScreen.js
[MODIFY] src/screens/asisten/LeaveReviewScreen.js
[NEW]    tests/fineCalculation.test.js
```

---

## 2. Persiapan Awal Git

```bash
git checkout main
git pull origin main
npm install
git checkout -b feature/aslab-dashboard-fines
```
*(Catatan: Setelah P1 Azlan selesai merge ke `main`, lakukan `git pull origin main` pada branch kamu sebelum membuka PR agar teruji langsung dengan tipe `'aslab'` dan `labService.js` terbaru tanpa conflict).*

---

## 3. Rincian Tugas & Panduan Implementasi

### A. Engine Perhitungan Keterlambatan (Grace Period) & Pengelolaan Denda (`SRS-FT-21`)
Buat **`src/services/fineService.js`**:
1. **Fungsi Pure Calculation `evaluateAttendanceLateness({ attendanceTime, sessionStartTime, gracePeriodMinutes })`**:
   - Menerima `attendanceTime` (`Date | number | Timestamp`), `sessionStartTime` (`Date | number | Timestamp` — dari `session.waktuBuka` atau kombinasi tanggal + `session.jamMulai`), dan `gracePeriodMinutes` (number, default `15`).
   - Rumus wajib sesuai soal Sprint 4:
     - `deadlineMs = startMs + gracePeriodMinutes * 60_000`
     - Jika `attendanceMs <= deadlineMs`:
       → `{ isLate: false, lateMinutes: 0, attendancePunctuality: 'ON_TIME' }`
     - Jika `attendanceMs > deadlineMs`:
       → `lateMinutes = Math.max(1, Math.ceil((attendanceMs - deadlineMs) / 60_000))`
       → `{ isLate: true, lateMinutes, attendancePunctuality: 'LATE' }`
   - *Penting*: Presensi **tepat pada akhir masa toleransi (`attendanceMs === deadlineMs`)** wajib dianggap **tepat waktu** (`isLate: false`).
2. **Fungsi Idempoten `createLateFineIfNeeded({ session, attendanceId, student, latenessResult })`**:
   - Jika `!latenessResult.isLate`, kembalikan `{ created: false, fine: null }`.
   - Jika terlambat:
     - Gunakan **Deterministic Document ID**: `fineId = `${session.id}_${student.studentId}`` pada koleksi **`fines`**.
     - Cek terlebih dahulu dengan `getDoc(doc(db, 'fines', fineId))` — jika dokumen sudah ada, jangan membuat duplikat (`{ created: false, id: fineId, alreadyExists: true }`).
     - Cek apakah praktikan memiliki izin `approved` pada `leave_requests/${session.id}_${student.studentId}` — jika ya, **dibebaskan dari denda** (`{ created: false, excused: true }`).
     - Simpan dokumen baru dengan `setDoc` menggunakan skema persis dari [PRAKMOBILE4.md](../PRAKMOBILE4.md#44-koleksi-finessessionid_studentid-deterministic-id):
       - `id: fineId`
       - `attendanceId`
       - `sessionId`, `sessionName`, `labId`, `labName`
       - `studentId`, `studentName`, `studentNim`, `studentClass`
       - `lateMinutes`, `gracePeriodMinutes`
       - `amount`: `Number(session.lateFineAmount ?? 10000)` *(nominal tetap per keterlambatan)*
       - `paymentStatus: 'pending'`
       - `latestOrderId: null`, `latestInvoiceId: null`, `latestInvoiceUrl: null`, `paidAt: null`
       - `createdAt: serverTimestamp()`, `updatedAt: serverTimestamp()`
3. **Real-time Listeners & Agregasi Denda**:
   - `subscribeStudentFines(studentId, onUpdate, onError)`: listener `onSnapshot` pada `fines` dengan `where('studentId', '==', studentId)` (sort descending di client berdasarkan `createdAt` agar bebas masalah composite index!).
   - `subscribeAllFines(onUpdate, onError)`: listener `onSnapshot` seluruh dokumen `fines` untuk Dashboard Keuangan Aslab.
   - `summarizeFineFinances(fines)`: mengembalikan `{ totalFinesCount, totalCollectedAmount, totalPendingAmount, totalFailedAmount, paidCount, pendingCount, failedCount }`.

---

### B. Integrasi Keterlambatan di Presensi & Pengelolaan Sesi Terfokus Asprak (`SRS-FT-20` & `SRS-FT-21`)
1. **`src/services/firestoreService.js`**:
   - Pada **`createSession(sessionData)`**:
     - Ambil konfigurasi dari `selectedLab`: simpan `gracePeriodMinutes: Number(sessionData.gracePeriodMinutes ?? selectedLab.gracePeriodMinutes ?? 15)` dan `lateFineAmount: Number(sessionData.lateFineAmount ?? selectedLab.lateFineAmount ?? 10000)` pada payload dokumen `sessions`.
   - Tambahkan helper **`filterSessionsForAsprak(sessions, labs, asprakUid)`**:
     - Memfilter daftar sesi agar Asprak hanya melihat & mengelola sesi pada lab di mana `lab.asprakIds` mengandung `asprakUid` atau `session.asistenId === asprakUid` (dengan fallback aman jika lab belum di-assign agar data lama tetap bisa dites).
   - Pada **`submitAttendance(...)`**:
     - Tentukan `sessionStartTime` dari `sessionData.waktuBuka` (fallback ke `jamMulai` hari ini jika `waktuBuka` null).
     - Panggil `evaluateAttendanceLateness({ attendanceTime: now, sessionStartTime, gracePeriodMinutes: sessionData.gracePeriodMinutes ?? labData.gracePeriodMinutes ?? 15 })`.
     - Simpan field baru ke dokumen `attendances/${sessionId}_${studentId}`:
       - `isLate: lateness.isLate`
       - `lateMinutes: lateness.lateMinutes`
       - `attendancePunctuality: lateness.attendancePunctuality`
       - `statusKehadiran: 'HADIR'` *(tetap `HADIR`, tidak diubah oleh pembayaran denda!)*
     - Jika `lateness.isLate === true`, panggil `createLateFineIfNeeded(...)` dan sertakan `{ isLate, lateMinutes, fineCreated, fineAmount }` pada objek return `submitAttendance`.
2. **`src/app/sesi.tsx`**:
   - Fokuskan tampilan Asprak hanya pada kelas/lab yang menjadi tanggung jawabnya (tampilkan label lab tanggung jawab Asprak; jangan tampilkan tombol edit/konfigurasi seluruh lab).
   - Saat Asprak membuat/membuka sesi, tampilkan info **Grace Period** dan **Nominal Denda** yang berlaku dari konfigurasi lab (read-only/informasi kebijakan praktikum).
   - Pada rekap sesi, tampilkan badge **TEPAT WAKTU** (hijau) atau **TERLAMBAT (+X mnt)** (amber/merah) pada tiap baris presensi.
3. **`src/screens/praktikan/AttendanceCheckScreen.js`**:
   - Tampilkan kartu informasi kebijakan keterlambatan sesi aktif: *"Batas toleransi: X menit sejak sesi dibuka · Denda keterlambatan: Rp Y"*.
   - Setelah presensi berhasil:
     - Jika **Tepat Waktu**: tampilkan umpan balik hijau *"Presensi tercatat tepat waktu"*.
     - Jika **Terlambat**: tampilkan umpan balik peringatan jelas *"Presensi tercatat terlambat (+X menit). Tagihan denda sebesar Rp Y telah dibuat. Pembayaran denda tidak mengubah status kehadiran Anda."* + tombol pintasan ke `/tagihan-denda`.
4. **`src/screens/asisten/LeaveReviewScreen.js`**:
   - Pastikan saat Asprak meninjau dan menyetujui (`approved`) pengajuan izin, UI menampilkan keterangan eksplisit: **"Tidak Hadir dengan Izin (Excused Absence) — Bebas denda keterlambatan & tidak mengubah status kehadiran menjadi hadir"**.
   - Pastikan alur review izin **tidak** membuat/memodifikasi dokumen `attendances` menjadi `HADIR` dan **tidak** membuat dokumen `fines`.

---

### C. Dashboard Keberlangsungan Laboratorium Aslab (`SRS-FT-19`)
1. **`src/services/aslabDashboardService.js`**:
   - Buat fungsi murni `filterByPeriod(items, period, dateExtractor, referenceDate = new Date())` untuk filter **`'hari' | 'minggu' | 'bulan'`**:
     - `'hari'`: tanggal sama dengan hari ini (lokal).
     - `'minggu'`: 7 hari terakhir / pekan berjalan.
     - `'bulan'`: bulan & tahun yang sama dengan bulan berjalan.
   - Buat fungsi agregator `buildAslabDashboardMetrics({ labs, sessions, attendances, fines, period })` yang menghasilkan:
     - `totalLabs`, `activeLabsCount`, `totalStudents` (gabungan unik dari `studentMembers` / `studentIds` seluruh lab).
     - `labStatuses`: daftar per lab berisi nama lab, mata kuliah, lokasi/radius, grace period, denda, jumlah praktikan, dan status kegiatan (`BERLANGSUNG` jika ada sesi `open`, `TERJADWAL` jika ada sesi `DITUTUP`, `IDLE` jika tidak ada sesi aktif).
     - `ongoingSessions`: jadwal praktikum yang sedang berlangsung (`status === 'open'`).
     - `upcomingSessions`: jadwal praktikum yang akan datang (`statusSesi === 'DITUTUP'`).
     - `activityHistory`: riwayat kegiatan laboratorium yang sudah selesai (`statusSesi === 'SELESAI'`) sesuai filter `hari` / `minggu` / `bulan`.
     - `fineFinanceSummary` & `fineHistory`: riwayat keuangan hasil denda praktikum (total terkumpul dari status `success`, total `pending`, total `failed`, dan daftar transaksi denda terfilter sesuai periode `hari` / `minggu` / `bulan`).
2. **`src/components/aslab/LabActivitySummaryCard.js`**:
   - Komponen reusable dengan tema `useApp().tema` (light/dark mode) tanpa emoji (pakai `Ionicons`) untuk menampilkan kartu ringkasan KPI lab, praktikan, status per lab, dan ringkasan finansial denda.
3. **`src/screens/aslab/AslabDashboardScreen.js` & `src/app/dashboard-aslab.tsx`**:
   - Real-time subscription ke `subscribeToLabs`, `subscribeToSessions`, dan `subscribeAllFines` (serta koleksi `attendances` bila diperlukan untuk statistik kehadiran per sesi).
   - Pasang filter periode **`Hari` | `Minggu` | `Bulan`** (`SegmentedControl`) di bagian atas yang langsung memfilter jadwal, riwayat kegiatan lab, dan riwayat keuangan denda.
   - Tampilkan seluruh 6 blok wajib dari soal Sprint 4:
     1. KPI Jumlah Laboratorium & Jumlah Praktikan.
     2. Status Kegiatan Praktikum pada Setiap Laboratorium (beserta lokasi & waktu pelaksanaan).
     3. Jadwal Praktikum yang Sedang Berlangsung & yang Akan Datang.
     4. Riwayat Kegiatan Laboratorium.
     5. Riwayat Keuangan Hasil Denda Praktikum (Total Denda Lunas `success`, Menunggu `pending`, Gagal `failed`, dan daftar detail tagihan/pembayaran).
     6. Pintasan cepat Aslab ke `/lokasi-lab`, `/bulk-insert`, dan `/transfer-lab`.
   - Pada `src/app/dashboard-aslab.tsx`: bungkus dengan `<RoleRouteGuard allowedRole="aslab">`. *(Catatan: selama P1 belum merge, boleh sementara cek `role === 'aslab'` di wrapper agar typecheck lolos, lalu rapikan setelah pull P1).*

---

## 4. Pengujian & Atomic Commits

Buat **`tests/fineCalculation.test.js`** yang menguji minimal 6 skenario wajib:
1. Presensi sebelum batas grace period → `isLate: false`, `lateMinutes: 0`, `ON_TIME`.
2. Presensi **tepat pada batas akhir grace period** (`start + gracePeriod`) → `isLate: false`, `ON_TIME`.
3. Presensi lewat 1 menit dari batas grace period → `isLate: true`, `lateMinutes: 1`, `LATE`.
4. Durasi grace period kustom (misal 10 menit vs 30 menit) menghasilkan evaluasi akurat.
5. Agregasi `summarizeFineFinances` & filter periode `hari` / `minggu` / `bulan` pada `aslabDashboardService`.
6. Verifikasi aturan bisnis: izin disetujui berstatus excused absence tanpa denda dan status pembayaran denda tidak mengubah field `statusKehadiran`.

Jalankan sebelum commit & PR:
```bash
npm run validate
```

### Saran Urutan Atomic Commits (Head & Body Bahasa Indonesia, Tanpa Co-Author):
1. `feat(fines): buat engine perhitungan grace period dan pengelolaan tagihan denda idempoten`
2. `feat(attendance): integrasikan evaluasi keterlambatan dan pembatasan ruang lingkup sesi asprak`
3. `feat(aslab): tambahkan layanan agregasi dan dashboard keberlangsungan lab serta keuangan denda`
4. `test(fines): tambahkan unit test perhitungan grace period, denda, dan filter dashboard aslab`
