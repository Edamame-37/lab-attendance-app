# Dokumen SRS & Pembagian Tugas Sprint 4 — Lab Attendance App

* **Proyek:** Lab Attendance App (React Native / Expo SDK 58)
* **Repository:** `Edamame-37/lab-attendance-app` (Baseline: `main` commit `4ed60a4`)
* **Project Manager (PM):** Syair
* **Tim Programmer:**
  1. **P1:** Rafa Azlan (`24060124140126`) — Branch: `feature/aslab-lab-management`
  2. **P2:** Aufaarel Nabiil Aryadh Mecca (`24060124140206`) — Branch: `feature/aslab-dashboard-fines`
  3. **P3:** Marchella Arkhina Ratunesia (`24060124120036`) — Branch: `feature/xendit-payment-ui-final`
* **Fokus Sprint 4:** Role Baru Aslab & Manajemen Laboratorium (3 Bulk/Single Insert + Template + Staging ScrollView + Transfer), Dashboard Keberlangsungan Lab & Keuangan Denda, Pengelolaan Sesi Terfokus Asprak, Perhitungan Keterlambatan (Grace Period) & Denda Idempoten, Integrasi Payment Gateway **Xendit (Test Mode)** via Backend + Webhook, Notifikasi & Riwayat Pembayaran, serta Finalisasi Antarmuka 3 Peran.

---

## 1. Tabel Software Requirements Specification (SRS) Sprint 4

