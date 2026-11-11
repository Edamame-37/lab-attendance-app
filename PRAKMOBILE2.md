# Dokumen Software Requirements Specification (SRS) & Perancangan Sprint 2
## Sistem Presensi Praktikum Laboratorium dengan Firebase & AI

Dokumen ini memuat analisis kebutuhan sistem, Software Requirements Specification (SRS) resmi Sprint 2, prinsip isolasi data, serta rincian implementasi modul **Programmer Farrel** (SRS-FT-02, SRS-FT-03, SRS-FT-04) pada repository `lab-attendance-app`.

---

## 1. Tabel Software Requirements Specification (SRS) Sprint 2

| Kode SRS | Deskripsi Kebutuhan Sistem | Prinsip Data Isolation |
| :--- | :--- | :--- |
| **SRS-FT-01** | Sistem harus menyediakan fungsi registrasi, login, dan logout pengguna berbasis Firebase Authentication. Sistem menyimpan data profil pengguna (nama, NIM/NIP, email, role: `praktikan` \| `asisten`) pada koleksi Firestore `users`. | Berlaku: Pengguna hanya dapat membaca dan memperbarui data profil miliknya sendiri berdasarkan `request.auth.uid == userId`. |
| **SRS-FT-02** | Asisten dapat melakukan operasi CRUD (Create, Read, Update, Delete) pada data praktikum, kelas, dan jadwal sesi di Firestore. Praktikan hanya memiliki akses membaca jadwal dan sesi terkait. | Berlaku: Data kelas/sesi terbuka untuk dibaca oleh seluruh user terautentikasi, namun hanya pengguna dengan atribut `role == 'asisten'` yang dapat menambah, mengubah, atau menghapus data. |
| **SRS-FT-03** | Praktikan dapat melakukan pencatatan presensi saat sesi berstatus `open`. Sistem harus menyimpan identitas praktikan, timestamp, dan ID sesi ke dalam koleksi Firestore `attendances` serta mencegah presensi lebih dari satu kali per sesi. | Berlaku: Praktikan hanya dapat membuat dokumen presensi untuk dirinya sendiri (`request.resource.data.studentId == request.auth.uid`). Praktikan tidak dapat mengubah presensi praktikan lain. |
| **SRS-FT-04** | Sistem harus menerapkan real-time listener (`onSnapshot`) pada koleksi Firestore `sessions` dan `attendances` agar perubahan status sesi dan daftar presensi langsung tercermin pada UI tanpa perlu reload aplikasi. | Berlaku: Listener memfilter data presensi pada sisi Praktikan hanya untuk data dirinya sendiri (`studentId == auth.uid`), sedangkan Asisten dapat memantau seluruh presensi pada sesi terkait. |
| **SRS-FT-05** | Praktikan dapat mengisi dan mengirimkan formulir pengajuan izin ketidakhadiran untuk sesi tertentu. Data tersimpan di Firestore koleksi `leave_requests` dengan status awal `pending`. | Berlaku: Praktikan hanya dapat membuat dan melihat daftar pengajuan izin yang mana `studentId` cocok dengan `request.auth.uid`. |
| **SRS-FT-06** | Sistem harus mengirimkan teks alasan izin ke REST API Model AI pengajar, menerima hasil estimasi/kategori alasan (misal: Sakit, Acara Keluarga, Dispen), dan menyimpannya bersama dokumen `leave_requests`. Model AI tidak secara otomatis menentukan status persetujuan. | Tidak berlaku: Layanan AI bersifat stateless API processing dan tidak menyimpan state personal user; kredensial request diikat pada sesi pengguna aktif. |
| **SRS-FT-07** | Asisten dapat melihat daftar pengajuan izin praktikan beserta alasan dan prediksi AI, kemudian menentukan keputusan (`approved` atau `rejected`). Keputusan tersimpan di Firestore dan ter-update secara real-time di layar praktikan. | Berlaku: Hanya user bertipe asisten yang memiliki hak akses mutasi pada field `status` dan `reviewedBy` di dokumen `leave_requests`. |
| **SRS-FT-08** | Sistem harus melakukan validasi input pada formulir, menangani error koneksi Firestore/API AI, serta menerapkan Firebase Security Rules untuk membatasi query dan mencegah bypass data dari client. | Berlaku: Keamanan data ditegakkan langsung di level Firestore Security Rules berdasarkan token JWT `request.auth` dan peran user (`request.auth.token.role`). |

---

## 2. Tabel Pembagian Tugas Programmer Sprint 2

