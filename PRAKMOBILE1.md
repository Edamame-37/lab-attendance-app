# Dokumen Analisis dan Perancangan Sprint 1: Antarmuka dan Alur Praktikum

Dokumen ini memuat analisis kebutuhan sistem, alur pengguna, arsitektur data, serta pembagian tugas pengembangan secara paralel untuk tiga pemrogram pada Sprint 1 aplikasi Presensi Praktikum Mobile.

---

## 1. Analisis Kebutuhan Sistem

### 1.1 Latar Belakang dan Tujuan
Kegiatan praktikum di laboratorium memerlukan pencatatan kehadiran yang akurat, cepat, dan transparan. Aplikasi ini dirancang untuk mendemonstrasikan proses bisnis presensi dari dua perspektif peran utama, yaitu Asisten Praktikum dan Praktikan (Mahasiswa).

### 1.2 Kebutuhan Fungsional Berdasarkan Peran

#### A. Peran Asisten Praktikum
1. **Pemantauan Jadwal Sesi**:
   - Melihat daftar jadwal praktikum yang menjadi tanggung jawabnya.
   - Melihat rincian informasi sesi: nama mata kuliah praktikum, kelas, ruang laboratorium, waktu mulai dan selesai, serta status sesi aktif.
2. **Pengelolaan Siklus Sesi**:
   - Membuka sesi praktikum ketika kegiatan laboratorium dimulai.
   - Menutup sesi praktikum ketika waktu presensi atau kegiatan telah berakhir.
   - Memastikan perubahan status sesi terdistribusi secara konsisten ke seluruh antarmuka yang relevan.
3. **Rekapitulasi Kehadiran**:
   - Melihat daftar nama praktikan yang telah melakukan presensi pada sesi yang sedang dibuka maupun sesi yang telah selesai.
   - Melihat catatan waktu (timestamp) kehadiran masing-masing praktikan secara akurat.
   - Mengetahui ringkasan jumlah praktikan yang hadir terhadap total mahasiswa terdaftar.

#### B. Peran Praktikan (Mahasiswa)
1. **Informasi Jadwal dan Sesi**:
   - Melihat jadwal praktikum yang diikutinya beserta status sesi saat ini (Ditutup, Dibuka, atau Selesai).
   - Mengetahui informasi ruang laboratorium, nama asisten yang bertugas, dan batas waktu kehadiran.
2. **Pencatatan Presensi**:
   - Mengisi formulir presensi ketika status sesi adalah "Dibuka".
   - Menerima umpan balik visual (dialog konfirmasi/modal) bahwa presensi berhasil disimpan beserta waktu pencatatan.
   - Pencegahan presensi ganda: praktikan yang sama tidak diperkenankan melakukan presensi lebih dari satu kali pada sesi yang sama.
   - Sistem menolak atau menonaktifkan aksi presensi jika sesi berstatus "Ditutup" atau "Selesai".
3. **Catatan Riwayat Presensi Pribadi**:
   - Melihat riwayat presensi yang pernah dilakukan oleh mahasiswa tersebut pada sesi-sesi sebelumnya.

#### C. Pengelolaan Identitas dan Peran
- Aplikasi menyediakan fitur alih peran (Role Switcher) yang memungkinkan penguji berganti peran antara Asisten Praktikum dan Praktikan dengan mudah selama masa pengujian sprint.
- Seluruh data dikelola menggunakan state lokal React (in-memory) tanpa dependensi basis data eksternal pada tahap ini.

---

## 2. Alur Pengguna (User Journey)

