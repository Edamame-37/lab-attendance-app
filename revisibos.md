# Rangkuman Revisi Sprint 2 (Scope: Programmer Farrel)

Dokumen ini merangkum seluruh perubahan dan penambahan fitur yang telah dikerjakan untuk memenuhi evaluasi **Sprint 2 (SRS-FT-02, SRS-FT-03, SRS-FT-04)** sesuai pedoman pada `ppk praktikum.pdf`.

---

## 1. Komparasi Cepat: Sebelumnya vs. Sesudah Revisi

| Aspek | Kondisi Sebelumnya | Kondisi Sekarang (Setelah Revisi) |
| :--- | :--- | :--- |
| **Penyimpanan Sesi (SRS-FT-02)** | Masih dummy array lokal di memory (`useState`) dan rute `/sesi` belum ada. | Terhubung penuh ke Cloud Firestore (`sessions`), asisten bisa CRUD, buka/tutup sesi, dan tersedia rute khusus `src/app/sesi.tsx`. |
| **Data Kelas & Peserta** | Belum ada struktur data kelas praktikum dan daftar peserta. | Koleksi Firestore `classes` disiapkan lengkap dengan daftar peserta (`enrolledStudents`), jadwal, dan tombol inisialisasi (*Seed Data*). |
| **Presensi Praktikan (SRS-FT-03)** | Form presensi masih berbasis dummy lokal (`/presensi`), belum terhubung langsung ke Firestore. | Menggunakan rute baru `src/app/presensi-firestore.tsx` yang langsung menyimpan ke koleksi `attendances` di Cloud Firestore. |
| **Identitas Praktikan** | Input teks manual untuk NIM & nama. | Otomatis membaca identitas dari akun aktif (`useAuth()` - nama, email, NIM/UID). |
| **Validasi & Duplikasi** | Tidak ada validasi status sesi, praktikan bisa submit berkali-kali. | **Terkunci ketat:** Hanya bisa submit jika sesi berstatus `open`. Menggunakan Document ID deterministik `${sessionId}_${studentId}` sehingga **hanya bisa 1x submit**. Jika sudah presensi, muncul kartu status hijau (terkunci). |
| **Sinkronisasi (SRS-FT-04)** | Data tidak live, perubahan status sesi atau presensi baru tidak langsung muncul. | **100% Real-time** menggunakan Firestore `onSnapshot`. Status sesi dan rekap kehadiran langsung update otomatis di layar asisten dan praktikan tanpa refresh. |

---

## 2. Rincian Penambahan Fitur & Komponen Baru

### A. Layar & Rute Baru
1. **`src/app/sesi.tsx` (SRS-FT-02)**
   - **Tampilan Asisten:**
     - Form pembuatan sesi baru (nama sesi, kelas praktikum, batas waktu).
     - Tombol aksi buka (*open*) dan tutup (*closed*) sesi praktikum secara live.
     - Rekapitulasi kehadiran real-time per sesi (menampilkan jumlah hadir, izin, sakit, dan detail peserta yang masuk).
     - Tombol cepat *Seed Data Praktikum* untuk mengisi kelas dan sesi demo ke Firestore.
   - **Tampilan Praktikan:**
     - Melihat jadwal dan sesi praktikum yang tersedia.
     - Indikator status (*badge* hijau `BUKA` atau abu-abu `DITUTUP`).
     - Tombol navigasi langsung untuk melakukan presensi jika sesi sedang dibuka.

2. **`src/app/presensi-firestore.tsx` (SRS-FT-03)**
   - Form presensi khusus praktikan yang terintegrasi langsung ke Firestore.
   - Pilihan status presensi: **HADIR**, **IZIN**, dan **SAKIT**, beserta catatan opsional.
   - Proteksi multi-level:
     - Tombol *disabled* jika belum memilih sesi atau sesi sedang ditutup (*closed*).
     - Menampilkan kartu verifikasi hijau (*Sudah Melakukan Presensi*) bila sistem mendeteksi praktikan sudah pernah submit pada sesi tersebut.

### B. Service & Hook Firestore
1. **`src/services/firestoreService.js`**
   - Menambahkan fungsi `updateSession` untuk mengubah status sesi (`open` / `closed`) dan `closedAt`.
   - Menambahkan fungsi `seedInitialPracticalData` untuk menginisialisasi kelas praktikum (contoh: Pemrograman Mobile Kelas A & B) beserta daftar peserta dan sesi awal.
   - Mengoptimalkan `recordAttendance` agar menggunakan ID deterministik `${sessionId}_${studentId}` untuk mencegah *race condition* dan duplikasi data.
2. **`src/hooks/useAttendance.js`**
   - Menambahkan eksposur `handleUpdateSession` dan `handleSeedData`.
   - Memastikan listener `onSnapshot` pada koleksi `sessions` dan `attendances` berjalan *clean* dan menangani *unmount* dengan baik.

### C. Pembaruan Navigasi & Tampilan Utama
- **`src/app/(tabs)/index.tsx`**: Ditambahkan kartu navigasi utama untuk mengakses rute `/sesi` (Manajemen Sesi) dan `/presensi-firestore` (Presensi Praktikan).
- **`src/app/(tabs)/presensi.tsx`**: Diberikan banner notifikasi dan tautan cepat ke rute `/presensi-firestore`.

---

## 3. Daftar Berkas yang Dibuat & Diubah

| Status | Lokasi File | Keterangan |
| :--- | :--- | :--- |
| **BARU** | `implementasi.md` | Dokumen perencanaan implementasi dan kriteria pengujian Sprint 2. |
| **BARU** | `revisibos.md` | Dokumen rangkuman singkat hasil revisi untuk tinjauan tim/evaluator. |
| **BARU** | `src/app/sesi.tsx` | Screen Expo Router untuk manajemen sesi praktikum (SRS-FT-02). |
| **BARU** | `src/app/presensi-firestore.tsx` | Screen Expo Router untuk pencatatan presensi praktikan ke Firestore (SRS-FT-03). |
| **DIUBAH** | `src/services/firestoreService.js` | Penambahan update status sesi, seed data kelas/peserta, dan id idempotensi. |
| **DIUBAH** | `src/hooks/useAttendance.js` | Penambahan handler update sesi dan seed data real-time. |
| **DIUBAH** | `src/app/(tabs)/index.tsx` | Tautan banner navigasi ke rute sesi dan presensi baru. |
| **DIUBAH** | `src/app/(tabs)/presensi.tsx` | Banner navigasi pengalihan ke presensi Firestore. |

---

## 4. Hasil Validasi Teknis

1. **Pemeriksaan Tipe (TypeScript)**:
   - Perintah: `npx tsc --noEmit`
   - Hasil: **0 Error (Lolos)**.
2. **Pemeriksaan Kompatibilitas Bundler (Expo Web)**:
   - Perintah: `npx expo export --platform web`
   - Hasil: **917 modul berhasil di-bundle tanpa kendala (Exit code 0)**.
3. **Pencegahan Duplikasi**:
   - Teruji menggunakan format ID unik `${sessionId}_${studentId}` di Cloud Firestore.
