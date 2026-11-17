# Dokumen Rencana Implementasi Revisi Sprint 2
## Sistem Presensi Praktikum Laboratorium — Cloud Firestore & Real-Time Sync
**Fokus Modul Programmer Farrel: SRS-FT-02, SRS-FT-03, SRS-FT-04**  
*Berdasarkan Panduan Revisi Resmi: `ppk praktikum.pdf`*

---

## 1. Pendahuluan

Dokumen ini disusun sebagai acuan teknis pelaksanaan revisi Sprint 2 untuk aplikasi **Presensi Praktikum Mobile**. Revisi ini didasarkan pada dokumen evaluasi pengajar yang tercantum dalam file `ppk praktikum.pdf`. Dokumen ini merinci analisis kebutuhan, kesenjangan sistem saat ini (*gap analysis*), desain arsitektur data Firestore, rancangan berkas dan rute baru, serta panduan langkah demi langkah implementasi sebelum kode direvisi, dengan fokus utama pada cakupan tanggung jawab **Programmer Farrel** (**SRS-FT-02**, **SRS-FT-03**, dan **SRS-FT-04**).

---

## 2. Matriks Pemetaan Revisi Berdasarkan Dokumen Evaluasi (`ppk praktikum.pdf`)

Berikut adalah ringkasan seluruh revisi yang diwajibkan dalam dokumen evaluasi pengajar:

| Kode SRS | Deskripsi Kebutuhan Revisi (Panduan PDF) | File yang Berkaitan Sesuai Panduan | Penanggung Jawab |
| :--- | :--- | :--- | :---: |
| **SRS-FT-01** | **Integrasi Autentikasi Firebase**:<br>• Gunakan Firebase Auth metode email/password (hapus Google Sign-In jika ada).<br>• Register hanya untuk akun Praktikan, Asisten menggunakan akun yang sudah disediakan.<br>• Ambil profil & role dari Firestore untuk kontrol hak akses.<br>• Persistensi status login saat aplikasi dibuka kembali. | `src/context/AuthContext.js`<br>`src/services/authService.js`<br>Halaman login & register | Azlan |
| **SRS-FT-02** | **Integrasi Pengelolaan Sesi dengan Cloud Firestore**:<br>• Ubah sumber data sesi dari local/dummy menjadi Firestore.<br>• Asisten dapat menambah, mengubah, menghapus, dan melihat sesi praktikum (CRUD).<br>• Praktikan dapat melihat informasi sesi praktikum yang tersedia.<br>• Lengkapi data praktikum, kelas, dan peserta bila belum tersedia.<br>• Asisten dapat mengatur sesi dan praktikan dapat melihat informasi sesi. | **`src/app/sesi.tsx`**<br>File service dan komponen terkait sesi | **Farrel** *(Fokus)* |
| **SRS-FT-03** | **Integrasi Pencatatan Presensi dengan Cloud Firestore**:<br>• Ubah penyimpanan presensi dari local state menjadi Firestore.<br>• Pastikan data presensi menyimpan identitas Praktikan, sesi, dan waktu kehadiran.<br>• Presensi hanya dapat dilakukan ketika sesi dibuka (`open`) dan **tidak dapat dilakukan dua kali pada sesi yang sama**. | **`src/app/presensi-firestore.tsx`**<br>File service presensi | **Farrel** *(Fokus)* |
| **SRS-FT-04** | **Penerapan Sinkronisasi Data Real-Time**:<br>• Gunakan `onSnapshot` untuk memantau perubahan data sesi dan presensi.<br>• Perubahan status sesi dan pencatatan presensi langsung ter-update di layar Praktikan dan Asisten tanpa reload manual. | File service sesi & presensi, komponen tampilan terkait | **Farrel** *(Fokus)* |
| **SRS-FT-05** | **Pengembangan Pengajuan Izin Praktikan**:<br>• Formulir pengajuan izin dengan pilihan sesi dan alasan ketidakhadiran.<br>• Simpan ke Firestore dengan identitas praktikan dan status awal `pending`.<br>• Praktikan dapat melihat pengajuan miliknya. | `src/app/pengajuan-izin.tsx`<br>File service pengajuan izin | Syair |
| **SRS-FT-06** | **Integrasi Model AI EDOM Secara Lokal**:<br>• Integrasi model AI dari file ZIP panduan ke dalam aplikasi secara lokal.<br>• Klasifikasi alasan pengajuan izin menggunakan model lokal.<br>• Hilangkan penggunaan REST API eksternal jika masih ada. | File model AI & service klasifikasi AI | Syair |
| **SRS-FT-07** | **Verifikasi dan Pemantauan Status Izin**:<br>• Halaman Asisten untuk meninjau pengajuan izin + hasil klasifikasi AI.<br>• Aksi setujui/tolak pengajuan dan simpan keputusan ke Firestore.<br>• Praktikan dapat memantau status verifikasi pengajuan miliknya. | `src/app/review-izin.tsx`<br>`src/app/status-izin.tsx`<br>File service pengajuan izin | Syair |
| **SRS-FT-08** | **Validasi & Pembatasan Akses Pengguna**:<br>• Pembatasan halaman/menu berdasarkan role Praktikan dan Asisten.<br>• Penerapan Firebase Security Rules untuk membatasi akses data.<br>• Validasi input dan error handling autentikasi, Firestore, dan AI. | `src/context/AuthContext.js`<br>File service, Firebase Security Rules | Tim / Azlan |