| **Kode SRS** | **Deskripsi Kebutuhan Sistem** | **Prinsip Data Isolation & Keamanan** |
|---|---|---|
| **SRS-FT-15** | Sistem menambahkan peran baru **Asisten Laboratorium (`aslab`)** selain `asisten` (Asprak) dan `praktikan`, lengkap dengan validasi profil domain, route guard, dan pembatasan kewenangan pada `firestore.rules`. | **Berlaku:** Role `aslab` hanya diberikan lewat provisioning administratif (`users/{uid}.roles`). Client tidak boleh menambah/mengubah role sendiri maupun meng-update status pembayaran `fines` / `payment_transactions`. |
| **SRS-FT-16** | Aslab dapat menambah dan mengelola data laboratorium termasuk nama, kode, mata kuliah, lokasi, koordinat, radius cakupan presensi (`radiusMeters`), batasan keterlambatan (`gracePeriodMinutes`), dan nominal denda tetap (`lateFineAmount`). | **Berlaku:** Semua akun aktif dapat membaca `labs`, tetapi hanya `aslab` yang dapat membuat, mengubah, atau menonaktifkan konfigurasi laboratorium. |
| **SRS-FT-17** | Aslab dapat melakukan **3 jenis Bulk / Single Insert yang TERPISAH** (bukan satu bulk gabungan): (1) membuat sejumlah laboratorium sekaligus berdasarkan satu mata kuliah, (2) memasukkan data praktikan ke laboratorium tertentu, (3) memasukkan data asprak ke laboratorium tertentu. Dilengkapi **downloadable template CSV** untuk tiap jenis dan daftar preview **ScrollView interaktif** tempat Aslab dapat secara fleksibel melakukan *accept/deny*, *edit inline*, dan melengkapi data yang masih kosong sebelum commit ke Firestore. | **Berlaku:** Hanya pengguna dengan peran `aslab` yang berhak menjalankan operasi bulk/single insert pada `labs` dan penugasan anggota lab. |
| **SRS-FT-18** | Aslab dapat memindahkan praktikan dari satu laboratorium ke laboratorium lain serta memindahkan asprak/aslab antar laboratorium **tanpa perpindahan jadwal praktikum**. | **Berlaku:** Mutasi distribusi anggota lab (`studentIds`, `asprakIds`, `aslabId`) hanya diizinkan bagi peran `aslab`. |
| **SRS-FT-19** | Aslab memiliki **Dashboard Keberlangsungan Laboratorium** dengan filter **Hari, Minggu, dan Bulan** yang menampilkan jumlah laboratorium & praktikan, status kegiatan praktikum pada setiap lab, informasi lokasi & waktu, jadwal yang sedang berlangsung & akan datang, riwayat kegiatan laboratorium, serta **riwayat keuangan hasil denda praktikum** berbasis data real-time Firebase. | **Berlaku:** Dashboard agregasi seluruh lab dan riwayat keuangan denda hanya dapat diakses oleh peran `aslab`. |
| **SRS-FT-20** | Asprak (`asisten`) difokuskan hanya pada pengelolaan pelaksanaan praktikum (daftar kelas, jadwal, buka/tutup sesi, pantau & kelola presensi) pada laboratorium/kelas yang menjadi tanggung jawabnya secara real-time, tanpa kewenangan mengelola distribusi praktikan maupun konfigurasi seluruh laboratorium. | **Berlaku:** Asprak hanya dapat membuat/membuka/menutup sesi pada lab yang ditugaskan (`asprakIds` / `assignedLabIds`) dan hanya memodifikasi sesi miliknya (`asistenId == request.auth.uid`). |
| **SRS-FT-21** | Sistem menentukan keterlambatan berdasarkan waktu presensi terhadap waktu mulai sesi menggunakan mekanisme **grace period** yang dapat dikonfigurasi. Presensi `<= waktuMulai + gracePeriod` dicatat **Tepat Waktu**; lewat batas dicatat **Terlambat** dan otomatis membuat **tepat satu tagihan denda nominal tetap** (`fines/{sessionId}_{studentId}`) yang terhubung ke identitas praktikan, sesi, dan catatan presensi. Pembayaran denda **tidak mengubah status kehadiran**. Izin yang disetujui Asprak berstatus **tidak hadir dengan izin (`excused_absence`)**, dibebaskan dari denda, dan **tidak mengubah catatan kehadiran menjadi hadir**. | **Berlaku:** ID dokumen deterministik `${sessionId}_${studentId}` mencegah tagihan ganda. Praktikan hanya dapat membuat tagihan untuk `studentId == request.auth.uid` saat presensi terlambat, dan tidak pernah dapat mengubah status pembayarannya. |
| **SRS-FT-22** | Sistem mengintegrasikan Payment Gateway **Xendit (Test Mode — Invoice API v2)** melalui arsitektur **Client → Backend Server → Xendit → Webhook → Firestore**. Secret API Key dan Webhook Verification Token hanya disimpan di backend. Backend memverifikasi Firebase ID Token saat membuat invoice, membaca nominal denda langsung dari Firestore, dan memverifikasi callback webhook Xendit via header `x-callback-token` (`timingSafeEqual`) sebelum memperbarui status tagihan. | **Berlaku:** Zero secret key di kode React Native (`src/`). Status pembayaran (`pending` / `success` / `failed`) hanya dapat ditulis oleh Backend Server menggunakan Firebase Admin SDK. |
| **SRS-FT-23** | Praktikan dapat melihat daftar tagihan dan rincian nominal denda, memulai pembayaran yang mengarahkan ke halaman Checkout Xendit Test Mode (`invoice_url`), memantau status pembayaran (`pending`, `success`, `failed`) secara real-time, dan melihat halaman **Riwayat Pembayaran** persisten (info sesi, tanggal tagihan, nominal, waktu transaksi, status) yang tetap tersedia setelah aplikasi ditutup dan dibuka kembali. | **Berlaku:** Praktikan hanya dapat membaca dokumen `fines` dan `payment_transactions` miliknya sendiri (`studentId == request.auth.uid`). |
| **SRS-FT-24** | Sistem mengintegrasikan notifikasi (dari Sprint 3) untuk memberi tahu praktikan saat: (1) tagihan denda baru dibuat, (2) pembayaran berhasil, (3) pembayaran gagal atau butuh penyelesaian lebih lanjut; serta memfinalisasi antarmuka & navigasi terproteksi yang modern dan konsisten bagi ketiga peran (`aslab`, `asisten`, `praktikan`). | **Berlaku:** Notifikasi tagihan & pembayaran hanya dipicu untuk dokumen milik praktikan yang sedang login. |

