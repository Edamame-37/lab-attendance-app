# Diagram Alur Kerja Sistem (Workflow Diagrams) — Sprint 2
## Presensi Praktikum Laboratorium dengan Firebase & AI

Dokumen ini memuat diagram alur kerja (*workflow diagrams*) lengkap untuk sistem Presensi Praktikum Laboratorium berbasis **Cloud Firestore**, **Firebase Authentication**, dan **REST API Model AI**, dengan fokus khusus pada modul **Programmer Farrel** (SRS-FT-02, SRS-FT-03, SRS-FT-04) serta integrasi alur keseluruhan.

---

## 1. Alur Utama Terintegrasi Sistem (End-to-End System Workflow)

Diagram berikut memetakan dua skenario inti yang diwajibkan pada Sprint 2:
1. **Alur Presensi Terintegrasi Real-Time (Asisten & Praktikan)**.
2. **Alur Pengajuan Izin & Klasifikasi AI (Praktikan, Model AI, & Asisten)**.

```mermaid
sequenceDiagram
    autonumber
    actor Asisten as Asisten Lab
    participant AppAsisten as Aplikasi (Layar Asisten)
    participant Firestore as Cloud Firestore
    participant AppPraktikan as Aplikasi (Layar Praktikan)
    actor Praktikan as Praktikan
    participant AI as Model AI REST API

    %% SKENARIO 1: SIKLUS SESI & PRESENSI REAL-TIME
    rect rgb(235, 248, 245)
    Note over Asisten, Praktikan: SKENARIO 1: SIKLUS SESI & PRESENSI REAL-TIME (Farrel: SRS-02, SRS-03, SRS-04)
    Asisten->>AppAsisten: Buka Sesi Praktikum (Pilih Ruang & Catatan)
    AppAsisten->>Firestore: updateDoc(sessions, { status: "open", waktuBuka: serverTimestamp() })
    Firestore-->>AppPraktikan: onSnapshot() realtime event (Sesi berstatus "open")
    AppPraktikan->>Praktikan: Tampilkan sesi aktif di daftar "Sesi Terbuka"
    
    Praktikan->>AppPraktikan: Pilih status (HADIR) & klik "Kirim Presensi"
    AppPraktikan->>Firestore: checkExistingAttendance(sessionId, studentId)
    alt Praktikan belum presensi
        AppPraktikan->>Firestore: setDoc(attendances, { sessionId_studentId, status: "HADIR", timestamp })
        Firestore-->>AppPraktikan: Sukses disimpan (Idempotent Doc)
        AppPraktikan->>Praktikan: Tampilkan bukti kehadiran & kunci formulir (Anti-Duplikasi)
        Firestore-->>AppAsisten: onSnapshot() realtime event (Daftar kehadiran bertambah)
        AppAsisten->>Asisten: Tampilkan nama praktikan & metrik live pada AttendanceRecapCard
    else Praktikan sudah presensi sebelumnya
        AppPraktikan->>Praktikan: Tolak submit & tampilkan pesan: "Hanya diperbolehkan 1x per sesi"
    end

    Asisten->>AppAsisten: Tutup Sesi Praktikum
    AppAsisten->>Firestore: updateDoc(sessions, { status: "closed", waktuTutup: serverTimestamp() })
    Firestore-->>AppPraktikan: onSnapshot() realtime event (Sesi ditutup & presensi terkunci)
    end

    %% SKENARIO 2: PENGAJUAN IZIN DENGAN BANTUAN AI
    rect rgb(254, 243, 199)
    Note over Asisten, AI: SKENARIO 2: PENGAJUAN IZIN DENGAN PREDIKSI AI (Syair: SRS-05, SRS-06, SRS-07)
    Praktikan->>AppPraktikan: Isi form izin ketidakhadiran & tulis alasan
    AppPraktikan->>AI: POST /predict-reason { text: alasanIzin }
    AI-->>AppPraktikan: Respons prediksi kategori (misal: "Sakit", "Acara Keluarga")
    AppPraktikan->>Firestore: addDoc(leave_requests, { studentId, alasan, kategoriAI, status: "pending" })
    
    Firestore-->>AppAsisten: onSnapshot() realtime event (Pengajuan izin baru)
    AppAsisten->>Asisten: Tampilkan izin, alasan asli, & rekomendasi kategori AI
    Note over Asisten: Keputusan manual di tangan Asisten (AI tidak memutuskan)
    Asisten->>AppAsisten: Berikan keputusan (Terima / Tolak)
    AppAsisten->>Firestore: updateDoc(leave_requests, { status: "approved" | "rejected", reviewedBy })
    Firestore-->>AppPraktikan: onSnapshot() realtime event (Status izin ter-update live)
    AppPraktikan->>Praktikan: Tampilkan status keputusan (Diterima / Ditolak)
    end
```

