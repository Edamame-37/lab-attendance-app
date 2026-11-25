# Panduan Kerja Teknis Sprint 4 — Programmer 3 (Marchella Arkhina Ratunesia)

* **PIC:** Marchella Arkhina Ratunesia (`24060124120036`)
* **Branch Git:** `feature/xendit-payment-ui-final`
* **Cakupan SRS:** `SRS-FT-22`, `SRS-FT-23`, `SRS-FT-24`
* **Dokumen Kontrak Utama:** [PRAKMOBILE4.md](../PRAKMOBILE4.md)
* **Payment Gateway:** **Xendit (Test Mode — Invoice API v2 & Webhook `x-callback-token`)**
* **Urutan Merge:** **Gelombang 3 (Merge Terakhir ke `main` setelah P1 & P2 masuk)**

---

## 1. Strict Scope — Kepemilikan File Eksklusif (0% Merge Conflict)

Kamu **HANYA** boleh memodifikasi/membuat **18 berkas** berikut. Jangan menyentuh file milik P1 (`src/types/index.ts`, `labService.js`, `firestore.rules`, dll.) maupun P2 (`fineService.js`, `firestoreService.js`, `sesi.tsx`, `AttendanceCheckScreen.js`, dll.), dan **jangan mengubah root `package.json` / `package-lock.json`** (seluruh dependency server backend diisolasi 100% di `backend/package.json`!).

```text
[NEW]    backend/package.json
[NEW]    backend/.env.example
[NEW]    backend/src/firebaseAdmin.js
[NEW]    backend/src/xenditClient.js
[NEW]    backend/src/server.js
[NEW]    src/services/paymentService.js
[NEW]    src/hooks/useFinePaymentNotifications.js
[MODIFY] src/services/notificationService.js
[NEW]    src/screens/praktikan/FinePaymentScreen.js
[NEW]    src/screens/praktikan/PaymentHistoryScreen.js
[NEW]    src/app/tagihan-denda.tsx
[NEW]    src/app/riwayat-pembayaran.tsx
[MODIFY] src/app/_layout.tsx
[MODIFY] src/app/(tabs)/_layout.tsx
[MODIFY] src/app/(tabs)/index.tsx
[MODIFY] src/app/(tabs)/profil.tsx
[MODIFY] src/components/AppHeader.tsx
[NEW]    tests/paymentWebhook.test.js
```

---

## 2. Persiapan Awal Git

```bash
git checkout main
git pull origin main
npm install
git checkout -b feature/xendit-payment-ui-final
```
*(Catatan: Setelah P1 & P2 di-merge ke `main`, lakukan `git pull origin main` pada branch kamu sebelum membuka PR agar seluruh route & integrasi 3 peran terverifikasi 100% tanpa conflict).*

---

## 3. Rincian Tugas & Panduan Implementasi

### A. Backend Payment Gateway Xendit Test Mode (`SRS-FT-22`)

> **Aturan Keamanan Mutlak:**
> - **XENDIT_SECRET_KEY (`xnd_development_...`)**, **XENDIT_WEBHOOK_TOKEN**, dan **Firebase Service Account** **HANYA** boleh dibaca di folder `backend/` via `process.env` (`backend/.env` wajib ter-ignore Git!).
> - Dilarang keras menaruh secret key apa pun di folder `src/` React Native!
> - Status pembayaran (`pending` / `success` / `failed`) **TIDAK BOLEH** ditentukan oleh respons client — wajib diverifikasi oleh backend melalui webhook callback Xendit (`x-callback-token`) atau pengecekan server-to-server ke Xendit API.

1. **`backend/package.json` & `backend/.env.example`**:
   - Dependency ringan: `express`, `cors`, `dotenv`, `firebase-admin`.
   - Scripts: `"start": "node src/server.js"`, `"dev": "node --watch src/server.js"`.
   - `backend/.env.example`:
     ```dotenv
     PORT=4000
     XENDIT_SECRET_KEY=xnd_development_replace_me
     XENDIT_WEBHOOK_TOKEN=replace_with_xendit_webhook_verification_token
     FIREBASE_PROJECT_ID=ppk-mobile-praktikum
     FIREBASE_SERVICE_ACCOUNT_JSON=
     # Atau path file lokal: GOOGLE_APPLICATION_CREDENTIALS=./service-account.json
     ```