---

## 2. Pembagian Tugas 3 Programmer (Single File Ownership — 0% Merge Conflict)

> **Aturan Keras:** Setiap programmer **HANYA** boleh membuat dan memodifikasi berkas miliknya sendiri. Root `package.json` dan `package-lock.json` **tidak perlu diubah** (zero new native Expo dependencies). Dependency backend diisolasi di `backend/package.json` milik P3.

| Programmer | Branch Git | Kode SRS | Panduan Detail | Kepemilikan File Eksklusif |
|---|---|---|---|---|
| **P1 — Rafa Azlan** (`24060124140126`) | `feature/aslab-lab-management` | `SRS-FT-15`<br>`SRS-FT-16`<br>`SRS-FT-17`<br>`SRS-FT-18` | [docs/TASK_SPRINT4_P1_AZLAN.md](./docs/TASK_SPRINT4_P1_AZLAN.md) | `src/types/index.ts`, `src/domain/auth.ts`, `src/context/AuthContext.d.ts`, `src/components/navigation/RoleRouteGuard.tsx`, `src/app/lokasi-lab.tsx`, `src/services/labService.js`, `src/services/bulkTemplateService.js`, `src/components/aslab/BulkStagingList.js`, `src/screens/asisten/LabLocationManageScreen.js`, `src/screens/aslab/BulkInsertScreen.js`, `src/screens/aslab/LabTransferScreen.js`, `src/app/bulk-insert.tsx`, `src/app/transfer-lab.tsx`, `firestore.rules`, `firestore.indexes.json`, `tests/authRoles.test.js`, `tests/labBulkAndTransfer.test.js` |
| **P2 — Aufaarel Nabiil Aryadh Mecca** (`24060124140206`) | `feature/aslab-dashboard-fines` | `SRS-FT-19`<br>`SRS-FT-20`<br>`SRS-FT-21` | [docs/TASK_SPRINT4_P2_FARREL.md](./docs/TASK_SPRINT4_P2_FARREL.md) | `src/services/fineService.js`, `src/services/aslabDashboardService.js`, `src/components/aslab/LabActivitySummaryCard.js`, `src/screens/aslab/AslabDashboardScreen.js`, `src/app/dashboard-aslab.tsx`, `src/services/firestoreService.js`, `src/app/sesi.tsx`, `src/screens/praktikan/AttendanceCheckScreen.js`, `src/screens/asisten/LeaveReviewScreen.js`, `tests/fineCalculation.test.js` |
| **P3 — Marchella Arkhina Ratunesia** (`24060124120036`) | `feature/xendit-payment-ui-final` | `SRS-FT-22`<br>`SRS-FT-23`<br>`SRS-FT-24` | [docs/TASK_SPRINT4_P3_MARCHELLA.md](./docs/TASK_SPRINT4_P3_MARCHELLA.md) | `backend/package.json`, `backend/.env.example`, `backend/src/firebaseAdmin.js`, `backend/src/xenditClient.js`, `backend/src/server.js`, `src/services/paymentService.js`, `src/hooks/useFinePaymentNotifications.js`, `src/services/notificationService.js`, `src/screens/praktikan/FinePaymentScreen.js`, `src/screens/praktikan/PaymentHistoryScreen.js`, `src/app/tagihan-denda.tsx`, `src/app/riwayat-pembayaran.tsx`, `src/app/_layout.tsx`, `src/app/(tabs)/_layout.tsx`, `src/app/(tabs)/index.tsx`, `src/app/(tabs)/profil.tsx`, `src/components/AppHeader.tsx`, `tests/paymentWebhook.test.js` |