---

## 2. Alur Pengelolaan Sesi Praktikum — Sisi Asisten (SRS-FT-02 & SRS-FT-04)

Diagram alir logika (*flowchart*) bagi Asisten untuk operasi CRUD sesi, pembukaan/penutupan kegiatan, dan pemantauan live recap.

```mermaid
flowchart TD
    Start([Asisten Membuka SessionManageScreen]) --> LoadSessions[useAttendance: onSnapshot mendengarkan koleksi sessions]
    LoadSessions --> DisplayList[Tampilkan Semua Sesi Praktikum]

    %% Aksi CRUD & Kontrol
    DisplayList --> ActionChoice{Pilih Tindakan Asisten}

    %% Buat Sesi
    ActionChoice -->|Tambah Sesi| FormModal[Buka Modal Tambah Sesi]
    FormModal --> InputData[Isi Nama Praktikum, Topik, Kelas, Ruang, Jam]
    InputData --> ValidateForm{Apakah field wajib terisi?}
    ValidateForm -->|Tidak| AlertInvalid[Munculkan Alert Validasi Gagal] --> FormModal
    ValidateForm -->|Ya| CallCreate[firestoreService.createSession]
    CallCreate --> FirestoreSessions[(Firestore: sessions)]
    FirestoreSessions --> RealtimeUpdate[onSnapshot otomatis update UI]

    %% Buka Sesi
    ActionChoice -->|Buka Sesi| OpenModal[Buka Modal Buka Sesi & Catatan]
    OpenModal --> CallOpen[firestoreService.openSession]
    CallOpen --> SetOpenStatus[Status sesi diubah: open / DIBUKA]
    SetOpenStatus --> FirestoreSessions

    %% Tutup Sesi
    ActionChoice -->|Tutup Sesi| ConfirmClose[Dialog Konfirmasi Penutupan]
    ConfirmClose --> CallClose[firestoreService.closeSession]
    CallClose --> SetCloseStatus[Status sesi diubah: closed / SELESAI]
    SetCloseStatus --> FirestoreSessions

    %% Hapus Sesi
    ActionChoice -->|Hapus Sesi| ConfirmDelete[Dialog Konfirmasi Hapus]
    ConfirmDelete --> CallDelete[firestoreService.deleteSession]
    CallDelete --> FirestoreSessions

    %% Live Recap
    RealtimeUpdate --> ListenAttendances[onSnapshot mendengarkan koleksi attendances pada sesi aktif]
    ListenAttendances --> UpdateRecapCard["Update AttendanceRecapCard (Live Badge, Metrik Hadir/Izin/Sakit, & Daftar Masuk)"]
```

---

## 3. Alur Presensi Terintegrasi & Validasi 1x — Sisi Praktikan (SRS-FT-03)

Diagram alir logika (*flowchart*) bagi Praktikan ketika melakukan presensi pada sesi yang sedang dibuka dengan proteksi anti-duplikasi.