---

## 3. Analisis Kesenjangan (*Gap Analysis*) — Modul Farrel

Perbandingan antara implementasi awal Sprint 2 dengan target spesifikasi revisi PDF:

| Aspek | Kondisi Saat Ini (Sprint 2 Awal) | Target Kondisi Revisi (Sesuai `ppk praktikum.pdf`) | Tindakan Revisi yang Diperlukan |
| :--- | :--- | :--- | :--- |
| **Rute Layar Sesi (SRS-FT-02)** | Dikelola pada `src/screens/asisten/SessionManageScreen.js` dan diuji melalui `src/app/test-farrel.tsx`. | Panduan PDF menetapkan rute resmi Expo Router: **`src/app/sesi.tsx`**. | **Buat file layar `src/app/sesi.tsx`** sebagai rute resmi Expo Router yang adaptif peran (menampilkan CRUD Sesi & Kontrol Buka/Tutup untuk Asisten, serta daftar informasi sesi praktikum untuk Praktikan). |
| **Kelengkapan Data Praktikum & Peserta (SRS-FT-02)** | Dokumen sesi hanya mencakup data sesi dasar (nama, kelas, jam, ruang) tanpa relasi daftar peserta praktikan per kelas. | Panduan PDF meminta: *"Melengkapi data praktikum, kelas, dan peserta apabila belum tersedia dalam implementasi."* | Tambahkan struktur data kelas (`classes`) dan array daftar peserta/NIM mahasiswa per kelas pada Firestore, serta sediakan fungsi inisialisasi / *seed data* awal. |
| **Rute Layar Presensi (SRS-FT-03)** | Dikelola pada `src/screens/praktikan/AttendanceScanScreen.js`. | Panduan PDF menetapkan rute resmi Expo Router: **`src/app/presensi-firestore.tsx`**. | **Buat file layar `src/app/presensi-firestore.tsx`** sebagai rute resmi Expo Router khusus pencatatan presensi terintegrasi Cloud Firestore dengan validasi anti-duplikasi 1x. |
| **Sumber Data Presensi (SRS-FT-03)** | Di tab presensi Sprint 1 masih terdapat sisa local state / dummy data di `src/app/(tabs)/presensi.tsx`. | Seluruh alur presensi harus 100% menggunakan Cloud Firestore tanpa bergantung pada local state dummy. | Hubungkan alur presensi langsung ke koleksi Firestore `attendances` via `src/app/presensi-firestore.tsx` dan tautkan navigasinya. |
| **Pencegahan Presensi Ganda (SRS-FT-03)** | Sudah ada pemeriksaan dasar `checkExistingAttendance` dan deterministic doc ID. | Validasi harus ditegakkan ketat: sesi harus berstatus dibuka (`open`), dan form terkunci jika mahasiswa sudah presensi pada sesi yang sama. | Pertahankan dan perkuat validasi di level service dan antarmuka dengan umpan balik banner status yang jelas. |
| **Sinkronisasi Real-Time (SRS-FT-04)** | Menggunakan `onSnapshot` di `useAttendance.js`. | Listener `onSnapshot` harus memantau perubahan data sesi dan presensi secara real-time pada `sesi.tsx` dan `presensi-firestore.tsx`. | Pastikan listener `onSnapshot` terpasang rapi di kedua layar baru dengan pembersihan memori (*cleanup subscription*) saat unmount. |

