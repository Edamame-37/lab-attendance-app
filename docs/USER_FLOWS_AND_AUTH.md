# User Flow, Role, dan Skema Auth

Dokumen ini menjadi kontrak operasional untuk autentikasi, otorisasi route, dan akses data aplikasi. Implementasi UI tidak boleh dianggap sebagai batas keamanan; keputusan akses akhir tetap berada pada Firestore Security Rules.

## Role dan Matriks Akses

| Area | Praktikan | Asisten | Tanpa Login |
|---|---:|---:|---:|
| Login dan registrasi praktikan | Tidak | Tidak | Ya |
| Dashboard, profil, peta lab | Ya | Ya | Tidak |
| Daftar sesi | Ya | Ya | Tidak |
| Presensi berbasis lokasi | Ya | Tidak | Tidak |
| Pengajuan dan status izin | Ya | Tidak | Tidak |
| Rekap seluruh presensi | Tidak | Ya | Tidak |
| Kelola lokasi lab | Tidak | Ya | Tidak |
| Kelola dan buka/tutup sesi | Tidak | Ya | Tidak |
| Review izin | Tidak | Ya | Tidak |

Akun dapat memiliki lebih dari satu role. `roles` adalah hak akses yang diprovisikan, sedangkan role aktif adalah preferensi tampilan lokal dan harus selalu merupakan anggota `roles`.

## Skema `users/{uid}`

| Field | Tipe | Sumber | Dapat diubah pengguna | Aturan |
|---|---|---|---:|---|
| `uid` | string | Firebase Auth | Tidak | Sama dengan UID dokumen dan `request.auth.uid`. |
| `email` | string | Firebase Auth | Tidak | Sama dengan email token saat registrasi. |
| `nama` | string | Form/profil | Ya | Panjang 2â€“100 karakter. |
| `nomorInduk` | string | Form/provisioning | Tidak | Identitas akademik tetap. |
| `kelas` | string | Form/provisioning | Tidak | Wajib untuk akun yang memiliki role praktikan. |
| `role` | `praktikan \| asisten` | Provisioning | Tidak | Role canonical/fallback dan harus ada di `roles`. |
| `roles` | array | Provisioning | Tidak | Satu atau dua role valid tanpa role lain. |
| `accountStatus` | `active \| suspended` | Provisioning | Tidak | Hanya akun aktif yang dapat memakai data aplikasi. |
| `createdAt` | timestamp | Server | Tidak | Tidak dapat diubah. |
| `updatedAt` | timestamp | Server | Otomatis | Harus sama dengan waktu request saat profil diperbarui. |

Registrasi publik hanya dapat membuat akun praktikan aktif dengan `role: "praktikan"` dan `roles: ["praktikan"]`. Pemberian role asisten, penambahan role kedua, perubahan kelas, dan suspensi akun harus dilakukan melalui Firebase Console atau backend administratif tepercaya.

## Alur Autentikasi dan Pemilihan Role

```mermaid
flowchart TD
  Start[Aplikasi dibuka] --> AuthState{Firebase Auth memiliki sesi?}
  AuthState -- Tidak --> Public[Route login dan registrasi]
  Public --> Login[Login atau registrasi praktikan]
  Login --> Profile[Ambil users/uid]
  AuthState -- Ya --> Profile
  Profile --> Validate{Profil lengkap, role valid, akun aktif?}
  Validate -- Tidak --> Reject[Hapus sesi dan tampilkan alasan]
  Validate -- Ya --> Roles[Normalisasi roles]
  Roles --> Stored{Role tersimpan masih diizinkan?}
  Stored -- Ya --> Restore[Pulihkan role aktif]
  Stored -- Tidak --> Default[Pilih role pertama]
  Restore --> Protected[Masuk route terlindungi]
  Default --> Protected
  Protected --> Switch{Pengguna mengganti role?}
  Switch -- Ya --> Allowed{Role ada dalam roles?}
  Allowed -- Ya --> Persist[Simpan preferensi lokal dan kembali ke dashboard]
  Allowed -- Tidak --> Protected
  Persist --> Protected
```

## User Flow Praktikan

```mermaid
flowchart TD
  Dashboard[Dashboard praktikan] --> Session[Melihat sesi]
  Session --> Open{Sesi terbuka dan kelas cocok?}
  Open -- Ya --> Choice{Tindakan}
  Open -- Tidak --> Wait[Menunggu sesi valid]
  Choice -->|Hadir| Permission[Minta izin lokasi]
  Permission --> Location[Ambil lokasi terbaru]
  Location --> Geo{Akurasi maksimal 50 m dan dalam radius?}
  Geo -- Ya --> Attendance[Simpan attendances/sessionId_uid]
  Geo -- Tidak --> Retry[Tolak dan berikan petunjuk pemulihan]
  Choice -->|Izin| Reason[Isi alasan 10â€“1000 karakter]
  Reason --> Leave[Simpan leave_requests/sessionId_uid]
  Leave --> Status[Pantau keputusan asisten]
```

## User Flow Asisten

```mermaid
flowchart TD
  Dashboard[Dashboard asisten] --> Lab[Kelola lab aktif]
  Lab --> Create[Buat sesi tertutup milik asisten]
  Create --> Open[Buka sesi]
  Open --> Monitor[Monitor rekap real-time]
  Monitor --> Review[Review izin pending]
  Review --> Decision[Setujui atau tolak dengan UID reviewer]
  Monitor --> Close[Tutup sesi menjadi selesai]
  Close --> Locked[Presensi dan izin baru ditolak]
```

## Proteksi Route

Proteksi diterapkan berlapis melalui `Stack.Protected` dan `Tabs.Protected`:

| Guard | Route |
|---|---|
| Publik | `/login`, `/register` |
| Semua akun aktif | `/(tabs)`, `/peta-lab` |
| Asisten | `/sesi`, `/lokasi-lab`, `/review-izin`, tab Rekap |
| Praktikan | `/presensi-lokasi`, `/pengajuan-izin`, `/status-izin`, tab Presensi |

Perubahan role aktif menyebabkan route yang tidak lagi berhak diakses dilepas dari navigator dan pengguna dikembalikan ke dashboard.

## Kontrak Data Sensitif

- Presensi menggunakan ID deterministik `${sessionId}_${uid}` sehingga satu akun hanya dapat presensi sekali per sesi.
- Pengajuan izin menggunakan ID deterministik yang sama sehingga satu akun hanya dapat membuat satu pengajuan per sesi.
- Nama, NIM, kelas, dan UID pada presensi/izin diverifikasi terhadap profil server, bukan dipercaya dari input UI.
- Presensi hanya diterima untuk sesi terbuka, kelas yang sama, lab aktif, lokasi maksimal berumur lima menit, akurasi maksimal 50 meter, dan jarak dalam radius lab.
- Hanya asisten pemilik sesi yang dapat mengubah atau menghapus sesi tersebut.
- Keputusan izin menyimpan nama dan UID reviewer; pengajuan yang sudah diputuskan tidak dapat diproses ulang.

## Provisioning dan Migrasi

1. Jalankan `npm run migrate:user-roles` untuk dry-run profil lama.
2. Tinjau profil tanpa role valid secara manual.
3. Jalankan `npm run migrate:user-roles -- --apply` menggunakan kredensial administratif.
4. Pastikan akun asisten memiliki `roles` yang memuat `asisten` dan `accountStatus: "active"`.
5. Deploy Rules dan indexes setelah migrasi data tervalidasi.

Perubahan role tidak disediakan melalui client mobile karena hak tersebut harus berada di administrative trust boundary.