2. **`backend/src/firebaseAdmin.js`**:
   - Inisialisasi `firebase-admin` (mendukung `FIREBASE_SERVICE_ACCOUNT_JSON` untuk deploy Render/Railway/Vercel maupun `applicationDefault()` / `GOOGLE_APPLICATION_CREDENTIALS` untuk lokal).
   - Export `adminAuth`, `adminDb`, dan `FieldValue`.
3. **`backend/src/xenditClient.js`**:
   - Helper autentikasi Basic Auth: `'Basic ' + Buffer.from(`${secretKey}:`).toString('base64')`.
   - `createXenditInvoice({ externalId, amount, description, payerEmail, successRedirectUrl, failureRedirectUrl })`:
     - Memanggil `POST https://api.xendit.co/v2/invoices` dengan `currency: 'IDR'` dan `invoice_duration: 86400`.
     - Mengembalikan `{ id, external_id, invoice_url, status, expiry_date }`.
   - `getXenditInvoiceById(invoiceId)`:
     - Memanggil `GET https://api.xendit.co/v2/invoices/${invoiceId}` untuk sinkronisasi server-to-server.
   - `verifyXenditCallbackToken(receivedToken, expectedToken)`:
     - Verifikasi aman menggunakan `crypto.timingSafeEqual` (tolak `401` jika token kosong/tidak cocok).
   - `mapXenditStatusToPaymentStatus(xenditStatus)`:
     - `'PAID'` atau `'SETTLED'` → `'success'`
     - `'PENDING'` → `'pending'`
     - `'EXPIRED'` atau status gagal lain → `'failed'`
4. **`backend/src/server.js`**:
   - Middleware autentikasi `verifyFirebaseBearerToken`: membaca `Authorization: Bearer <idToken>` lalu memverifikasi dengan `adminAuth.verifyIdToken(token)`.
   - **`GET /health`**: mengembalikan `{ ok: true, provider: 'xendit-test-mode' }`.
   - **`POST /api/payments/create`** *(Protected Bearer Token)*:
     1. Ambil `{ fineId }` dari `req.body`.
     2. Baca dokumen `fines/{fineId}` dari Firestore (`adminDb`).
     3. Validasi: dokumen ada, `fine.studentId === req.user.uid` (isolasi kepemilikan!), `fine.paymentStatus !== 'success'`, dan `fine.amount > 0`.
     4. Buat `externalId = `FINE-${fineId.slice(0, 16)}-${Date.now()}``.
     5. Panggil `createXenditInvoice(...)` menggunakan **`fine.amount` dari Firestore** (jangan pernah percaya nominal dari client!).
     6. Simpan dokumen `payment_transactions/{externalId}` berstatus `'pending'` dan perbarui `fines/{fineId}` (`latestOrderId: externalId`, `latestInvoiceId: invoice.id`, `latestInvoiceUrl: invoice.invoice_url`, `paymentStatus: 'pending'`, `updatedAt`).
     7. Kembalikan HTTP `201`: `{ success: true, externalId, invoiceId: invoice.id, invoiceUrl: invoice.invoice_url, status: 'pending', amount: fine.amount }`.
   - **`POST /api/payments/webhook`** *(Verified via `x-callback-token`)*:
     1. Verifikasi header `req.headers['x-callback-token']` dengan `verifyXenditCallbackToken`. Jika tidak valid → kembalikan HTTP `401`.
     2. Ambil `external_id`, `id`, `status`, `payment_method`, `payment_channel`, `paid_at` dari payload webhook Xendit.
     3. Petakan ke status internal via `mapXenditStatusToPaymentStatus(status)` (`'success' | 'pending' | 'failed'`).
     4. Dalam transaksi Firestore (`adminDb.runTransaction`):
        - Perbarui `payment_transactions/{external_id}` (`status`, `xenditStatus`, `paymentMethod`, `paymentChannel`, `paidAt`, `updatedAt`).
        - Perbarui `fines/{tx.fineId}` (`paymentStatus`, `paidAt` jika `success`, `updatedAt`).
        - **JANGAN menyentuh koleksi `attendances`** (pembayaran denda tidak mengubah status kehadiran!).
     5. Kembalikan HTTP `200`: `{ received: true, status: mappedStatus }`.
   - **`GET /api/payments/status/:externalId`** *(Protected Bearer Token)*:
     - Verifikasi `tx.studentId === req.user.uid`, ambil status terbaru dari `getXenditInvoiceById(tx.xenditInvoiceId)`, sinkronkan ke Firestore jika berubah, dan kembalikan status terverifikasi dari server.

---