---

## 4. Perancangan Struktur Data Cloud Firestore

### A. Koleksi `sessions` (Data Sesi Praktikum)
Path: `/sessions/{sessionId}`
```typescript
interface SessionDocument {
  id: string;                      // Auto-generated Firestore ID
  kodeMataKuliah: string;          // Contoh: "PPK-2026"
  namaPraktikum: string;           // Contoh: "Praktikum Perangkat Keras"
  topikMateri: string;             // Contoh: "Modul 3: Firebase Integration"
  kelas: string;                   // Contoh: "TI-3A"
  ruangLab: string;                // Contoh: "Laboratorium Komputer 2"
  hari: string;                    // Contoh: "Senin"
  jamMulai: string;                // Contoh: "08:00"
  jamSelesai: string;              // Contoh: "10:30"
  namaAsisten: string;             // Contoh: "Farrel / Asisten Lab"
  asistenId: string;               // UID Asisten dari Firebase Auth
  status: 'open' | 'closed';       // Status kontrol sesi (open = dibuka presensi)
  statusSesi: 'DIBUKA' | 'DITUTUP' | 'SELESAI'; // Kompatibilitas format Sprint 1
  catatanPembuka?: string;         // Pesan/pengumuman dari asisten saat sesi dibuka
  waktuBuka: Timestamp | null;     // Server timestamp saat dibuka
  waktuTutup: Timestamp | null;    // Server timestamp saat ditutup
  daftarPeserta?: {                // Daftar mahasiswa terdaftar di sesi/kelas ini
    studentId: string;
    nim: string;
    nama: string;
  }[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### B. Koleksi `attendances` (Data Presensi Praktikan)
Path: `/attendances/{sessionId_studentId}`
*Dokumen ID diformat secara deterministik: `${sessionId}_${studentId}` untuk menjamin presensi tidak dapat terduplikasi di level basis data (idempotency guarantee).*
```typescript
interface AttendanceDocument {
  id: string;                      // Format: `${sessionId}_${studentId}`
  sessionId: string;               // Referensi ID sesi terkait
  namaPraktikum: string;           // Cache nama praktikum
  topikMateri: string;             // Cache topik materi
  studentId: string;               // UID Praktikan dari Firebase Auth
  studentName: string;             // Nama lengkap praktikan
  studentNim: string;              // NIM mahasiswa praktikan
  studentClass: string;            // Kelas praktikan (misal: "TI-3A")
  statusKehadiran: 'HADIR' | 'IZIN' | 'SAKIT';
  catatan?: string;                // Catatan opsional dari praktikan
  waktuPresensi: string;           // String jam format "08:15:30 WIB"
  tanggal: string;                 // Format "YYYY-MM-DD"
  timestamp: Timestamp;            // Server timestamp pencatatan
}
```

### C. Koleksi `classes` (Data Master Kelas & Peserta — SRS-FT-02 Pelengkap)
Path: `/classes/{classId}`
```typescript
interface ClassDocument {
  id: string;                      // Contoh: "TI-3A"
  namaKelas: string;               // Contoh: "Teknik Informatika 3A"
  mataKuliah: string;              // Contoh: "Praktikum Pemrograman Perangkat Keras"
  tahunAjaran: string;             // Contoh: "2025/2026"
  peserta: {
    studentId: string;
    nim: string;
    nama: string;
    email: string;
  }[];
}
```

---

## 5. Rencana Arsitektur Berkas yang Dibuat & Diperbarui

Berdasarkan dokumen revisi, berikut struktur berkas yang menjadi tanggung jawab Programmer Farrel:

```
lab-attendance-app/
├── src/
│   ├── app/
│   │   ├── sesi.tsx                  <-- [BARU - SRS-FT-02] Layar Pengelolaan Sesi Praktikum
│   │   ├── presensi-firestore.tsx    <-- [BARU - SRS-FT-03] Layar Presensi Cloud Firestore
│   │   └── (tabs)/
│   │       ├── index.tsx             <-- [UPDATE] Penautan navigasi ke sesi.tsx
│   │       └── presensi.tsx          <-- [UPDATE] Penautan navigasi ke presensi-firestore.tsx
│   ├── components/
│   │   └── asisten/
│   │       └── AttendanceRecapCard.js<-- [UPDATE] Penyempurnaan metrik live recap
│   ├── hooks/
│   │   └── useAttendance.js          <-- [UPDATE - SRS-FT-04] Hook real-time listener terpadu
│   └── services/
│       └── firestoreService.js       <-- [UPDATE - SRS-FT-02, 03, 04] Service Firestore komprehensif
├── implementasi.md                    <-- [DOKUMEN INI] Panduan implementasi revisi
└── PRAKMOBILE2.md                    <-- [DOKUMEN SRS] Dokumen persyaratan sistem
```

---

## 6. Rincian Teknis Implementasi Tiap Berkas

### A. Layar `src/app/sesi.tsx` (SRS-FT-02)
Layar ini adalah rute Expo Router resmi untuk **Pengelolaan dan Tampilan Sesi Praktikum**:
- **Logika Peran Asisten**:
  - Menampilkan daftar seluruh sesi dari Firestore secara real-time.
  - Tombol **"+ Tambah Sesi"**: Modal form untuk memasukkan mata kuliah, topik, kelas, ruang lab, hari, dan rentang jam.
  - Tombol **"Buka Sesi"**: Mengubah status sesi menjadi `open` (`DIBUKA`), mengisi ruang lab aktif, dan catatan pembuka bagi praktikan.
  - Tombol **"Tutup Sesi"**: Mengubah status sesi menjadi `closed` (`SELESAI`) dan mengunci presensi.
  - Tombol **"Ubah Sesi"** & **"Hapus Sesi"**: Operasi edit dan delete dokumen sesi pada Firestore.
  - Menampilkan komponen `AttendanceRecapCard` secara live di bagian atas ketika ada sesi yang sedang dibuka.
- **Logika Peran Praktikan**:
  - Menampilkan informasi jadwal dan sesi yang relevan dengan kelas mahasiswa.
  - Menampilkan status sesi (DIBUKA dengan indikator hijau berkedip / DITUTUP).
  - Jika sesi dibuka, tersedia tombol pintas langsung menuju `src/app/presensi-firestore.tsx`.
- **Dukungan Kelengkapan Data**:
  - Menyediakan tombol pemuatan data awal (*seed initial classes/sessions*) jika koleksi di Firestore masih kosong.

### B. Layar `src/app/presensi-firestore.tsx` (SRS-FT-03)
Layar ini adalah rute Expo Router resmi untuk **Pencatatan Presensi Praktikan berbasis Firestore**:
- **Identitas Mahasiswa**:
  - Menampilkan nama, NIM, dan kelas praktikan aktif (diambil dari AuthContext / AppContext).
- **Deteksi Sesi Aktif Real-Time**:
  - Menampilkan daftar sesi praktikum yang saat ini berstatus `open` secara live (`onSnapshot`).
  - Jika tidak ada sesi yang dibuka oleh asisten, tampilkan *Empty State*: *"Belum ada sesi praktikum yang dibuka oleh asisten saat ini."*
- **Pengecekan Anti-Duplikasi (Validasi 1x)**:
  - Sebelum submit, sistem memeriksa apakah dokumen `${sessionId}_${studentId}` sudah ada di koleksi `attendances`.
  - **Jika sudah presensi**: Formulir otomatis terkunci dan menampilkan kartu hijau terverifikasi:
    `✓ Presensi Anda Telah Tercatat` lengkap dengan waktu pencatatan dan status kehadiran. Tombol submit dinonaktifkan.
  - **Jika belum presensi**: Menampilkan pilihan status (HADIR, IZIN, SAKIT), field catatan opsional, dan tombol **"Kirim Presensi Sekarang"**.
- **Aksi Pengiriman Presensi**:
  - Memanggil `submitAttendance()` yang memvalidasi ulang status sesi dan menyimpan data presensi ke Firestore dengan `serverTimestamp()`.

### C. Pembaruan `src/services/firestoreService.js` (SRS-FT-02, 03, 04)
Fungsi-fungsi yang disempurnakan:
1. `getSessions()` & `getSessionById(sessionId)`
2. `createSession(sessionData)`: Menambah sesi baru dengan validasi field wajib.
3. `updateSession(sessionId, updateData)`: Memperbarui detail sesi (materi, kelas, ruang, jam).
4. `deleteSession(sessionId)`: Menghapus sesi praktikum.
5. `openSession(sessionId, ruangLab, catatan)`: Mutasi status menjadi `open`.
6. `closeSession(sessionId)`: Mutasi status menjadi `closed`.
7. `checkExistingAttendance(sessionId, studentId)`: Pengecekan riwayat presensi.
8. `submitAttendance(payload)`: Pencatatan presensi dengan validasi sesi buka & pencegahan duplikasi.
9. `seedInitialPracticalData()`: Inisialisasi data master praktikum, kelas, dan peserta jika database kosong.
10. `subscribeToSessions()` & `subscribeToSessionAttendances()`: Listener `onSnapshot` real-time.

### D. Pembaruan `src/hooks/useAttendance.js` (SRS-FT-04)
- Menangani siklus hidup listener `onSnapshot` untuk sesi dan kehadiran.
- Menyediakan fungsi pemulihan (*error recovery*) dan `refresh()` saat koneksi internet terganggu.
- Menyediakan komputasi statistik kehadiran live (`hadir`, `izin`, `sakit`, total masuk).

---

## 7. Rencana Tahapan Eksekusi (*Execution Plan*)

Berikut urutan langkah yang akan dikerjakan untuk menyelesaikan revisi ini:

```
[Tahap 1: Service Layer]
Penyempurnaan firestoreService.js (CRUD lengkap, seed data kelas/peserta, presensi 1x)
       ↓
