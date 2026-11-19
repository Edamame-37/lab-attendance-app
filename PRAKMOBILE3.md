# Pembagian Tugas Sprint 3 — Lab Attendance App

* **Proyek:** Lab Attendance App (React Native)
* **Repository:** `Edamame-37/lab-attendance-app` (Branch: `main`)
* **Tim Programmer:** Azlan & Marcel
* **Fokus Sprint 3:** Validasi Lokasi Presensi, Peta Laboratorium Interaktif (Maps), & Push Notification

---

## 1. Tabel SRS Sprint 3

| **Kode SRS** | **Deskripsi Kebutuhan Sistem** | **Prinsip Data Isolation** |
|---|---|---|
| **SRS-FT-09** | Sistem harus menyediakan halaman presensi khusus (terpisah dari detail sesi) yang menampilkan informasi sesi, status sesi, status lokasi perangkat, serta tombol/aksi presensi (dan opsi pendukung QR jika digunakan kelompok) dengan tetap mencegah presensi ganda pada sesi yang sama. | **Berlaku:** Data presensi hanya dicatat untuk `studentId == request.auth.uid` dan dibaca sesuai aturan akses sesi/pengguna. |
| **SRS-FT-10** | Sistem harus mengambil koordinat perangkat, menghitung jarak terhadap koordinat dan radius laboratorium yang tersimpan di Firestore, serta memblokir pencatatan presensi di sisi logika/backend jika praktikan berada di luar radius atau sesi tidak terbuka. | **Berlaku:** Validasi jarak dan kepemilikan presensi diproses berdasarkan identitas pengguna aktif (`request.auth.uid`) agar tidak dapat dimanipulasi dari input koordinat sembarangan. |
| **SRS-FT-11** | Asisten dapat menambah/mengubah informasi lokasi laboratorium (koordinat lintang/bujur dan radius dalam meter) pada koleksi Firestore `labs` dan mengaitkannya dengan sesi/jadwal praktikum. | **Berlaku:** Seluruh pengguna terautentikasi dapat membaca data lokasi laboratorium, tetapi hanya pengguna dengan peran `asisten` yang dapat membuat atau mengubah data di `labs`. |
| **SRS-FT-12** | Sistem harus menyediakan halaman Maps dengan marker seluruh laboratorium Informatika dan marker lokasi pengguna yang diperbarui saat bergerak; saat marker laboratorium dipilih, tampilkan praktikum yang sedang berlangsung dan berikutnya berdasarkan data jadwal dan sesi di Firestore. | **Tidak berlaku:** Data lokasi laboratorium dan jadwal/sesi bersifat informasi bersama pada lingkungan praktikum, sedangkan posisi pengguna hanya diproses secara lokal di perangkat. |
| **SRS-FT-13** | Sistem harus mengirimkan push notification kepada pengguna terkait ketika sesi praktikum dibuka, jadwal praktikum berubah, atau pengajuan izin diterima/ditolak oleh asisten. | **Berlaku:** Notifikasi izin hanya ditujukan kepada pemilik pengajuan (`studentId`), dan notifikasi sesi/jadwal hanya ditujukan kepada peserta/kelas praktikum yang relevan. |
| **SRS-FT-14** | Sistem harus meminta izin akses lokasi dan push notification secara tepat, serta menampilkan pesan/kondisi yang jelas saat izin ditolak, layanan lokasi mati, koordinat belum tersedia, koneksi terputus, atau notifikasi gagal diterima. | **Tidak berlaku:** Berkaitan dengan status perizinan OS perangkat dan konektivitas sesi aktif pengguna, bukan kepemilikan data antar-akun. |

---

## 2. Pembagian Tugas Sama Rata (Tanpa Kode SRS Tumpang Tindih)

Setiap kode SRS hanya dikerjakan oleh **satu programmer** (**Azlan**: `SRS-FT-09`, `SRS-FT-10`, `SRS-FT-11` — 3 SRS, 5 file; **Marcel**: `SRS-FT-12`, `SRS-FT-13`, `SRS-FT-14` — 3 SRS, 5 file) dengan prinsip **Single File Ownership**.

| Programmer | Nama Branch Git | Kode SRS | Fitur yang Dikerjakan | Path Folder & File Spesifik yang Wajib Dibuat |
|---|---|---|---|---|
| **Azlan** | `feature/geo-attendance-labs` | SRS-FT-09<br>SRS-FT-10<br>SRS-FT-11 | Halaman Presensi Khusus, Validasi Radius & Lokasi Presensi, & CRUD Lokasi/Radius Lab | `src/services/locationService.js` *(Ambil/pantau koordinat perangkat & hitung jarak radius laboratorium)*<br>`src/services/labService.js` *(CRUD data lokasi & radius laboratorium di Firestore)*<br>`src/screens/praktikan/AttendanceCheckScreen.js` *(Halaman presensi khusus praktikan dengan validasi sesi & radius)*<br>`src/screens/asisten/LabLocationManageScreen.js` *(Halaman asisten menambah/mengubah koordinat & radius lab)*<br>`src/components/attendance/RadiusStatusCard.js` *(Komponen status jarak ke lab & validasi kelayakan presensi)* |
| **Marcel** | `feature/lab-maps-push-alerts` | SRS-FT-12<br>SRS-FT-13<br>SRS-FT-14 | Peta Laboratorium Interaktif & Aktivitas Praktikum, Push Notification Event Sesi/Jadwal/Izin, & Penanganan Izin/Kondisi Perangkat | `src/screens/common/LabMapScreen.js` *(Halaman Maps marker lab, marker posisi user real-time, & data jadwal/sesi)*<br>`src/components/maps/LabActivitySheet.js` *(Komponen detail lab, praktikum berlangsung, & praktikum berikutnya)*<br>`src/services/notificationService.js` *(Registrasi token, kirim notif sesi/jadwal/izin, & cek status notif)*<br>`src/hooks/useDevicePermissionsAndAlerts.js` *(Hook izin lokasi & notifikasi, listener notif, serta status GPS/jaringan/error)*<br>`src/components/common/DeviceConditionBanner.js` *(Komponen peringatan izin ditolak, GPS mati, lokasi belum ada, koneksi terputus, & notif gagal)* |