---

## 3. Format Isian Form Pembagian SRS / User Story

Format: `Nama Programmer - SRS kode : user story`

```text
Rafa Azlan - SRS-FT-15 : Sebagai Asisten Laboratorium (Aslab), saya ingin memiliki peran dan hak akses terpisah beserta aturan keamanan Firestore agar dapat mengelola laboratorium tanpa tumpang tindih dengan kewenangan Asprak maupun Praktikan.
Rafa Azlan - SRS-FT-16 : Sebagai Aslab, saya ingin menambah dan mengelola data laboratorium termasuk mata kuliah, lokasi, koordinat, radius cakupan presensi, batas toleransi keterlambatan (grace period), dan nominal denda tetap.
Rafa Azlan - SRS-FT-17 : Sebagai Aslab, saya ingin melakukan bulk/single insert terpisah untuk laboratorium per mata kuliah, praktikan ke lab, dan asprak ke lab menggunakan template yang dapat diunduh serta meninjau tiap baris data secara fleksibel (accept/deny dan edit inline) dalam ScrollView sebelum disimpan.
Rafa Azlan - SRS-FT-18 : Sebagai Aslab, saya ingin memindahkan praktikan dan asprak/aslab dari satu laboratorium ke laboratorium lain tanpa mengubah jadwal praktikum.
Aufaarel Nabiil Aryadh Mecca - SRS-FT-19 : Sebagai Aslab, saya ingin memantau dashboard keberlangsungan laboratorium dengan filter hari, minggu, dan bulan yang menampilkan jumlah lab dan praktikan, status tiap lab, lokasi dan waktu, jadwal berlangsung dan mendatang, riwayat kegiatan, serta riwayat keuangan hasil denda praktikum.
Aufaarel Nabiil Aryadh Mecca - SRS-FT-20 : Sebagai Asprak, saya ingin mengelola kelas, jadwal, pembukaan/penutupan sesi, dan pemantauan presensi khusus pada laboratorium yang menjadi tanggung jawab saya secara real-time tanpa mengakses konfigurasi seluruh laboratorium.
Aufaarel Nabiil Aryadh Mecca - SRS-FT-21 : Sebagai sistem dan praktikan, saya ingin keterlambatan dihitung otomatis menggunakan grace period terhadap waktu mulai sesi sehingga menghasilkan tepat satu tagihan denda nominal tetap tanpa mengubah status kehadiran saat dibayar, serta memastikan izin yang disetujui Asprak berstatus excused absence dan bebas denda.
Marchella Arkhina Ratunesia - SRS-FT-22 : Sebagai sistem, saya ingin mengintegrasikan backend pembayaran Xendit Test Mode (Invoice API dan verifikasi webhook x-callback-token) agar pembuatan transaksi dan verifikasi status pembayaran dilakukan secara aman di server tanpa menyimpan secret key di aplikasi React Native.
Marchella Arkhina Ratunesia - SRS-FT-23 : Sebagai praktikan, saya ingin melihat daftar tagihan denda, membayar denda melalui halaman Xendit Checkout, memantau status pembayaran (pending, success, failed) secara real-time, serta mengakses riwayat pembayaran yang tersimpan persisten di Firestore.
Marchella Arkhina Ratunesia - SRS-FT-24 : Sebagai praktikan dan seluruh pengguna, saya ingin menerima notifikasi saat tagihan denda dibuat, pembayaran berhasil, atau pembayaran gagal/butuh penyelesaian, serta menggunakan antarmuka final yang modern, konsisten, dan terproteksi untuk peran Aslab, Asprak, dan Praktikan.
```

---

## 4. Kontrak Skema Data Firestore & API Bersama

Seluruh programmer **wajib** mengikuti nama field dan nilai enum persis di bawah ini agar integrasi antar modul langsung mulus tanpa penyesuaian ulang.

