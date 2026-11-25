# Panduan Kerja Teknis Sprint 4 — Programmer 1 (Rafa Azlan)

* **PIC:** Rafa Azlan (`24060124140126`)
* **Branch Git:** `feature/aslab-lab-management`
* **Cakupan SRS:** `SRS-FT-15`, `SRS-FT-16`, `SRS-FT-17`, `SRS-FT-18`
* **Dokumen Kontrak Utama:** [PRAKMOBILE4.md](../PRAKMOBILE4.md)
* **Urutan Merge:** **Gelombang 1 (Merge Pertama ke `main`)**

---

## 1. Strict Scope — Kepemilikan File Eksklusif (0% Merge Conflict)

Kamu **HANYA** boleh memodifikasi/membuat **17 berkas** berikut. Jangan menyentuh file milik P2 (`firestoreService.js`, `sesi.tsx`, `fineService.js`, dll.) maupun P3 (`backend/`, `paymentService.js`, `notificationService.js`, `src/app/_layout.tsx`, `src/app/(tabs)/*`), dan **jangan mengubah root `package.json` / `package-lock.json`** (zero new native dependencies).

```text
[MODIFY] src/types/index.ts
[MODIFY] src/domain/auth.ts
[MODIFY] src/context/AuthContext.d.ts
[MODIFY] src/components/navigation/RoleRouteGuard.tsx
[MODIFY] src/app/lokasi-lab.tsx
[MODIFY] src/services/labService.js
[NEW]    src/services/bulkTemplateService.js
[NEW]    src/components/aslab/BulkStagingList.js
[MODIFY] src/screens/asisten/LabLocationManageScreen.js
[NEW]    src/screens/aslab/BulkInsertScreen.js
[NEW]    src/screens/aslab/LabTransferScreen.js
[NEW]    src/app/bulk-insert.tsx
[NEW]    src/app/transfer-lab.tsx
[MODIFY] firestore.rules
[MODIFY] firestore.indexes.json
[MODIFY] tests/authRoles.test.js
[NEW]    tests/labBulkAndTransfer.test.js
```

---

## 2. Persiapan Awal Git

```bash
git checkout main
git pull origin main
npm install
git checkout -b feature/aslab-lab-management
```

---

## 3. Rincian Tugas & Panduan Implementasi

### A. Fondasi Role Baru `aslab` & Kontrak Tipe (`SRS-FT-15`)
1. **`src/types/index.ts`**:
   - Perbarui `PeranPengguna`:
     ```ts
     export type PeranPengguna = 'aslab' | 'asisten' | 'praktikan';
     ```
   - Tambahkan interface kontrak bersama agar P2 dan P3 langsung mendapatkan type safety:
     - `LabMemberEntry` (`uid?: string; nama: string; nomorInduk: string; kelas?: string; email?: string`)
     - `LabConfig` (`id`, `name`, `code`, `courseCode`, `courseName`, `address`, `latitude`, `longitude`, `radiusMeters`, `gracePeriodMinutes`, `lateFineAmount`, `aslabId`, `asprakIds`, `asprakMembers`, `studentIds`, `studentMembers`, `isActive`)
     - `BulkInsertType` (`'labs' | 'students' | 'asprak'`)
     - `BulkRowStatus` (`'accepted' | 'denied'`)
     - `FinePaymentStatus` (`'pending' | 'success' | 'failed'`)
     - `FineRecord` & `PaymentTransactionRecord` sesuai skema di [PRAKMOBILE4.md](../PRAKMOBILE4.md).
2. **`src/domain/auth.ts` & `src/context/AuthContext.d.ts`**:
   - Perbarui `AUTH_ROLES` menjadi `['praktikan', 'asisten', 'aslab']`.
   - Pastikan `normalizeProfileRoles`, `selectActiveRole`, dan `validateAuthProfile` menerima role `'aslab'` secara valid (aturan `kelas` wajib hanya untuk role `'praktikan'`).
   - Tambahkan `assignedLabIds?: string[]` pada `UserProfile` di `AuthContext.d.ts`.