```mermaid
flowchart TD
    StartPraktikan([Praktikan Membuka AttendanceScanScreen]) --> ListenActive[useAttendance: onSnapshot mendengarkan sesi berstatus open]
    ListenActive --> CheckOpenSession{Apakah ada sesi yang dibuka?}

    CheckOpenSession -->|Tidak Ada| ShowEmpty["Tampilkan Empty State: Tidak Ada Sesi Dibuka (Menunggu Asisten)"]
    
    CheckOpenSession -->|Ada Sesi Terbuka| SelectSession[Pilih Sesi Praktikum yang Diikuti]
    SelectSession --> CheckExisting["checkExistingAttendance: Cek apakah studentId sudah ada di attendances pada sesi ini"]

    CheckExisting -->|Sudah Pernah Presensi| LockForm["Tampilkan Banner: Anda Telah Mengisi Presensi ✓ (Kunci Form & Cegah Duplikasi)"]

    CheckExisting -->|Belum Presensi| ShowForm[Buka Form Presensi: Pilih Status Hadir/Izin/Sakit & Catatan]
    ShowForm --> SubmitClick[Praktikan Klik Tombol 'Kirim Presensi Sekarang']
    
    SubmitClick --> Validating[Validasi ulang status sesi & data mahasiswa]
    Validating --> SetDocFirestore["setDoc(attendances, sessionId_studentId, payload)"]
    SetDocFirestore --> WriteSuccess{Penyimpanan Berhasil?}
    
    WriteSuccess -->|Gagal/Error| ShowErrorAlert[Tampilkan Notifikasi Error Koneksi / Firestore]
    WriteSuccess -->|Sukses| ShowSuccess[Tampilkan Alert Sukses & Update State Real-time]
    ShowSuccess --> LockForm
```

---

## 4. Arsitektur Relasi Koleksi Cloud Firestore (Sprint 2)

Diagram struktur data dan keterhubungan dokumen pada Cloud Firestore:

```mermaid
erDiagram
    USERS ||--o{ ATTENDANCES : "melakukan"
    USERS ||--o{ SESSIONS : "mengelola (asisten)"
    USERS ||--o{ LEAVE_REQUESTS : "mengajukan (praktikan)"
    SESSIONS ||--o{ ATTENDANCES : "memiliki riwayat"
    SESSIONS ||--o{ LEAVE_REQUESTS : "terkait pengajuan"

    USERS {
        string uid PK "request.auth.uid"
        string email "Email akun"
        string nama "Nama lengkap"
        string nomorInduk "NIM atau NIP/ID Asisten"
        string role "praktikan | asisten"
        string kelas "Kelas praktikum (opsional)"
    }

    SESSIONS {
        string id PK "Doc ID otomatis"
        string namaPraktikum "Nama mata kuliah praktikum"
        string topikMateri "Topik / modul praktikum"
        string kelas "Kelas peserta (misal TI-3A)"
        string ruangLab "Ruangan laboratorium"
        string status "open | closed"
        string statusSesi "DIBUKA | DITUTUP | SELESAI"
        string asistenId FK "UID asisten pembuat"
        string namaAsisten "Nama asisten pengampu"
        timestamp waktuBuka "Waktu sesi dibuka"
        timestamp waktuTutup "Waktu sesi ditutup"
    }

    ATTENDANCES {
        string id PK "Deterministic ID: sessionId_studentId"
        string sessionId FK "ID sesi praktikum"
        string studentId FK "UID mahasiswa praktikan"
        string studentName "Nama mahasiswa"
        string studentNim "NIM mahasiswa"
        string studentClass "Kelas mahasiswa"
        string statusKehadiran "HADIR | IZIN | SAKIT"
        string catatan "Keterangan tambahan"
        string waktuPresensi "Waktu pencatatan (WIB)"
        timestamp timestamp "Server timestamp"
    }

    LEAVE_REQUESTS {
        string id PK "Doc ID otomatis"
        string sessionId FK "ID sesi terkait"
        string studentId FK "UID mahasiswa praktikan"
        string studentName "Nama mahasiswa"
        string alasan "Teks alasan izin asli"
        string kategoriAI "Hasil prediksi REST API AI"
        string status "pending | approved | rejected"
        string reviewedBy FK "UID asisten pemeriksa"
        timestamp createdAt "Waktu pengajuan"
        timestamp reviewedAt "Waktu verifikasi"
    }
```