---

## 3. Format Isian Form Pembagian SRS / User Story

Format: `Nama Programmer - SRS kode : user story`

```text
Azlan - SRS-FT-09 : Sebagai praktikan, saya ingin mengakses halaman presensi khusus untuk melihat informasi sesi, status sesi, dan status lokasi saya serta melakukan presensi tanpa presensi ganda pada sesi yang sama.
Azlan - SRS-FT-10 : Sebagai praktikan, saya ingin sistem memvalidasi koordinat dan jarak saya terhadap radius laboratorium saat presensi agar kehadiran hanya tercatat jika sesi dibuka dan saya berada di dalam radius.
Azlan - SRS-FT-11 : Sebagai asisten, saya ingin mengelola data koordinat dan radius laboratorium di Firestore agar menjadi acuan validasi lokasi presensi praktikum.
Marcel - SRS-FT-12 : Sebagai pengguna, saya ingin melihat peta laboratorium dengan marker lab dan lokasi saya secara real-time serta melihat praktikum yang sedang berlangsung dan berikutnya saat memilih lab.
Marcel - SRS-FT-13 : Sebagai pengguna, saya ingin menerima push notification ketika sesi dibuka, jadwal berubah, atau keputusan pengajuan izin diberikan agar saya tidak ketinggalan informasi penting.
Marcel - SRS-FT-14 : Sebagai pengguna, saya ingin mendapatkan permintaan izin lokasi dan notifikasi yang jelas serta informasi kondisi perangkat saat izin ditolak, GPS mati, lokasi belum ada, koneksi terputus, atau notifikasi gagal diterima.
```

---

## 4. Struktur Direktori dan File Baru

```text
lab-attendance-app/
└── src/
    ├── components/
    │   ├── attendance/
    │   │   └── RadiusStatusCard.js          [BARU - Azlan]
    │   ├── common/
    │   │   └── DeviceConditionBanner.js     [BARU - Marcel]
    │   └── maps/
    │       └── LabActivitySheet.js          [BARU - Marcel]
    ├── hooks/
    │   └── useDevicePermissionsAndAlerts.js [BARU - Marcel]
    ├── screens/
    │   ├── asisten/
    │   │   └── LabLocationManageScreen.js   [BARU - Azlan]
    │   ├── common/
    │   │   └── LabMapScreen.js              [BARU - Marcel]
    │   └── praktikan/
    │       └── AttendanceCheckScreen.js     [BARU - Azlan]
    └── services/
        ├── labService.js                  [BARU - Azlan]
        ├── locationService.js             [BARU - Azlan]
        └── notificationService.js         [BARU - Marcel]
```

---

## 5. One-Liner Command Prompt (CMD)

Jalankan perintah berikut di Windows **CMD** dari root folder `lab-attendance-app`:

```cmd
mkdir src\components\attendance src\components\common src\components\maps src\hooks src\screens\asisten src\screens\common src\screens\praktikan src\services 2>nul & type nul > src\services\locationService.js & type nul > src\services\labService.js & type nul > src\screens\praktikan\AttendanceCheckScreen.js & type nul > src\screens\asisten\LabLocationManageScreen.js & type nul > src\components\attendance\RadiusStatusCard.js & type nul > src\screens\common\LabMapScreen.js & type nul > src\components\maps\LabActivitySheet.js & type nul > src\services\notificationService.js & type nul > src\hooks\useDevicePermissionsAndAlerts.js & type nul > src\components\common\DeviceConditionBanner.js
```

---

## 6. Strategi Git dan Integrasi

1. **Sinkronisasi Awal:** Azlan dan Marcel mengambil pembaruan terbaru dari `main` (`git checkout main && git pull origin main`), lalu membuat branch fitur masing-masing (`git checkout -b feature/geo-attendance-labs` untuk Azlan dan `git checkout -b feature/lab-maps-push-alerts` untuk Marcel).
2. **Commit & Push:** Setiap programmer hanya mengubah file miliknya sendiri, lalu melakukan `git add .`, `git commit -m "..."`, dan `git push origin <nama-branch>`.
3. **Urutan Integrasi:**
   - **Tahap 1:** Merge `feature/geo-attendance-labs` (Azlan) ke `main` agar skema koordinat/radius laboratorium di Firestore (`labs`), perhitungan jarak/validasi radius, dan halaman presensi khusus siap dipakai.
   - **Tahap 2:** Marcel melakukan `git pull origin main` ke `feature/lab-maps-push-alerts`, menyelaraskan data laboratorium pada peta serta pemicu push notification pada event sesi/jadwal/izin, lalu merge ke `main`.
4. **Pengujian Pasca-Merge:** Uji presensi praktikan di dalam vs. di luar radius lab serta pencegahan presensi ganda, tampilan marker lab & posisi pengguna pada Maps beserta sesi berlangsung/berikutnya, pengiriman notifikasi pada event sesi/jadwal/izin, serta tampilan kondisi saat izin ditolak, GPS mati, lokasi belum tersedia, koneksi terputus, atau notifikasi gagal diterima.