3. **`src/components/navigation/RoleRouteGuard.tsx` & `src/app/lokasi-lab.tsx`**:
   - Perluas `RoleRouteGuard` agar menerima `allowedRole: PeranPengguna | PeranPengguna[]` (tetap *backward-compatible* untuk string tunggal seperti `allowedRole="praktikan"`).
   - Ubah `src/app/lokasi-lab.tsx` agar menggunakan `allowedRole="aslab"` (karena pengelolaan seluruh laboratorium kini merupakan kewenangan **Aslab**, bukan Asprak).

---

### B. Manajemen Lab, Kebijakan Keterlambatan/Denda, & Transfer (`SRS-FT-16` & `SRS-FT-18`)
1. **`src/services/labService.js`**:
   - Perluas `validateLabInput(labInput)` dan `mapLabDocument` untuk mendukung field baru (tetap *backward-compatible* untuk dokumen lab lama dengan fallback default!):
     - `courseCode` (string, default `''`) & `courseName` (string, default `''`)
     - `radiusMeters` (number `> 0`, default `50`) — **set cakupan lokasi presensi**
     - `gracePeriodMinutes` (number `>= 0`, default `15`) — **set batasan keterlambatan waktu**
     - `lateFineAmount` (number `>= 0`, default `10000`) — **nominal denda keterlambatan tetap**
     - `aslabId` (string, default `userId`)
     - `asprakIds` (array string, default `[]`) & `asprakMembers` (array objek, default `[]`)
     - `studentIds` (array string, default `[]`) & `studentMembers` (array objek, default `[]`)
   - Tambahkan fungsi operasi Sprint 4:
     - `bulkCreateLabsByCourse({ courseCode, courseName, labs, userId })` menggunakan `writeBatch(db)` untuk membuat sejumlah lab sekaligus dalam 1 mata kuliah.
     - `bulkAssignStudentsToLab({ labId, students, userId })` — menambahkan 1 atau banyak praktikan ke `studentMembers` & `studentIds` (deduplikasi berdasarkan `nomorInduk` / `uid`).
     - `bulkAssignAspraksToLab({ labId, aspraks, userId })` — menambahkan 1 atau banyak asprak ke `asprakMembers` & `asprakIds` (deduplikasi berdasarkan `nomorInduk` / `uid`).
     - `transferStudentBetweenLabs({ fromLabId, toLabId, studentIdentifier, userId })` — memindahkan praktikan dari 1 lab ke lab lain secara atomik menggunakan `runTransaction(db, ...)` (**tanpa mengubah jadwal praktikum**).
     - `transferAsprakBetweenLabs({ fromLabId, toLabId, asprakIdentifier, userId })` — memindahkan asprak/aslab antar laboratorium secara atomik menggunakan `runTransaction(db, ...)` (**tanpa mengubah jadwal praktikum**).
2. **`src/screens/asisten/LabLocationManageScreen.js`**:
   - Upgrade form tambah/ubah laboratorium untuk Aslab agar memiliki input:
     - Nama Lab, Kode Lab, Kode & Nama Mata Kuliah
     - Alamat, Latitude, Longitude (dengan tombol ambil GPS perangkat saat ini)
     - **Cakupan Lokasi Presensi (`radiusMeters`)**
     - **Batasan Keterlambatan / Grace Period (`gracePeriodMinutes` dalam menit)**
     - **Nominal Denda Tetap (`lateFineAmount` dalam Rupiah)**
   - Tampilkan ringkasan jumlah praktikan & asprak yang terdaftar pada tiap kartu lab, serta tombol pintasan menuju `/bulk-insert` dan `/transfer-lab`.

---

### C. 3 Fitur Bulk/Single Insert Terpisah, Downloadable Template, & Staging ScrollView (`SRS-FT-17`)
> **Syarat Kritis dari Soal:**
> 1. **Ketiga bulk insert WAJIB DIPISAH** (bukan 1 bulk gabungan):
>    - Mode 1: **Bulk / Single Insert Laboratorium** (berdasarkan 1 mata kuliah).
>    - Mode 2: **Bulk / Single Insert Praktikan** ke laboratorium tertentu.
>    - Mode 3: **Bulk / Single Insert Asprak** ke laboratorium tertentu.
> 2. **Downloadable File Template**: Setiap mode punya tombol download/bagikan file template CSV sendiri.
> 3. **Staging ScrollView Fleksibel**: Tiap baris (row) data bulk berubah menjadi item di dalam `ScrollView` yang dapat diatur fleksibel oleh Aslab: **Accept / Deny** (toggle terima/tolak baris), **Edit / Update inline**, dan **mengisi kolom yang masih kosong**, dilengkapi indikator baris valid vs masih ada field kosong.