### 4.1 Peran Canonical (`PeranPengguna`)
- `'praktikan'` → Praktikan
- `'asisten'` → Asisten Praktikum (Asprak)
- `'aslab'` → Asisten Laboratorium (Aslab)

### 4.2 Koleksi `labs/{labId}`
```json
{
  "name": "Lab RPL 1",
  "code": "RPL-01",
  "courseCode": "PPK-2026",
  "courseName": "Praktikum Pengembangan Perangkat Bergerak",
  "address": "Gedung E Lt. 2",
  "location": "GeoPoint(-7.0519, 110.4408)",
  "radiusMeters": 50,
  "gracePeriodMinutes": 15,
  "lateFineAmount": 10000,
  "aslabId": "<uid-aslab>",
  "asprakIds": ["<uid-asprak-1>"],
  "asprakMembers": [{ "uid": "", "nama": "Rian", "nomorInduk": "19950312", "email": "rian@lab.id" }],
  "studentIds": ["<uid-mhs-1>"],
  "studentMembers": [{ "uid": "", "nama": "Ahmad Fauzi", "nomorInduk": "24060124120001", "kelas": "TI-3A", "email": "ahmad@mhs.id" }],
  "isActive": true,
  "createdAt": "Timestamp",
  "updatedAt": "Timestamp",
  "updatedBy": "<uid-aslab>"
}
```
*Catatan*: Menyimpan `studentMembers` & `asprakMembers` (array objek ringkas) selain `studentIds` & `asprakIds` membuat fitur bulk insert data mahasiswa/asprak (termasuk yang mungkin belum sempat mendaftar akun Firebase) dan perpindahan antar lab langsung tampil informatif di UI dan Dashboard Aslab.

### 4.3 Tambahan Field pada `sessions/{sessionId}` & `attendances/{sessionId}_{studentId}`
- **`sessions/{sessionId}`**:
  - `gracePeriodMinutes`: `number` (default mewarisi dari `labs/{labId}.gracePeriodMinutes`, fallback `15`)
  - `lateFineAmount`: `number` (default mewarisi dari `labs/{labId}.lateFineAmount`, fallback `10000`)
- **`attendances/{sessionId}_{studentId}`**:
  - `isLate`: `boolean`
  - `lateMinutes`: `number` (`0` jika tepat waktu, `> 0` jika melewati batas *grace period*)
  - `attendancePunctuality`: `'ON_TIME' | 'LATE'`
  - `statusKehadiran`: tetap `'HADIR'` (tidak boleh berubah oleh pembayaran denda!)

### 4.4 Koleksi `fines/{sessionId}_{studentId}` (Deterministic ID)
```json
{
  "id": "{sessionId}_{studentId}",
  "attendanceId": "{sessionId}_{studentId}",
  "sessionId": "session-abc",
  "sessionName": "Praktikum PPK - Modul 4",
  "labId": "lab-1",
  "labName": "Lab RPL 1",
  "studentId": "<uid-praktikan>",
  "studentName": "Ahmad Fauzi",
  "studentNim": "24060124120001",
  "studentClass": "TI-3A",
  "lateMinutes": 12,
  "gracePeriodMinutes": 15,
  "amount": 10000,
  "paymentStatus": "pending",
  "latestOrderId": null,
  "latestInvoiceId": null,
  "latestInvoiceUrl": null,
  "paidAt": null,
  "createdAt": "Timestamp",
  "updatedAt": "Timestamp"
}
```
- `paymentStatus`: `'pending' | 'success' | 'failed'`