### 2.1 Alur Terintegrasi Praktikum
1. **Inisialisasi**: Asisten login atau memilih peran sebagai "Asisten Praktikum".
2. **Pembukaan Sesi**: Asisten memilih jadwal sesi praktikum yang berstatus "Ditutup", kemudian menekan tombol "Buka Sesi" dengan konfirmasi dialog. Status sesi berubah menjadi "Dibuka".
3. **Pencatatan Presensi**: Penguji berpindah peran menjadi "Praktikan". Praktikan melihat sesi berstatus "Dibuka", mengisi formulir kehadiran, dan menekan tombol "Kirim Presensi".
4. **Validasi dan Konfirmasi**: Sistem mencatat identitas praktikan dan waktu presensi. Muncul modal konfirmasi keberhasilan. Jika praktikan mencoba presensi kembali, tombol dinonaktifkan atau muncul notifikasi bahwa presensi sudah tercatat.
5. **Pemantauan Rekap**: Penguji kembali ke peran "Asisten Praktikum" dan membuka menu Rekap. Daftar praktikan yang baru saja melakukan presensi langsung tercantum dengan waktu kehadiran yang sesuai.
6. **Penutupan Sesi**: Asisten menekan tombol "Tutup Sesi" melalui dialog konfirmasi. Status sesi berubah menjadi "Selesai", dan formulir presensi untuk sesi tersebut otomatis terkunci.

---

## 3. Arsitektur Domain dan Kontrak Data

Untuk memastikan ketiga pemrogram dapat bekerja secara independen tanpa ketergantungan sekuensial, kontrak tipe data dan state didefinisikan secara baku pada awal pengembangan:

```typescript
// Definisi Peran Pengguna
export type PeranPengguna = 'asisten' | 'praktikan';

// Definisi Status Sesi Praktikum
export type StatusSesi = 'DITUTUP' | 'DIBUKA' | 'SELESAI';

// Model Pengguna
export interface Pengguna {
  id: string;
  nama: string;
  nomorInduk: string; // NIM untuk mahasiswa, NIP/ID untuk asisten
  kelas?: string;
  peran: PeranPengguna;
}

// Model Jadwal Sesi Praktikum
export interface JadwalSesi {
  id: string;
  kodeMataKuliah: string;
  namaPraktikum: string;
  kelas: string;
  ruangLab: string;
  hari: string;
  jamMulai: string;
  jamSelesai: string;
  namaAsisten: string;
  status: StatusSesi;
  tanggalAktif?: string;
}

// Model Catatan Presensi
export interface CatatanPresensi {
  id: string;
  sesiId: string;
  praktikanId: string;
  namaPraktikan: string;
  nimPraktikan: string;
  kelasPraktikan: string;
  waktuPresensi: string;
  statusKehadiran: 'HADIR' | 'IZIN' | 'SAKIT';
  catatan?: string;
}
```

---

## 4. Pembagian Kerja Paralel untuk 3 Pemrogram

Pengembangan dibagi ke dalam tiga domain kerja modular yang berjalan paralel secara mandiri:

```text
+--------------------------------------------------------------------------+
|                       KONTRAK BERSAMA & STATE GLOBAL                     |
|                 (Types, Dummy Data, AppContext, Navigasi)                |
+--------------------------------------------------------------------------+
        |                                 |                                |
        v                                 v                                v
+-----------------------+ +-----------------------+ +----------------------+
|     PEMROGRAM 1       | |     PEMROGRAM 2       | |     PEMROGRAM 3      |
| Modul Pengelolaan Sesi| | Modul Presensi Mhs    | | Modul Rekap & Desain |
|   (Sudut Asisten)     | |   (Sudut Praktikan)   | |   (Shared System)    |
+-----------------------+ +-----------------------+ +----------------------+
```

### 4.1 Pemrogram 1: Modul Asisten dan Pengelolaan Sesi
* **Fokus Kerja**: Siklus hidup sesi praktikum dari sudut pandang Asisten.
* **Tanggung Jawab**:
  1. Mengembangkan komponen kartu detail sesi asisten (`SessionControlCard`).
  2. Mengembangkan dialog modal pembukaan sesi beserta input ruang lab atau catatan pembuka (`OpenSessionModal`).
  3. Mengembangkan dialog modal penutupan sesi dengan konfirmasi akhir (`CloseSessionModal`).
  4. Menghubungkan aksi buka/tutup sesi dengan context state global `AppContext`.
  5. Menangani perubahan visual status sesi secara real-time pada daftar jadwal.