1. **`src/services/bulkTemplateService.js`** *(Zero new native dependencies!)*:
   - Definisikan 3 template CSV terpisah:
     - `labs`: `code,name,address,latitude,longitude,radiusMeters,gracePeriodMinutes,lateFineAmount`
     - `students`: `nomorInduk,nama,kelas,email,uid`
     - `asprak`: `nomorInduk,nama,email,uid`
   - Buat fungsi `downloadBulkTemplate(type)`:
     - Pada **Web (`Platform.OS === 'web'`)**: trigger unduhan file `.csv` langsung via `Blob` + `<a download="template-bulk-{type}.csv">`.
     - Pada **Android / iOS**: panggil `Share.share({ title, message: csvContent })` bawaan `react-native` sehingga Aslab bisa langsung menyimpan/membagikan file template CSV + tampilkan preview template yang mudah disalin.
   - Buat fungsi parser murni `parseBulkCsvText(type, rawText)` yang mengubah teks CSV (termasuk baris yang punya kolom kosong!) menjadi array staging row:
     `{ rowId, status: 'accepted' | 'denied', data: {...}, missingFields: string[], isValid: boolean }`.
2. **`src/components/aslab/BulkStagingList.js`**:
   - Menerima `type`, `rows`, `onToggleStatus(rowId)`, `onUpdateRowField(rowId, field, value)`, `onRemoveRow(rowId)`, `onAddEmptyRow()`.
   - Merender setiap baris dalam `ScrollView` sebagai kartu interaktif:
     - Tombol toggle **Accept** (hijau) / **Deny** (merah/nonaktif).
     - `TextInput` inline untuk setiap kolom sehingga Aslab dapat langsung mengedit data atau mengisi field yang masih kosong (highlight border kuning/merah jika kolom wajib masih kosong!).
     - Penghitung ringkas di bagian atas: `Diterima: X | Ditolak: Y | Perlu Dilengkapi: Z`.
3. **`src/screens/aslab/BulkInsertScreen.js` & `src/app/bulk-insert.tsx`**:
   - Gunakan `SegmentedControl` (atau 3 tab tombol tegas) untuk memisahkan 3 mode: **`Lab (Per Matkul)`** | **`Praktikan ke Lab`** | **`Asprak ke Lab`**.
   - Setiap tab memiliki:
     - Pilihan konteks (Mata Kuliah untuk tab Lab; Pilihan Lab tujuan untuk tab Praktikan & Asprak).
     - Toggle mode **Single Insert** (tambah 1 data langsung) vs **Bulk Insert** (tombol **Unduh Template CSV**, tombol **Isi Contoh Data**, kotak `TextInput` multiline untuk paste/muat isi CSV, tombol **Proses ke Daftar Review**, lalu tampilkan `<BulkStagingList />` + tombol **Simpan X Baris yang Di-Accept ke Firestore**).
   - Bungkus route `src/app/bulk-insert.tsx` dengan `<RoleRouteGuard allowedRole="aslab">`.
4. **`src/screens/aslab/LabTransferScreen.js` & `src/app/transfer-lab.tsx`**:
   - Dua tab terpisah: **Pindah Praktikan** dan **Pindah Asprak / Aslab**.
   - Pilih **Lab Asal** → pilih praktikan/asprak dari daftar lab asal → pilih **Lab Tujuan** → konfirmasi → panggil `transferStudentBetweenLabs` / `transferAsprakBetweenLabs`.
   - Tampilkan catatan jelas bahwa perpindahan hanya memindahkan praktikan/asprak tanpa mengubah jadwal praktikum.
   - Bungkus route `src/app/transfer-lab.tsx` dengan `<RoleRouteGuard allowedRole="aslab">`.

---

