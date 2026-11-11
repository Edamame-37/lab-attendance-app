# Diagram Alur Kerja (Workflow) — Bagian Programmer Farrel
## Sprint 2: CRUD Sesi, Presensi Terintegrasi, & Real-Time Listener (SRS-FT-02, 03, 04)

Diagram ringkas di bawah ini dirancang khusus untuk memetakan tanggung jawab **Programmer Farrel** dan mudah disalin langsung ke [Mermaid Live Editor](https://mermaid.live) maupun digambar tangan pada kertas.

```mermaid
flowchart TD
    %% PERAN ASISTEN
    subgraph ASISTEN ["🧑‍🏫 Asisten (Kelola Sesi & Rekap)"]
        A1["1. Buat Sesi Praktikum"]
        A2["2. Buka Sesi (Status: 'open')"]
        A3["3. Pantau Live Rekap Kehadiran"]
        A4["4. Tutup Sesi (Status: 'closed')"]
        
        A1 --> A2 --> A3 --> A4
    end

    %% DATABASE FIRESTORE
    subgraph FIRESTORE ["🔥 Cloud Firestore"]
        DB_SESI[("Koleksi: sessions<br/>(status: open/closed)")]
        DB_PRESENSI[("Koleksi: attendances<br/>(ID: sessionId_studentId)")]
    end

    %% PERAN PRAKTIKAN
    subgraph PRAKTIKAN ["👨‍🎓 Praktikan (Presensi 1x)"]
        P1["1. Cek Sesi Aktif"]
        P2{"2. Sudah Presensi?"}
        P3["Tolak & Kunci Form<br/>(Cegah Duplikasi)"]
        P4["3. Kirim Presensi: Hadir"]
        
        P1 --> P2
        P2 -->|"Ya"| P3
        P2 -->|"Belum"| P4
    end

    %% RELASI & REAL-TIME DATA FLOW
    A2 -->|"update status: open"| DB_SESI
    A4 -->|"update status: closed"| DB_SESI
    
    DB_SESI ==>|"onSnapshot (Live)"| P1
    P4 -->|"Simpan Presensi 1x"| DB_PRESENSI
    DB_PRESENSI ==>|"onSnapshot (Live Stream)"| A3

    %% WARNA SIMPEL
    style ASISTEN fill:#E0F2FE,stroke:#0284C7,stroke-width:2px
    style FIRESTORE fill:#FEF3C7,stroke:#D97706,stroke-width:2px
    style PRAKTIKAN fill:#DCFCE7,stroke:#16A34A,stroke-width:2px
```

---

### 📝 Poin Penting untuk Catatan / Penjelasan Lisan Anda:
1. **SRS-FT-02 (Asisten)**: Asisten membuat sesi praktikum dan membuka sesi (`status: 'open'`) pada Firestore `sessions`.
2. **SRS-FT-03 (Praktikan)**: Praktikan mendeteksi sesi yang terbuka, mengisi presensi, dan sistem menyimpan dokumen dengan ID deterministik (`${sessionId}_${studentId}`) untuk memastikan **presensi hanya bisa 1 kali**.
3. **SRS-FT-04 (Real-time Sync)**: Menggunakan listener Firestore `onSnapshot()` sehingga pembukaan sesi langsung terlihat di HP praktikan, dan data presensi langsung muncul secara live di kartu rekap asisten tanpa reload.