* **Berkas Kerja**:
  - `src/features/asisten/SessionControlCard.tsx`
  - `src/features/asisten/OpenSessionModal.tsx`
  - `src/features/asisten/CloseSessionModal.tsx`
  - Bagian kontrol asisten pada layar `src/app/(tabs)/index.tsx`.

### 4.2 Pemrogram 2: Modul Praktikan dan Pencatatan Presensi
* **Fokus Kerja**: Alur presensi dan riwayat dari sudut pandang Praktikan.
* **Tanggung Jawab**:
  1. Mengembangkan formulir input presensi mahasiswa (`PresensiFormCard`).
  2. Mengimplementasikan validasi: memastikan tombol presensi hanya aktif jika sesi terkait berstatus "DIBUKA".
  3. Mengimplementasikan validasi pencegahan presensi ganda (mengecek apakah NIM praktikan aktif sudah tercatat pada sesi tersebut).
  4. Mengembangkan modal umpan balik konfirmasi keberhasilan presensi (`PresensiSuccessModal`).
  5. Mengembangkan komponen riwayat presensi pribadi mahasiswa (`RiwayatPresensiList`).
* **Berkas Kerja**:
  - `src/features/praktikan/PresensiFormCard.tsx`
  - `src/features/praktikan/PresensiSuccessModal.tsx`
  - `src/features/praktikan/RiwayatPresensiList.tsx`
  - Layar presensi pada `src/app/(tabs)/presensi.tsx`.

### 4.3 Pemrogram 3: Modul Rekapitulasi, Komponen Bersama, dan Integrasi Navigasi
* **Fokus Kerja**: Monitoring kehadiran asisten, *design system* bersama, dan integrasi antarmuka.
* **Tanggung Jawab**:
  1. Mengembangkan sistem penanda status visual (`BadgeStatus`) untuk status Ditutup, Dibuka, dan Selesai.
  2. Mengembangkan komponen visual kondisi kosong (`EmptyState`) ketika belum ada praktikum, belum ada sesi aktif, atau belum ada mahasiswa yang presensi.
  3. Mengembangkan komponen pengalih peran (`RoleSelector`) untuk beralih antara Asisten dan Praktikan dengan cepat.
  4. Mengembangkan antarmuka tabel/daftar rekap kehadiran lengkap asisten (`RekapPresensiTable`) yang menampilkan nama mahasiswa, NIM, kelas, dan waktu kehadiran.
  5. Memelihara struktur navigasi Expo Router pada `src/app/(tabs)/_layout.tsx` dan memastikan transisi antar layar berjalan mulus.
* **Berkas Kerja**:
  - `src/components/common/BadgeStatus.tsx`
  - `src/components/common/EmptyState.tsx`
  - `src/components/common/RoleSelector.tsx`
  - `src/features/rekap/RekapPresensiView.tsx`
  - Layar rekapitulasi pada `src/app/(tabs)/rekap.tsx` dan profil pada `src/app/(tabs)/profil.tsx`.

---

## 5. Standar Antarmuka dan Pedoman Kualitas Kode

1. **Prinsip Flexbox**: Seluruh tata letak menggunakan Flexbox React Native murni dengan penataan `flexDirection`, `justifyContent`, `alignItems`, dan `gap` yang proporsional pada berbagai ukuran layar ponsel.
2. **Format Profesional**: Tidak diperkenankan menggunakan simbol emoji di seluruh antarmuka, pesan notifikasi, maupun dokumentasi kode. Gunakan teks deskriptif dan ikon simbolis berbasis vektor (`@expo/vector-icons/Ionicons`).
3. **Kemandirian Modul**: Setiap modul fitur (`src/features/`) berkomunikasi melalui interface dan Context yang telah disepakati bersama, sehingga tidak ada konflik penggabungan kode (*merge conflict*) antar pemrogram.