### 4.5 Koleksi `payment_transactions/{externalId}` (Ditulis HANYA oleh Backend P3)
```json
{
  "externalId": "FINE-{shortSession}-{shortUid}-{timestamp}",
  "xenditInvoiceId": "6744...",
  "fineId": "{sessionId}_{studentId}",
  "sessionId": "session-abc",
  "sessionName": "Praktikum PPK - Modul 4",
  "studentId": "<uid-praktikan>",
  "studentName": "Ahmad Fauzi",
  "amount": 10000,
  "status": "pending",
  "xenditStatus": "PENDING",
  "paymentMethod": null,
  "paymentChannel": null,
  "invoiceUrl": "https://checkout-staging.xendit.co/v2/...",
  "billedAt": "Timestamp",
  "paidAt": null,
  "expiresAt": "Timestamp",
  "createdAt": "Timestamp",
  "updatedAt": "Timestamp"
}
```
- `status`: `'pending' | 'success' | 'failed'`

### 4.6 Kontrak REST API Backend Payment Xendit (`backend/`)
- Base URL dari aplikasi mobile dibaca via `process.env.EXPO_PUBLIC_PAYMENT_API_URL` (contoh: `http://localhost:4000` atau `https://xxx.onrender.com`).
- **`POST /api/payments/create`**
  - Header: `Authorization: Bearer <Firebase_ID_Token>`, `Content-Type: application/json`
  - Body: `{ "fineId": "<sessionId>_<studentId>" }`
  - Response `201`: `{ "success": true, "externalId": "...", "invoiceId": "...", "invoiceUrl": "https://checkout-staging.xendit.co/...", "status": "pending", "amount": 10000 }`
- **`POST /api/payments/webhook`**
  - Header wajib: `x-callback-token: <XENDIT_WEBHOOK_TOKEN>`
  - Payload: Xendit Invoice Webhook (`id`, `external_id`, `status`, `amount`, `paid_at`, `payment_method`, `payment_channel`)
  - Mapping status: `PAID` / `SETTLED` → `'success'`, `PENDING` → `'pending'`, `EXPIRED` → `'failed'`
- **`GET /api/payments/status/:externalId`**
  - Header: `Authorization: Bearer <Firebase_ID_Token>`
  - Sinkronisasi status langsung ke `GET https://api.xendit.co/v2/invoices/{xenditInvoiceId}` bila webhook tertunda di Sandbox.

---

## 5. Urutan Integrasi & Merge (3 Gelombang)

1. **Persiapan Semua Programmer:**
   ```bash
   git checkout main && git pull origin main
   npm install
   git checkout -b <nama-branch-masing-masing>
   ```
2. **Gelombang 1 (Merge P1 — Azlan):** Merge `feature/aslab-lab-management` → `main`. PM menjalankan `npm run validate` dan deploy `firestore.rules` & `firestore.indexes.json`.
3. **Gelombang 2 (Merge P2 — Farrel):** Farrel `git pull origin main`, verifikasi integrasi dengan `labService.js` & tipe baru, lalu merge `feature/aslab-dashboard-fines` → `main`.
4. **Gelombang 3 (Merge P3 — Marchella):** Marchella `git pull origin main`, pastikan semua route baru (`/dashboard-aslab`, `/bulk-insert`, `/transfer-lab`, `/tagihan-denda`, `/riwayat-pembayaran`) terpasang rapi di `_layout.tsx` & dashboard, lalu merge `feature/xendit-payment-ui-final` → `main`.

---

## 6. Standar Git, Commit, & Quality Gate Wajib

- **Format Commit:** Conventional Commits Bahasa Indonesia dengan **Head & Body** (`feat(scope): ...`, `refactor(scope): ...`, `fix(scope): ...`) dan **TANPA Co-Author**.
- **Tanpa Emoji:** Gunakan ikon `@expo/vector-icons/Ionicons`, hindari emoji di UI.
- **Quality Gate Sebelum PR:**
  ```bash
  npm run validate        # expo lint && npx tsc --noEmit && jest --runInBand
  ```
- **Keamanan Wajib:** Dilarang keras memasukkan `xnd_development_`, `XENDIT_WEBHOOK_TOKEN`, atau Firebase Service Account JSON ke kode `src/` maupun ke Git!