### D. Pembaruan Keamanan Firestore (`firestore.rules` & `firestore.indexes.json`)
Perbarui `firestore.rules` dengan hati-hati agar **tidak merusak fungsi Sprint 2–3**:
1. Tambahkan helper `isAslab()` (`hasRole('aslab')`).
2. Perbarui `validUserData`:
   - `data.role in ['praktikan', 'asisten', 'aslab']`
   - `data.roles.size() >= 1 && data.roles.size() <= 3`
   - Izinkan field opsional `assignedLabIds` (list) di `hasOnly(...)` (hanya dapat diubah administratif, bukan oleh client!).
3. Perbarui `match /labs/{labId}`:
   - `allow create, update`: diubah dari `isAsisten()` menjadi **`isAslab()`**.
   - Perluas `validLabData` & `affectedKeys().hasOnly(...)` untuk mengizinkan field Sprint 4: `courseCode`, `courseName`, `gracePeriodMinutes` (`number >= 0`), `lateFineAmount` (`number >= 0`), `aslabId`, `asprakIds` (list), `asprakMembers` (list), `studentIds` (list), `studentMembers` (list).
4. Perbarui `match /sessions/{sessionId}`:
   - Izinkan field opsional baru pada `validSessionData`: `gracePeriodMinutes`, `lateFineAmount`.
   - Izinkan `isAsisten()` (Asprak) membuat/mengubah sesi **hanya jika** `request.auth.uid in get(/databases/$(database)/documents/labs/$(labId)).data.get('asprakIds', [])` ATAU `get(/databases/$(database)/documents/labs/$(labId)).data.get('asprakIds', []).size() == 0` *(fallback aman untuk lab lama sebelum di-assign)*.
5. Perbarui `match /attendances/{attendanceId}`:
   - Izinkan `isAslab()` juga membaca rekap kehadiran.
   - Izinkan field opsional baru pada `validAttendanceCreate`: `isLate` (bool), `lateMinutes` (number `>= 0`), `attendancePunctuality` (`'ON_TIME' | 'LATE'`).
6. Tambahkan aturan **`match /fines/{fineId}`**:
   - `allow read`: `isActiveUser() && (resource.data.studentId == request.auth.uid || isAslab() || isAsisten())`
   - `allow create`: `isPraktikan() && fineId == request.resource.data.sessionId + '_' + request.auth.uid && request.resource.data.studentId == request.auth.uid && request.resource.data.paymentStatus == 'pending' && request.resource.data.amount is number && request.resource.data.amount > 0 && request.resource.data.paidAt == null`
   - `allow update, delete`: **`false`** *(Hanya Backend Server dengan Firebase Admin SDK setelah verifikasi webhook Xendit yang dapat memperbarui status pembayaran!)*
7. Tambahkan aturan **`match /payment_transactions/{txId}`**:
   - `allow read`: `isActiveUser() && (resource.data.studentId == request.auth.uid || isAslab())`
   - `allow create, update, delete`: **`false`** *(Sepenuhnya dikelola Backend Server P3 via Firebase Admin SDK!)*
8. Tambahkan index yang dibutuhkan pada `firestore.indexes.json` (jika query menggunakan `where` + `orderBy`).

---

## 4. Pengujian & Atomic Commits

Buat/perbarui unit test:
- `tests/authRoles.test.js`: tambahkan pengujian role `'aslab'` (validasi profil tanpa wajib `kelas`, kombinasi multi-role `['aslab', 'asisten']`).
- `tests/labBulkAndTransfer.test.js`: uji `parseBulkCsvText` untuk 3 mode (`labs`, `students`, `asprak`), deteksi `missingFields`, dan validasi input `gracePeriodMinutes` & `lateFineAmount`.

Jalankan sebelum commit & PR:
```bash
npm run validate
```

### Saran Urutan Atomic Commits (Head & Body Bahasa Indonesia, Tanpa Co-Author):
1. `feat(auth,rules): tambahkan role aslab serta aturan keamanan lab dan denda`
2. `feat(lab): perluas labService dengan grace period, denda, bulk insert, dan transfer`
3. `feat(aslab): tambahkan layanan template CSV, BulkStagingList, dan layar BulkInsert serta LabTransfer`
4. `feat(lab): perbarui LabLocationManageScreen dengan cakupan presensi dan batas keterlambatan`