### B. Client Payment Service, Layar Tagihan Denda, & Riwayat Pembayaran (`SRS-FT-23`)
1. **`src/services/paymentService.js`**:
   - Baca base URL backend dari `process.env.EXPO_PUBLIC_PAYMENT_API_URL`.
   - `createFinePaymentTransaction(fineId)`: ambil `await auth.currentUser.getIdToken()`, kirim `POST ${API_URL}/api/payments/create` dengan header `Authorization: Bearer ${token}`, tangani error jaringan/server dengan pesan Bahasa Indonesia yang ramah.
   - `syncPaymentStatus(externalId)`: panggil `GET ${API_URL}/api/payments/status/${externalId}` dengan Firebase ID Token (untuk tombol "Periksa Status Pembayaran" setelah praktikan kembali dari halaman Xendit Checkout).
   - `subscribeStudentPaymentTransactions(studentId, onUpdate, onError)`: listener `onSnapshot` pada `payment_transactions` dengan `where('studentId', '==', studentId)` (sort descending di client berdasarkan `createdAt` agar tidak butuh composite index tambahan).
   - `subscribeStudentFinesRealtime(studentId, onUpdate, onError)`: listener `onSnapshot` pada `fines` dengan `where('studentId', '==', studentId)` (atau impor dari `fineService.js` setelah P2 merge).
2. **`src/screens/praktikan/FinePaymentScreen.js` & `src/app/tagihan-denda.tsx`**:
   - Menampilkan ringkasan total tagihan denda tertunda dan daftar seluruh tagihan denda (`fines`) milik praktikan secara real-time.
   - Setiap kartu tagihan menampilkan: nama sesi, laboratorium, durasi keterlambatan (`+X menit`), nominal denda (`Rp 10.000`), tanggal tagihan, badge status (`PENDING` / `SUCCESS` / `FAILED`), serta keterangan: *"Pembayaran denda tidak mengubah status kehadiran praktikum"*.
   - Tombol **"Bayar via Xendit"** (pada tagihan `pending` atau `failed`): memanggil `createFinePaymentTransaction(fine.id)` lalu membuka `invoiceUrl` menggunakan `Linking.openURL(invoiceUrl)` (zero new native dependency!).
   - Tombol **"Cek Status"** (jika sudah punya `latestOrderId` dan masih `pending`): memanggil `syncPaymentStatus(fine.latestOrderId)`.
   - Menangani kondisi: loading, daftar kosong (`EmptyState`), dan error jaringan/backend tidak terjangkau dengan jelas.
   - Bungkus `src/app/tagihan-denda.tsx` dengan `<RoleRouteGuard allowedRole="praktikan">`.
3. **`src/screens/praktikan/PaymentHistoryScreen.js` & `src/app/riwayat-pembayaran.tsx`**:
   - Menampilkan riwayat transaksi pembayaran persisten dari Firestore (`payment_transactions`), tetap tersedia saat aplikasi ditutup & dibuka kembali.
   - Menampilkan seluruh informasi wajib: **informasi sesi (`sessionName`), tanggal tagihan (`billedAt`), nominal (`amount`), waktu transaksi (`paidAt` / `createdAt`), metode/channel pembayaran, dan status (`pending`, `success`, `failed`)**.
   - Sediakan filter cepat (`Semua` | `Success` | `Pending` | `Failed`).
   - Bungkus `src/app/riwayat-pembayaran.tsx` dengan `<RoleRouteGuard allowedRole="praktikan">`.

---

### C. Integrasi Notifikasi Pembayaran & Finalisasi Antarmuka 3 Peran (`SRS-FT-24`)
1. **`src/services/notificationService.js`**:
   - Pertahankan fungsi Sprint 3 eksisting, dan tambahkan 3 helper notifikasi Sprint 4 (tanpa emoji, gunakan teks profesional):
     - `notifyFineCreated({ sessionName, amount, fineId })` — saat tagihan denda baru dibuat.
     - `notifyPaymentSuccess({ sessionName, amount, externalId })` — saat pembayaran berhasil (`success`).
     - `notifyPaymentFailedOrPending({ sessionName, amount, status, externalId })` — saat pembayaran gagal (`failed`) atau butuh penyelesaian lebih lanjut.