| Programmer | Nama Branch Git | Kode SRS | Fitur yang Dikerjakan | Path Folder & Berkas Spesifik |
| :--- | :--- | :--- | :--- | :--- |
| **Azlan** | `feature/auth-user-management` | SRS-FT-01<br>SRS-FT-08 | Autentikasi Firebase, Auth Context, Role Management, & Security Rules | `src/config/firebase.js`<br>`src/context/AuthContext.js`<br>`src/services/authService.js`<br>`src/screens/auth/LoginScreen.js`<br>`src/screens/auth/RegisterScreen.js`<br>`firestore.rules` |
| **Farrel** *(Modul Ini)* | `feature/lab-attendance-firestore` | **SRS-FT-02<br>SRS-FT-03<br>SRS-FT-04** | **CRUD Sesi/Kelas Firestore, Presensi Terintegrasi 1x per Sesi, Real-Time Listener & Live Recap** | `src/services/firestoreService.js`<br>`src/hooks/useAttendance.js`<br>`src/screens/asisten/SessionManageScreen.js`<br>`src/screens/praktikan/AttendanceScanScreen.js`<br>`src/components/asisten/AttendanceRecapCard.js` |
| **Syair** | `feature/leave-permission-ai` | SRS-FT-05<br>SRS-FT-06<br>SRS-FT-07 | Pengajuan Izin Praktikan, Integrasi REST API Model AI, & Verifikasi Asisten | `src/services/aiService.js`<br>`src/services/permissionService.js`<br>`src/screens/praktikan/LeaveRequestScreen.js`<br>`src/screens/praktikan/LeaveStatusScreen.js`<br>`src/screens/asisten/LeaveReviewScreen.js`<br>`src/components/common/AIBadge.js` |

---

## 3. Rincian Implementasi Modul Farrel (SRS-FT-02, SRS-FT-03, SRS-FT-04)

### A. Layanan Terpusat: `src/services/firestoreService.js`
- **SRS-FT-02 (CRUD Sesi & Buka/Tutup)**:
  - `getSessions()` & `getSessionById()`: Mengambil daftar sesi praktikum.
  - `createSession(data)`: Menambahkan sesi praktikum baru ke koleksi `sessions`.
  - `updateSession(id, data)` & `deleteSession(id)`: Mengubah dan menghapus dokumen sesi.
  - `openSession(id, ruangLab, catatan)`: Mengubah status menjadi `'open'` / `'DIBUKA'` dan mencatat waktu mulai.
  - `closeSession(id)`: Mengubah status menjadi `'closed'` / `'SELESAI'` dan mengunci presensi.
- **SRS-FT-03 (Presensi 1x per Sesi)**:
  - `checkExistingAttendance(sessionId, studentId)`: Validasi keberadaan presensi.
  - `submitAttendance(payload)`: Menyimpan presensi dengan document ID `${sessionId}_${studentId}` untuk garansi idempotensi dan menolak submit ganda.
- **SRS-FT-04 (Real-Time Subscriptions)**:
  - `subscribeToSessions()`, `subscribeToActiveSessions()`, `subscribeToSessionAttendances()`, dan `subscribeToUserAttendance()`.

### B. Hook Real-Time: `src/hooks/useAttendance.js`
- Mengelola subscription `onSnapshot` Firestore dengan pembersihan listener (*cleanup*) otomatis.
- Menyediakan status rekap live (`hadir`, `izin`, `sakit`, `totalPesertaHadir`), state error, serta fungsi `refresh()` untuk pemulihan koneksi.

### C. Komponen Visualisasi Live: `src/components/asisten/AttendanceRecapCard.js`
- Menampilkan status badge **LIVE**.
- Menampilkan ringkasan metrik statistik kehadiran praktikan.
- Menampilkan daftar nama mahasiswa dan timestamp presensi yang masuk secara live tanpa reload aplikasi.

### D. Layar Kelola Asisten: `src/screens/asisten/SessionManageScreen.js`
- Antarmuka visual untuk membuat sesi praktikum baru, membuka sesi praktikum, menutup sesi, menghapus sesi, dan memantau live recap.
- Dilengkapi banner deteksi gangguan jaringan Firestore dan tombol *Retry*.

### E. Layar Presensi Praktikan: `src/screens/praktikan/AttendanceScanScreen.js`
- Menampilkan sesi yang sedang berstatus dibuka.
- Menyediakan form pilihan status (Hadir, Izin, Sakit) dan catatan.
- Memvalidasi presensi 1x: jika sudah pernah presensi, form otomatis terkunci dan menampilkan banner bukti kehadiran.

---

## 4. Hasil Verifikasi & Pengujian
- **Unit & Logic Validation**: 3/3 pengujian lulus (validasi parameter & pencegahan duplikasi presensi).
- **TypeScript Typecheck**: `npx tsc --noEmit` lulus dengan 0 error.
- **Metro Web Bundler**: `npx expo export --platform web` lulus (905 modul ter-bundle).
- **Merge Check**: 0 conflict terhadap `origin/main`.