[Tahap 2: Hook Layer]
Penyempurnaan useAttendance.js (Optimasi real-time onSnapshot & state management)
       ↓
[Tahap 3: Layar Sesi (SRS-FT-02)]
Pembuatan src/app/sesi.tsx (CRUD Asisten & Tampilan Sesi Praktikan)
       ↓
[Tahap 4: Layar Presensi (SRS-FT-03)]
Pembuatan src/app/presensi-firestore.tsx (Form Presensi Firestore & Validasi 1x)
       ↓
[Tahap 5: Integrasi Navigasi]
Penautan rute sesi.tsx dan presensi-firestore.tsx pada navigasi utama aplikasi
       ↓
[Tahap 6: Verifikasi & Testing]
Pengujian logic, TypeScript check (npx tsc --noEmit), dan Expo web bundling
       ↓
[Tahap 7: Dokumentasi & Git Commit]
Pembaruan PRAKMOBILE2.md dan commit revisi ke remote GitHub
```

---

## 8. Kriteria Penerimaan & Verifikasi (*Acceptance Criteria*)

- [ ] **SRS-FT-02 Terpenuhi**: Layar [src/app/sesi.tsx](file:///d:/KULIAH_SMT_4/praktikum%20ppk/lab-attendance-app/src/app/sesi.tsx) berfungsi dengan data Cloud Firestore. Asisten dapat membuat, mengedit, menghapus, membuka, dan menutup sesi. Praktikan dapat melihat daftar sesi praktikum.
- [ ] **SRS-FT-03 Terpenuhi**: Layar [src/app/presensi-firestore.tsx](file:///d:/KULIAH_SMT_4/praktikum%20ppk/lab-attendance-app/src/app/presensi-firestore.tsx) dapat mencatat presensi ke Firestore. Presensi hanya bisa dikirim saat sesi berstatus `open`, dan sistem memblokir presensi ganda (maksimal 1x per sesi).
- [ ] **SRS-FT-04 Terpenuhi**: Perubahan status sesi (buka/tutup) dan masuknya presensi mahasiswa tercermin secara instan (*real-time*) di layar pengguna tanpa perlu reload aplikasi.
- [ ] **Kualitas Kode**: `npx tsc --noEmit` lolos dengan 0 error dan `npx expo export --platform web` berhasil membundel seluruh modul tanpa kesalahan.
- [ ] **Bebas Konflik**: Branch tetap bersih dan tidak bentrok dengan modul anggota tim lain.
