# Presensi Praktikum Mobile - React Native

Aplikasi presensi laboratorium untuk Praktikum Pengembangan Perangkat Bergerak (PPK) berbasis React Native menggunakan Expo SDK 58, TypeScript, dan Expo Router.

Dokumentasi analisis kebutuhan dan pembagian tugas paralel untuk 3 pemrogram tercantum pada berkas [PRAKMOBILE1.md](file:///c:/my-project/ppk-mobile-praktikum/PRAKMOBILE1.md).

---

## 1. Ringkasan Modul Aplikasi Sprint 1

Aplikasi menyediakan dua perspektif peran (Asisten Praktikum dan Praktikan) dengan navigasi 4 tab:

| Tab Navigasi | Berkas Sumber | Penanggung Jawab | Deskripsi Fungsional |
|---|---|---|---|
| Jadwal Sesi | [src/app/(tabs)/index.tsx](file:///c:/my-project/ppk-mobile-praktikum/src/app/%28tabs%29/index.tsx) | Pemrogram 1 | Pemantauan jadwal dan siklus sesi praktikum (buka/tutup sesi oleh asisten). |
| Presensi | [src/app/(tabs)/presensi.tsx](file:///c:/my-project/ppk-mobile-praktikum/src/app/%28tabs%29/presensi.tsx) | Pemrogram 2 | Formulir pencatatan kehadiran mahasiswa dengan validasi anti-duplikasi dan riwayat pribadi. |
| Rekapitulasi | [src/app/(tabs)/rekap.tsx](file:///c:/my-project/ppk-mobile-praktikum/src/app/%28tabs%29/rekap.tsx) | Pemrogram 3 | Rekapitulasi kehadiran praktikan per sesi, catatan waktu presensi, dan statistik kehadiran. |
| Profil | [src/app/(tabs)/profil.tsx](file:///c:/my-project/ppk-mobile-praktikum/src/app/%28tabs%29/profil.tsx) | Pemrogram 3 | Informasi identitas pengguna aktif, pengalih peran, dan ringkasan arsitektur. |

---

## 2. Panduan Menjalankan Aplikasi di Perangkat Mobile

Aplikasi dapat dijalankan pada smartphone Android atau iPhone melalui aplikasi **Expo Go**. Terdapat tiga metode yang dapat digunakan:

### Metode A: Menggunakan Akun expo.dev (Rekomendasi - Tanpa Scan QR)
Metode ini paling praktis karena proyek yang sedang berjalan akan otomatis terdeteksi di ponsel Anda tanpa perlu memindai kode QR menggunakan kamera:

1. **Daftar Akun**: Jika belum memiliki akun, daftar gratis di [expo.dev/signup](https://expo.dev/signup).
2. **Login di Terminal Komputer**:
   ```bash
   npx expo login
   ```
   Masukkan email/username dan password akun Expo Anda. Pastikan login berhasil dengan perintah:
   ```bash
   npx expo whoami
   ```
3. **Login di Aplikasi Ponsel**:
   - Buka aplikasi **Expo Go** di Android atau iPhone.
   - Buka menu akun/profil, lalu masuk menggunakan akun Expo yang sama persis dengan yang ada di terminal komputer.
4. **Jalankan Server Metro**:
   ```bash
   npx expo start
   ```
5. **Buka Proyek**:
   - Di aplikasi Expo Go ponsel Anda, lihat bagian **Projects** atau **Development Servers**.
   - Nama proyek `ppk-mobile-praktikum` akan otomatis muncul. Ketuk proyek tersebut untuk langsung menjalankannya.

### Metode B: Menggunakan Pemindaian Kode QR (Satu Jaringan Wi-Fi)
Pastikan komputer dan ponsel terhubung pada jaringan Wi-Fi atau hotspot yang sama:

1. Jalankan server di terminal:
   ```bash
   npx expo start --clear
   ```
2. Pindai kode QR yang tampil di terminal:
   - **Android**: Buka Expo Go, pilih tombol "Scan QR code", dan arahkan kamera ke kode QR.
   - **iOS (iPhone)**: Buka aplikasi Kamera bawaan iPhone, arahkan ke kode QR, lalu ketuk notifikasi kuning "Open in Expo Go".

### Metode C: Menggunakan Mode Tunnel (Beda Jaringan / Wi-Fi Kampus Terisolasi)
Gunakan metode ini jika komputer dan ponsel berada di jaringan Wi-Fi yang berbeda atau jaringan publik dengan proteksi firewall ketat:

```bash
npx expo start --tunnel
```

### Tombol Pintasan Berguna di Terminal
- Tekan `r` : Memuat ulang (*reload*) aplikasi di ponsel.
- Tekan `w` : Membuka aplikasi versi web browser.
- Tekan `a` : Membuka emulator Android lokal.
- Tekan `c` : Menampilkan kembali kode QR di terminal.

---

## 3. Struktur Direktori Proyek

```text
c:/my-project/ppk-mobile-praktikum
├── PRAKMOBILE1.md              # Analisis kebutuhan dan pembagian kerja 3 pemrogram
├── README.md                   # Dokumentasi teknis proyek
├── src/
│   ├── app/
│   │   ├── _layout.tsx         # Root Stack Navigator dibungkus AppProvider
│   │   ├── +not-found.tsx      # Layar fallback rute tidak terdaftar (404)
│   │   └── (tabs)/             # Grup Navigasi Tab Bawah
│   │       ├── _layout.tsx     # Konfigurasi navigasi tab dan ikon Ionicons
│   │       ├── index.tsx       # Tab 1: Jadwal Sesi & Pengelolaan Sesi Asisten
│   │       ├── presensi.tsx    # Tab 2: Formulir Presensi Praktikan
│   │       ├── rekap.tsx       # Tab 3: Rekapitulasi Kehadiran Asisten
│   │       └── profil.tsx      # Tab 4: Profil & Alih Peran Pengguna
│   ├── components/
│   │   ├── common/
│   │   │   ├── BadgeStatus.tsx # Badge status sesi (DIBUKA, DITUTUP, SELESAI)
│   │   │   ├── EmptyState.tsx  # Tampilan visual kondisi data kosong
│   │   │   └── RoleSelector.tsx# Komponen pengalih peran Praktikan dan Asisten
│   │   ├── ScreenContainer.tsx # Pembungkus layar terstandarisasi dengan SafeAreaView
│   │   └── SectionCard.tsx     # Komponen kartu seksi modular
│   ├── context/
│   │   └── AppContext.tsx      # State management global (in-memory)
│   ├── data/
│   │   └── dummyData.ts        # Data awal dummy pengguna, sesi, dan presensi
│   └── types/
│       └── index.ts            # Definisi kontrak tipe data TypeScript
├── app.json                    # Konfigurasi Expo Router dan skema aplikasi
├── package.json                # Dependensi proyek
└── tsconfig.json               # Konfigurasi TypeScript dan path alias @/*
```

---

## 4. Panduan Build Aplikasi dengan EAS

Layanan build klasik `expo build` telah ditutup permanen. Gunakan EAS Build:

1. Login akun Expo:
   ```bash
   npx eas-cli login
   ```
2. Inisialisasi konfigurasi EAS:
   ```bash
   npx eas-cli build:configure
   ```
3. Kompilasi APK Standalone untuk Android:
   ```bash
   npx eas-cli build -p android --profile preview
   ```

---

## 5. Pemeriksaan Kualitas Kode
- Validasi Tipe TypeScript:
  ```bash
  npx tsc --noEmit
  ```
- Diagnostik Dependensi Expo:
  ```bash
  npx expo-doctor
  ```

---

## 6. Panduan Pembaruan Nirkabel (EAS Update / Over-The-Air)

Setelah APK yang memuat runtime `expo-updates` dipasang di ponsel, pembaruan kode JavaScript, TypeScript, atau antarmuka UI dapat dikirimkan langsung tanpa perlu membuat atau memasang ulang APK:

1. Kirim pembaruan ke saluran (*channel*) preview:
   ```bash
   npx eas-cli update --branch preview --message "deskripsi pembaruan"
   ```
2. Buka aplikasi di ponsel yang terhubung internet. Aplikasi akan otomatis mengunduh bundle terbaru di latar belakang dan menerapkannya pada pembukaan aplikasi berikutnya.