2. **`src/hooks/useFinePaymentNotifications.js`**:
   - Hook yang aktif ketika `isAuthenticated && role === 'praktikan'` untuk memantau perubahan real-time pada koleksi `fines` milik praktikan.
   - Abaikan snapshot awal (agar tidak spam notifikasi saat baru login), lalu bandingkan state sebelumnya dengan snapshot baru:
     - Jika ada dokumen `fine` baru muncul → panggil `notifyFineCreated(...)`.
     - Jika `paymentStatus` berubah menjadi `'success'` → panggil `notifyPaymentSuccess(...)`.
     - Jika `paymentStatus` berubah menjadi `'failed'` → panggil `notifyPaymentFailedOrPending(...)`.
3. **Finalisasi Navigasi & UI 3 Peran (`aslab`, `asisten`, `praktikan`)**:
   - **`src/app/_layout.tsx`**:
     - Pasang `useFinePaymentNotifications()` pada `RootNavigator`.
     - Perbarui `Stack.Protected` untuk 3 peran:
       - `guard={role === 'aslab'}`: `/dashboard-aslab`, `/lokasi-lab`, `/bulk-insert`, `/transfer-lab`.
       - `guard={role === 'asisten'}`: `/sesi`, `/review-izin`.
       - `guard={role === 'praktikan'}`: `/presensi-lokasi`, `/pengajuan-izin`, `/status-izin`, `/tagihan-denda`, `/riwayat-pembayaran`.
       - Semua akun aktif: `/(tabs)`, `/peta-lab`.
   - **`src/app/(tabs)/_layout.tsx`**:
     - Tab `Jadwal` / Beranda (`index`): semua peran aktif.
     - Tab `Presensi` (`presensi`): `role === 'praktikan'`.
     - Tab `Rekap` (`rekap`): `role === 'asisten' || role === 'aslab'`.
     - Tab `Profil` (`profil`): semua peran aktif.
   - **`src/app/(tabs)/index.tsx`**:
     - Tampilkan shortcut modern & konsisten sesuai 3 peran:
       - **Aslab**: `Dashboard Lab` (`/dashboard-aslab`), `Kelola Lab` (`/lokasi-lab`), `Bulk Insert` (`/bulk-insert`), `Transfer Lab` (`/transfer-lab`), `Peta Lab` (`/peta-lab`).
       - **Asprak (`asisten`)**: `Kelola Sesi` (`/sesi`), `Review Izin` (`/review-izin`), `Peta Lab` (`/peta-lab`). *(Tidak ada tombol Kelola Lab / Bulk / Transfer!)*.
       - **Praktikan**: `Presensi Lokasi` (`/presensi-lokasi`), `Tagihan Denda` (`/tagihan-denda`), `Riwayat Bayar` (`/riwayat-pembayaran`), `Ajukan Izin` (`/pengajuan-izin`), `Status Izin` (`/status-izin`), `Peta Lab` (`/peta-lab`).
   - **`src/app/(tabs)/profil.tsx` & `src/components/AppHeader.tsx`**:
     - Perbarui mapping label 3 peran secara konsisten (tanpa emoji, menggunakan `Ionicons`):
       - `praktikan` → `'Praktikan'` (`school-outline`)
       - `asisten` → `'Asisten Praktikum (Asprak)'` (`clipboard-outline`)
       - `aslab` → `'Asisten Laboratorium (Aslab)'` (`shield-checkmark-outline`)
     - Pastikan switcher peran di `AppHeader` & `Profil` menampilkan seluruh `availableRoles` yang dimiliki akun secara rapi dan konsisten di light/dark mode.

---

## 4. Pengujian & Atomic Commits

Buat **`tests/paymentWebhook.test.js`** yang menguji:
1. `verifyXenditCallbackToken`: mengembalikan `true` untuk token persis sama dan `false` untuk token salah/kosong/panjang berbeda.
2. `mapXenditStatusToPaymentStatus`: `PAID` & `SETTLED` → `'success'`, `PENDING` → `'pending'`, `EXPIRED` → `'failed'`.

Jalankan verifikasi sebelum commit & PR:
```bash
npm run validate
cd backend && npm install && node --check src/server.js
```

### Saran Urutan Atomic Commits (Head & Body Bahasa Indonesia, Tanpa Co-Author):
1. `feat(backend): implementasikan server pembayaran Xendit Test Mode dan verifikasi webhook`
2. `feat(payment): tambahkan paymentService, layar tagihan denda, dan riwayat pembayaran praktikan`
3. `feat(notifications): integrasikan notifikasi otomatis tagihan denda dan status pembayaran`
4. `feat(ui,navigation): finalisasi navigasi terproteksi dan antarmuka konsisten untuk 3 peran`
