# PRD — Smart Form Scanner HRPGA
## PT Toshin Prima Fine Blanking

**Dokumen:** Product Requirements Document  
**Versi:** 2.1.0  
**Tanggal:** Juni 2026  
**Departemen:** HRPGA  
**Status:** Draft — Phase 0 (Sample / Proof of Concept)  
**Author:** Firaz / KyloDev  

---

## Daftar Isi

1. [Overview & Latar Belakang](#1-overview--latar-belakang)
2. [Tujuan & Success Metrics](#2-tujuan--success-metrics)
3. [Analisis Celah & Solusi](#3-analisis-celah--solusi)
4. [Scope & Batasan](#4-scope--batasan)
5. [Rekomendasi Tech Stack](#5-rekomendasi-tech-stack)
6. [Arsitektur Sistem](#6-arsitektur-sistem)
7. [Feature Requirements](#7-feature-requirements)
8. [Data Schema (Phase 0)](#8-data-schema-phase-0)
9. [UI/UX Strategy & Responsive Design](#9-uiux-strategy--responsive-design)
10. [UI/UX Flow](#10-uiux-flow)
11. [Edge Cases & Risk Mitigation](#11-edge-cases--risk-mitigation)
12. [Roadmap Pengembangan](#12-roadmap-pengembangan)
13. [Testing Plan](#13-testing-plan)
14. [Appendix](#14-appendix)
11. [Roadmap Pengembangan](#11-roadmap-pengembangan)
12. [Testing Plan](#12-testing-plan)
13. [Appendix](#13-appendix)

---

## 1. Overview & Latar Belakang

### 1.1 Konteks Bisnis

PT Toshin Prima Fine Blanking mengelola pengajuan **SPKL (Surat Perintah Kerja Lembur)** dan **Cuti / Izin / Sakit** melalui form kertas fisik. Setelah form diisi karyawan dan disetujui atasan, **admin HRPGA melakukan rekap secara manual** — mengetik ulang satu per satu data dari tumpukan form kertas ke dalam spreadsheet atau buku register.

Proses rekap ini menjadi bottleneck karena:
- Memakan waktu lama — terutama saat banyak form masuk sekaligus
- Rawan salah ketik karena tulisan tangan karyawan yang bervariasi
- Pekerjaan repetitif yang bisa dieliminasi dengan otomasi

### 1.2 Masalah Spesifik yang Diselesaikan

**Satu masalah, satu solusi:**

> Admin sekarang harus mengetik ulang data dari setiap form kertas ke spreadsheet/rekap — satu per satu, manual, memakan waktu.

**Solusi:** Admin cukup **foto/scan form kertas** → sistem baca otomatis → **preview muncul** → admin cek sebentar → **klik Submit** → data langsung masuk ke rekap digital.

Proses rekap yang tadinya membutuhkan waktu lama, menjadi hitungan detik per form.

### 1.3 Batasan Scope yang Jelas

Sistem ini **bukan** sistem approval, bukan portal karyawan, dan bukan pengganti proses pengajuan form kertas. Form tetap diisi dan disetujui secara fisik seperti biasa. Sistem ini hanya menghilangkan pekerjaan **rekap manual** admin HRPGA.

---

## 2. Tujuan & Success Metrics

### 2.1 Tujuan Tunggal

Menghilangkan kebutuhan admin untuk mengetik ulang data dari form kertas ke rekap digital.

### 2.2 Success Metrics

| Metric | Kondisi Saat Ini | Target |
|--------|-----------------|--------|
| Waktu rekap per form | ~3–5 menit (ketik manual) | < 30 detik (scan → submit) |
| Error rate rekap | Rawan salah ketik | Akurasi parsing ≥ 85% |
| Upaya admin | Tinggi (repetitif) | Minimal (hanya verifikasi) |

### 2.3 Success Criteria Phase 0 (PoC)

- [ ] Admin scan form rekayasa → data muncul di preview dengan field terisi otomatis
- [ ] Admin bisa koreksi field yang salah sebelum submit
- [ ] Setelah submit, data langsung muncul di tabel rekap (dashboard / list)
- [ ] Data di rekap bisa diedit dan dihapus (CRUD)
- [ ] Data bisa diekspor ke Excel

---

## 3. Analisis Celah & Solusi

### Celah 1 — Tulisan Tangan Bervariasi (Risiko Utama)

**Masalah:** OCR standar gagal pada tulisan tangan yang kurang jelas, huruf sambung, atau ukuran kecil. Ini menyebabkan data salah masuk ke rekap tanpa disadari.

**Solusi:**
- Gunakan **Google Cloud Vision API** (handwriting model) — jauh lebih akurat dari OCR generik
- Setelah OCR, jalankan **AI post-processing (Claude API)** untuk interpretasi kontekstual: misal OCR menghasilkan "Budi Snatos", AI mengenali konteks dan mengoreksi ke "Budi Santoso"
- Lakukan **fuzzy matching** nama ke database karyawan — jika mirip (threshold 70%), pakai nama yang benar dari database
- Field dengan confidence rendah (<70%) di-highlight otomatis di preview → admin tahu persis mana yang perlu dicek

### Celah 2 — Format Tanggal Tidak Konsisten

**Masalah:** Karyawan menulis tanggal dalam berbagai format: `01/06/26`, `1 Juni 2026`, `01-06-2026`, bahkan singkatan.

**Solusi:**
- AI prompt khusus normalisasi tanggal ke satu format standar
- Di preview: tampilkan dalam format `DD MMM YYYY` yang mudah dibaca admin
- Di database: simpan sebagai ISO `YYYY-MM-DD`

### Celah 3 — Foto Form Miring atau Blur

**Masalah:** Admin memfoto dengan HP, hasil bisa miring, terlalu gelap, atau buram — OCR jadi tidak akurat.

**Solusi:**
- **Image preprocessing** sebelum OCR: auto-rotate, peningkatan kontras, deskew (via Sharp.js di server)
- Tampilkan **preview gambar** ke admin sebelum diproses — admin bisa retake jika kualitas jelas buruk
- Deteksi kualitas otomatis: jika blur score di bawah threshold, tampilkan peringatan "Foto kurang jelas, coba foto ulang"

### Celah 4 — Scan Form yang Sama Dua Kali

**Masalah:** Admin tidak sengaja scan form yang sudah pernah diproses — data duplikat masuk ke rekap.

**Solusi:**
- Hashing gambar: jika hash sudah ada, tampilkan warning "Form ini kemungkinan sudah pernah diinput"
- Cek duplikat logis: kombinasi NIK + tanggal pengajuan + jenis form dalam rentang hari yang sama

### Celah 5 — Field Tidak Terbaca Sama Sekali

**Masalah:** Sebagian form bisa rusak, terlipat, atau field tertentu benar-benar tidak terbaca OCR.

**Solusi:**
- Field yang tidak terbaca muncul sebagai **kosong + highlight merah** di preview
- Admin wajib mengisi manual sebelum submit (required field tidak bisa dikosongkan)
- Gambar original ditampilkan di samping form preview — admin tinggal lihat kertas aslinya di layar

### Celah 6 — Tidak Ada Riwayat Perubahan

**Masalah:** Jika data di rekap berubah (admin edit), tidak ada catatan siapa yang mengubah dan apa yang berubah.

**Solusi:**
- Setiap aksi (tambah, edit, hapus) dicatat di tabel `audit_logs`
- Data yang dihapus tidak benar-benar hilang — soft delete, hanya disembunyikan dari tampilan
- Jika suatu saat dipertanyakan, data tetap bisa ditelusuri

---

## 4. Scope & Batasan

### 4.1 In Scope

**Phase 0 — PoC (sekarang):**
- Upload / kamera capture gambar form kertas
- OCR + AI parsing otomatis ke field terstruktur
- Preview hasil dengan highlight field yang perlu diverifikasi
- Manual correction sebelum submit
- CRUD rekap (tambah, lihat, edit, hapus)
- Database karyawan sample untuk validasi nama
- Export rekap ke Excel (.xlsx)

**Phase 1 — Production (setelah PoC berhasil):**
- Field form SPKL dan Cuti asli (dari template form aktual Toshin Prima)
- Database karyawan aktual
- Login admin (autentikasi sederhana)
- Laporan rekap per bulan / per departemen
- Export PDF

### 4.2 Tegas Out of Scope

- Portal karyawan (karyawan tidak perlu akses sistem ini)
- Proses approval digital — form tetap approval kertas seperti biasa
- Notifikasi ke karyawan
- Integrasi payroll / HRIS
- Multi-level workflow

---

## 5. Rekomendasi Tech Stack

### 5.1 Keputusan Platform: Web App (PWA)

**Rekomendasi: PWA berbasis Next.js**, bukan mobile app native.

| Pertimbangan | PWA (Next.js) | Mobile App Native |
|-------------|--------------|-------------------|
| Admin kerja di PC/laptop | ✅ Fully supported | ❌ Tidak nyaman di PC |
| Admin scan on-the-go pakai HP | ✅ Bisa via browser HP | ✅ Native |
| Development speed | ✅ Satu codebase | ❌ Dua codebase (iOS + Android) |
| Update sistem | ✅ Instant (push ke server) | ❌ User harus update app |
| Deployment internal | ✅ URL langsung, tidak perlu Play Store | ❌ Butuh distribusi app |
| Biaya development | ✅ Lebih efisien | ❌ Lebih mahal |

> Admin HRPGA umumnya bekerja dari PC saat rekap, namun butuh fleksibilitas foto form dari HP. PWA mengakomodasi keduanya dalam satu produk.

### 5.2 Stack Detail

**Frontend**
```
Framework    : Next.js 14+ (App Router)
Language     : TypeScript
Styling      : Tailwind CSS + shadcn/ui
PWA          : next-pwa
Kamera/Upload: react-webcam + native browser File API
Image crop   : react-image-crop (opsional, untuk crop sebelum kirim)
```

**Backend (Next.js API Routes)**
```
OCR Engine   : Google Cloud Vision API — Handwriting model
               (Free tier: 1.000 req/bulan, cukup untuk PoC & awal production)
AI Parser    : Anthropic Claude API (claude-sonnet)
               Untuk: mapping field, normalisasi tanggal, koreksi nama
Image Proc   : Sharp.js — resize, enhance, deskew sebelum kirim ke OCR
Fuzzy Match  : Fuse.js — matching nama karyawan dari database
Excel Export : ExcelJS
```

**Database & Storage**
```
Database     : Supabase (free tier cukup untuk internal tool)
ORM          : Prisma
File Storage : Supabase Storage — simpan gambar original form
Auth         : Clerk
```

**Deployment**
```
Hosting      : Vercel (free tier, cukup untuk internal tool)
Domain       : Bisa pakai subdomain kylodev atau domain internal Toshin
```

### 5.3 Pertimbangan OCR Engine

| Engine | Akurasi Handwriting | Biaya | Rekomendasi |
|--------|--------------------|----- -|-------------|
| Google Cloud Vision | ⭐⭐⭐⭐⭐ | ~$1.5/1.000 req (free 1k/bulan) | ✅ Primary |
| Azure AI Vision | ⭐⭐⭐⭐⭐ | Mirip Google | ✅ Alternatif |
| Tesseract (lokal) | ⭐⭐ | Gratis | ❌ Tidak cocok handwriting |

Untuk volume rekap internal perusahaan (estimasi <500 form/bulan), biaya Google Vision sangat terjangkau — bahkan mungkin masuk free tier.

---

## 6. Arsitektur Sistem

### 6.1 User Journey Admin (Core Flow)

```
Admin HRPGA
    │
    ├─► [1] Ambil tumpukan form kertas yang sudah disetujui atasan
    │
    ├─► [2] Buka PWA di HP atau PC
    │
    ├─► [3] Tap "Scan Form Baru"
    │        └── Pilih: Upload file ATAU Foto via kamera
    │
    ├─► [4] Sistem proses otomatis (± 5–10 detik)
    │        ├── Image preprocessing (Sharp): rotate, enhance
    │        ├── OCR (Google Vision): ekstrak teks
    │        └── AI Parser (Claude): mapping ke field + koreksi
    │
    ├─► [5] Preview muncul
    │        ├── Semua field terisi otomatis
    │        ├── Field confidence rendah → highlight kuning/merah
    │        ├── Gambar original tampil di samping
    │        └── Admin verifikasi sebentar, koreksi jika perlu
    │
    ├─► [6] Klik "Submit"
    │        ├── Data tersimpan ke database
    │        └── Gambar original tersimpan ke storage
    │
    └─► [7] Data langsung muncul di tabel rekap dashboard
             └── Admin lanjut scan form berikutnya
```

### 6.2 Komponen API

```
POST /api/scan/process     → Terima gambar, preprocessing, OCR, AI parse, return hasil
POST /api/submissions      → Simpan submission baru ke DB
GET  /api/submissions      → Ambil list rekap (filter, search, pagination)
GET  /api/submissions/:id  → Detail satu record
PATCH /api/submissions/:id → Update record
DELETE /api/submissions/:id→ Soft delete record
GET  /api/submissions/export → Download Excel
GET  /api/employees/search → Autocomplete nama karyawan
```

---

## 7. Feature Requirements

### F-01: Image Capture & Upload

**Priority:** Must Have

Admin dapat mengunggah foto form melalui dua cara: upload file dari device atau foto langsung via kamera HP/webcam.

**Acceptance Criteria:**
- [ ] Support format JPG, PNG, HEIC, WEBP
- [ ] Ukuran file maksimal 10MB, kompresi otomatis jika lebih besar
- [ ] Preview gambar setelah upload, sebelum diproses
- [ ] Tombol "Ganti Foto" / "Foto Ulang" tersedia
- [ ] Indikator loading + pesan status selama proses OCR berlangsung
- [ ] Jika kualitas gambar terdeteksi buruk (blur/gelap), muncul peringatan sebelum proses

---

### F-02: OCR + AI Parsing Otomatis

**Priority:** Must Have

Sistem membaca gambar form dan mengisi field rekap secara otomatis tanpa admin mengetik apapun.

**Acceptance Criteria:**
- [ ] OCR mengekstrak teks dari area form
- [ ] AI memetakan teks ke field schema yang benar
- [ ] Nama karyawan dicocokkan ke database (fuzzy match, toleransi typo)
- [ ] Tanggal dinormalisasi ke format standar apapun cara karyawan menulisnya
- [ ] Setiap field memiliki confidence score internal
- [ ] Proses selesai dalam < 15 detik
- [ ] Jika OCR gagal total (gambar tidak terbaca), tampilkan pesan error yang jelas dengan opsi foto ulang

---

### F-03: Preview & Koreksi Manual

**Priority:** Must Have

Setelah parsing, admin melihat hasil sebelum data disimpan. Ini adalah satu-satunya titik verifikasi admin.

**Acceptance Criteria:**
- [ ] Semua field hasil parsing ditampilkan dalam form yang bisa diedit
- [ ] Field dengan confidence rendah (<70%) diberi highlight visual (border kuning/merah)
- [ ] Gambar original form ditampilkan berdampingan (split view di desktop, accordion di mobile)
- [ ] Admin bisa klik field manapun dan langsung edit
- [ ] Nama karyawan: input dengan autocomplete dari database karyawan
- [ ] Tombol "Submit" hanya aktif jika semua required field terisi
- [ ] Tombol "Batal" untuk membatalkan dan kembali ke halaman utama
- [ ] Tidak ada konfirmasi tambahan setelah submit — langsung tersimpan dan redirect ke rekap

---

### F-04: Rekap Digital (Dashboard / List)

**Priority:** Must Have

Semua data yang sudah disubmit tampil dalam tabel rekap yang bisa dikelola.

**Acceptance Criteria:**
- [ ] Tabel rekap menampilkan semua submission dengan pagination
- [ ] Kolom: Nama Karyawan, NIK, Jenis Form, Tanggal Mulai, Tanggal Selesai, Jumlah Hari, Tgl Diinput
- [ ] Filter: Jenis Form (SPKL / Cuti / Izin / Sakit), Rentang Tanggal, Departemen
- [ ] Search: by nama karyawan atau NIK
- [ ] Sort: by tanggal diinput, nama, jenis form
- [ ] Klik row untuk lihat detail lengkap + gambar original form
- [ ] Tombol Edit dan Hapus tersedia per row

---

### F-05: Edit & Hapus (CRUD Lengkap)

**Priority:** Must Have

Data yang sudah tersimpan masih bisa diubah atau dihapus jika ada kesalahan.

**Acceptance Criteria:**
- [ ] Edit: semua field bisa diubah, ada tombol Simpan dan Batal
- [ ] Hapus: dialog konfirmasi "Yakin ingin menghapus?", setelah konfirmasi data hilang dari tampilan
- [ ] Hapus bersifat soft delete — data tidak benar-benar hilang dari database (untuk keamanan data)
- [ ] Perubahan edit langsung terlihat di tabel rekap tanpa refresh halaman

---

### F-06: Export Rekap ke Excel / CSV

**Priority:** Must Have

Admin dapat mengunduh rekap dalam format Excel (.xlsx) atau CSV sesuai filter yang aktif — umumnya digunakan untuk rekap akhir bulan atau per periode tertentu.

**Workflow yang dimaksud:**
Sepanjang bulan, setiap form yang masuk langsung di-scan dan tersimpan sebagai satu baris di dashboard. Di akhir periode (mingguan / bulanan / custom), admin tinggal filter rentang tanggal yang diinginkan lalu klik Export — semua baris yang sesuai filter langsung terunduh sebagai satu file Excel/CSV siap pakai.

**Acceptance Criteria:**
- [ ] Tombol "Export Excel" dan "Export CSV" tersedia di halaman rekap
- [ ] Export mengikuti filter yang sedang aktif: jika filter "Juni 2026 + SPKL" aktif, file hanya berisi data SPKL Juni 2026
- [ ] Filter export minimal: rentang tanggal (Dari–Sampai), jenis form, departemen
- [ ] Format Excel: tabel rapi dengan header kolom, baris bergantian warna, tanggal konsisten `DD/MM/YYYY`
- [ ] Format CSV: plain, separator koma, UTF-8, cocok untuk import ke sistem lain
- [ ] Nama file otomatis sesuai filter aktif, contoh: `Rekap_CUTI_Jun2026.xlsx`, `Rekap_SPKL_Semua_Jun2026.csv`
- [ ] Kolom Excel/CSV minimal: No, Nama Karyawan, NIK, Departemen, Jabatan, Jenis Form, Tanggal Mulai, Tanggal Selesai, Jumlah Hari, Keterangan, Tanggal Diinput
- [ ] File terunduh langsung tanpa perlu tunggu email atau proses background
- [ ] Jika tidak ada data sesuai filter, tampilkan pesan "Tidak ada data untuk diekspor" — tidak menghasilkan file kosong

---

### F-07: Database Karyawan (Referensi Validasi)

**Priority:** Must Have

Database karyawan digunakan sebagai referensi untuk fuzzy matching nama hasil OCR dan autocomplete di form preview.

**Acceptance Criteria:**
- [ ] Tabel karyawan berisi minimal: NIK, nama lengkap, departemen, jabatan
- [ ] Fuzzy search toleransi typo: "Budi Snatos" → cocok ke "Budi Santoso"
- [ ] Hasil autocomplete muncul saat admin mengetik nama di field preview
- [ ] Jika nama tidak ditemukan di database, tetap bisa disimpan (tidak blocking) dengan flag "karyawan tidak terdaftar"

---

### F-08: Audit Log

**Priority:** Should Have

Setiap perubahan data tercatat untuk keperluan tracking dan akuntabilitas.

**Acceptance Criteria:**
- [ ] Log mencatat: aksi (create/update/delete), timestamp, ID record yang diubah
- [ ] Log tidak bisa dihapus dari sistem
- [ ] Phase 0: log tersimpan di database, tidak harus ditampilkan di UI
- [ ] Phase 1: admin bisa lihat riwayat perubahan per record

---

## 8. Data Schema (Phase 0)

### 8.1 Tabel `employees` — Sample untuk PoC

```sql
CREATE TABLE employees (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nik         VARCHAR(20) UNIQUE NOT NULL,
  nama        VARCHAR(100) NOT NULL,
  departemen  VARCHAR(50),
  jabatan     VARCHAR(50),
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Data sample untuk testing (8 karyawan fiktif)
INSERT INTO employees (nik, nama, departemen, jabatan) VALUES
  ('1001', 'Budi Santoso',       'Produksi',   'Operator'),
  ('1002', 'Siti Rahayu',        'HRPGA',      'Admin HR'),
  ('1003', 'Ahmad Fauzi',        'Produksi',   'Operator'),
  ('1004', 'Dewi Permatasari',   'Finance',    'Staff'),
  ('1005', 'Riko Prasetyo',      'Maintenance','Teknisi'),
  ('1006', 'Rina Wulandari',     'Produksi',   'Operator'),
  ('1007', 'Hendra Setiawan',    'QC',         'Inspector'),
  ('1008', 'Lestari Ningrum',    'HRPGA',      'Staff HR');
```

### 8.2 Tabel `form_submissions` — Rekap Digital

```sql
CREATE TABLE form_submissions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Jenis & Metadata
  jenis_form       VARCHAR(10) NOT NULL,   -- 'SPKL' | 'CUTI' | 'IZIN' | 'SAKIT'
  image_url        TEXT,                   -- URL gambar original di storage
  raw_ocr_text     TEXT,                   -- Raw OCR untuk debugging (tidak ditampilkan ke user)
  confidence_avg   FLOAT,                  -- Rata-rata confidence score OCR (0.0–1.0)

  -- Data Karyawan (hasil parsing)
  nik_karyawan     VARCHAR(20),
  nama_karyawan    VARCHAR(100) NOT NULL,
  departemen       VARCHAR(50),
  jabatan          VARCHAR(50),
  employee_matched BOOLEAN DEFAULT FALSE,  -- Apakah nama cocok di database karyawan

  -- Data Isi Form (sample field — akan disesuaikan dengan form asli di Phase 1)
  tanggal_mulai    DATE,
  tanggal_selesai  DATE,
  jumlah_hari      INTEGER,
  keterangan       TEXT,

  -- Audit
  is_deleted       BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMP DEFAULT NOW(),
  updated_at       TIMESTAMP DEFAULT NOW()
);
```

### 8.3 Tabel `audit_logs`

```sql
CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id   UUID NOT NULL,
  action      VARCHAR(10) NOT NULL,   -- 'CREATE' | 'UPDATE' | 'DELETE'
  changed_by  VARCHAR(50) DEFAULT 'admin',
  old_data    JSONB,
  new_data    JSONB,
  created_at  TIMESTAMP DEFAULT NOW()
);
```

### 8.4 Form Rekayasa untuk Testing Phase 0

Buat form kertas sederhana dengan field berikut untuk pengujian:

```
┌────────────────────────────────────────────────────────────┐
│        FORM SAMPLE — HRPGA TOSHIN PRIMA (TEST ONLY)        │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Jenis   : [ ] SPKL   [ ] CUTI   [ ] IZIN   [ ] SAKIT     │
│                                                            │
│  NIK         : ________________________________________    │
│  Nama        : ________________________________________    │
│  Departemen  : ________________________________________    │
│                                                            │
│  Tgl Mulai   : _______ / _______ / _______                │
│  Tgl Selesai : _______ / _______ / _______                │
│  Jml. Hari   : _______                                    │
│                                                            │
│  Keterangan  :                                             │
│  __________________________________________________________│
│  __________________________________________________________│
│                                                            │
│  Tanda Tangan Pemohon       Tanda Tangan Atasan           │
│  (___________________)      (___________________)         │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## 9. UI/UX Strategy & Responsive Design

### 9.1 Prinsip Dasar: Dua Konteks, Dua Prioritas

Sistem ini digunakan dalam dua konteks yang berbeda oleh admin HRPGA:

| Konteks | Perangkat | Aktivitas | Prioritas |
|---------|-----------|-----------|-----------|
| **Scan form** | HP / smartphone | Pegang form fisik, foto, verifikasi cepat | **Mobile-first** |
| **Lihat & kelola rekap** | PC / laptop | Browse data, filter, edit, export | **Desktop-first** |

Kedua konteks ini menghasilkan strategi responsive yang berbeda untuk tiap bagian aplikasi.

---

### 9.2 Halaman Scan — Mobile-First

**Rasional:** Admin melakukan scan sambil memegang tumpukan form fisik. Aktivitas ini dilakukan berdiri atau di meja sambil menghadap kertas. Layar HP adalah perangkat paling natural untuk ini — kamera HP juga lebih mudah diarahkan ke kertas dibanding webcam PC.

**Desain utama dirancang untuk layar 390px (iPhone standard)** — desktop menyesuaikan, bukan sebaliknya.

**Breakpoint layout:**

```
Mobile  (< 768px)  → Layout vertikal, full-width, tombol besar mudah di-tap
Tablet  (768–1024px) → Split 40/60: gambar kiri, form kanan — mulai terasa nyaman
Desktop (> 1024px) → Split 50/50: gambar dan form berdampingan, lebih luas
```

**Ketentuan UI mobile untuk halaman scan:**
- Tombol "Foto via Kamera" dan "Upload File" berukuran besar (min-height 56px), mudah di-tap satu tangan
- Setelah foto, preview gambar full-width sebelum diproses — admin bisa zoom untuk cek kualitas
- Langkah scan ditampilkan sebagai stepper vertikal: Capture → Processing → Preview
- Di step Preview (mobile): gambar form tampil di atas sebagai thumbnail accordion yang bisa dibuka/tutup; form field hasil parsing tampil di bawahnya secara full-width, scroll vertikal
- Keyboard muncul hanya saat admin tap field — tidak auto-focus yang mengganggu
- Tombol Submit di-pin di bagian bawah layar (sticky bottom bar) agar selalu terlihat tanpa harus scroll
- Loading state pakai full-screen overlay dengan animasi sederhana — tidak ada elemen kecil yang sulit dilihat

**Ketentuan UI desktop untuk halaman scan:**
- Split view: gambar original (kiri 50%) dan form preview (kanan 50%) tampil berdampingan tanpa perlu scroll
- Admin bisa zoom gambar dengan klik/hover untuk verifikasi tulisan yang kurang jelas
- Tombol Submit di pojok kanan bawah form, tidak sticky (tidak perlu karena layar cukup panjang)

---

### 9.3 Halaman Dashboard / Rekap — Desktop-First

**Rasional:** Melihat rekap, melakukan filter, membandingkan data, dan export adalah aktivitas yang jauh lebih nyaman di layar lebar. Tabel dengan banyak kolom tidak cocok dipaksakan ke layar kecil sebagai tampilan utama.

**Desain utama dirancang untuk layar 1280px (laptop standard)** — mobile menyesuaikan dengan layout yang disederhanakan.

**Breakpoint layout:**

```
Desktop (> 1024px) → Tabel penuh dengan semua kolom, filter bar di atas, sidebar opsional
Tablet  (768–1024px) → Tabel dengan kolom yang dikurangi (sembunyikan kolom minor)
Mobile  (< 768px)  → List card view (bukan tabel), tiap record jadi card vertikal
```

**Ketentuan UI desktop untuk dashboard:**
- Tabel menampilkan semua kolom: Nama, NIK, Dept, Jenis, Tgl Mulai, Tgl Selesai, Hari, Tgl Diinput, Aksi
- Filter bar horizontal di atas tabel: dropdown Jenis Form, dropdown Departemen, date range picker, search box — semua dalam satu baris
- Tombol Export (Excel + CSV) di kanan atas, sticky saat scroll ke bawah
- Klik row membuka detail di side panel (slide-in dari kanan) — tidak navigasi ke halaman baru, agar admin bisa langsung kembali ke posisi scroll yang sama
- Pagination di bawah tabel: 20 / 50 / 100 baris per halaman (pilihan admin)

**Ketentuan UI mobile untuk dashboard:**
- Tabel diganti dengan **card list** — tiap record tampil sebagai card dengan info utama: Nama, Jenis, Tgl Mulai–Selesai, badge Jenis Form
- Filter disembunyikan di balik tombol "Filter ▼" yang membuka bottom sheet
- Export tetap tersedia tapi posisinya di dalam menu filter / FAB button
- Kolom NIK, Departemen, Jabatan disembunyikan di card — hanya muncul di detail view
- Tombol "+ Scan Form Baru" sebagai **FAB (Floating Action Button)** di kanan bawah — akses cepat ke fungsi utama

---

### 9.4 Ringkasan Keputusan Responsive per Halaman

| Halaman | Primary Target | Mobile Behavior |
|---------|---------------|-----------------|
| Scan — Capture | Mobile | Full-width, kamera native |
| Scan — Preview | Mobile | Gambar accordion di atas, form scroll di bawah |
| Dashboard / Rekap | Desktop | Card list, filter bottom sheet, FAB scan |
| Edit Record | Desktop | Form full-width, gambar accordion |
| Export | Desktop | Tersedia di mobile via menu, bukan tombol utama |

---

## 10. UI/UX Flow

### 10.1 Halaman Dashboard / Rekap (Halaman Utama)

```
┌─────────────────────────────────────────────────────────┐
│  HRPGA — Rekap Form              [+ Scan Form Baru]     │
├─────────────────────────────────────────────────────────┤
│  Filter: [Semua Jenis ▼] [Semua Dept ▼] [Bulan ini ▼]  │
│  Search: [🔍 Cari nama / NIK...         ]  [Export xlsx]│
├─────────────────────────────────────────────────────────┤
│  Nama           NIK   Jenis  Tgl Mulai  Hr  Diinput  ⚙  │
│  Budi Santoso   1001  CUTI   01 Jun     3   hari ini  ✎🗑│
│  Ahmad Fauzi    1003  SPKL   31 Mei     1   kemarin   ✎🗑│
│  ...                                                    │
└─────────────────────────────────────────────────────────┘
```

### 10.2 Flow Scan Form Baru (3 Langkah)

```
LANGKAH 1 — CAPTURE
┌──────────────────────────────────────┐
│  Scan Form Baru                      │
│                                      │
│   [ 📷 Foto via Kamera ]             │
│                                      │
│   [ 📁 Upload dari File ]            │
│                                      │
│  Pastikan form terlihat jelas,       │
│  tidak blur dan tidak terpotong.     │
└──────────────────────────────────────┘

          ↓ (setelah foto/upload)

LANGKAH 2 — PROCESSING (otomatis)
┌──────────────────────────────────────┐
│                                      │
│   ⟳  Membaca form...                │
│      Mengekstrak data...             │
│                                      │
│   Estimasi: 5–10 detik               │
└──────────────────────────────────────┘

          ↓ (selesai)

LANGKAH 3 — PREVIEW & SUBMIT
┌─────────────────┬────────────────────┐
│ [Gambar Form]   │ Hasil Pembacaan    │
│                 │                    │
│ (tampil di sini)│ Jenis : [CUTI   ] │
│                 │ NIK   : [1001   ] │
│                 │ Nama  : [Budi S..] ← kuning jika kurang yakin
│                 │ Dept  : [Produksi] │
│                 │ Tgl Mulai: [01/06] │
│                 │ Tgl Sls  : [03/06] │
│                 │ Jml Hari : [3    ] │
│                 │ Ket   : [Keluarga] │
│                 │                    │
│                 │ [Batal]  [Submit ✓]│
└─────────────────┴────────────────────┘
```

> Di mobile: gambar dan form tampil vertikal (gambar di atas, form di bawah) dengan toggle show/hide gambar.

### 10.3 Halaman Edit Record

```
Edit Rekap — Budi Santoso / CUTI / 01 Jun 2026

  [semua field dalam form, pre-filled, semua bisa diedit]

  [Lihat Gambar Original ▼]   ← accordion toggle

  [Batal]          [Simpan Perubahan]
```

### 10.4 State & Feedback Visual

| Kondisi | Tampilan |
|---------|----------|
| Field confidence > 85% | Border normal, tidak ada indikator |
| Field confidence 50–85% | Border kuning, tooltip "Mohon verifikasi" |
| Field confidence < 50% | Border merah, field dikosongkan, admin isi manual |
| Field required kosong | Border merah, tombol Submit disabled |
| Submit berhasil | Toast hijau "Data berhasil disimpan", redirect ke rekap |
| OCR gagal total | Modal error dengan opsi "Foto Ulang" |
| Duplikat terdeteksi | Banner kuning "Form ini mungkin sudah diinput sebelumnya" |

---

## 11. Edge Cases & Risk Mitigation

| Skenario | Risiko | Mitigasi |
|----------|--------|----------|
| Tulisan tangan sangat jelek | Data salah terparse | Field confidence rendah → highlight → admin koreksi manual |
| Foto miring / blur | OCR tidak akurat | Image preprocessing + peringatan kualitas sebelum proses |
| Karyawan tidak ada di database | Nama tidak tervalidasi | Tetap bisa submit, diberi flag "tidak terdaftar" |
| Form rusak atau tidak lengkap | Field tidak terbaca | Field kosong + highlight merah, wajib isi manual |
| Duplikat scan | Data ganda di rekap | Hash check + logic check NIK + tanggal + jenis form |
| Google Vision API down / error | OCR tidak berjalan | Error message jelas + opsi input manual semua field |
| Internet lambat saat upload | Timeout | Retry otomatis 3x + kompresi gambar sebelum kirim |
| Admin submit data salah | Data keliru di rekap | Edit tersedia kapan saja, perubahan tercatat di audit log |
| Volume form sangat banyak (>50/hari) | Antrian proses lambat | Queue processing + progress indicator |

---

## 12. Roadmap Pengembangan

### Phase 0 — PoC dengan Form Sample
**Estimasi: 2–3 minggu**

- [ ] Setup project Next.js + Supabase + Prisma
- [ ] Halaman: Dashboard/Rekap, Scan Baru, Edit
- [ ] Integrasi Google Cloud Vision API (OCR)
- [ ] Integrasi Claude API (AI Parser + normalisasi)
- [ ] Image preprocessing dengan Sharp.js
- [ ] Fuzzy matching nama dengan Fuse.js
- [ ] Database karyawan sample (8 orang)
- [ ] Export Excel dengan ExcelJS
- [ ] Soft delete + audit log dasar
- [ ] Testing dengan 10 form rekayasa

**Deliverable:** Aplikasi bisa diakses di Vercel, proses scan → preview → submit → rekap berjalan end-to-end. Akurasi diukur dan didokumentasikan.

---

### Phase 1 — Production dengan Data Asli
**Estimasi: 3–4 minggu (setelah PoC approved)**

- [ ] Ganti schema ke field form SPKL dan Cuti asli (dari template form aktual)
- [ ] Import database karyawan aktual Toshin Prima
- [ ] Login admin sederhana (username + password via Supabase Auth)
- [ ] Laporan rekap bulanan per departemen
- [ ] Export PDF
- [ ] Deploy ke domain production / subdomain internal

---

### Phase 2 — Enhancement (Opsional)
**Sesuai kebutuhan bisnis**

- [ ] Batch scan (proses beberapa form sekaligus dalam satu sesi)
- [ ] Dashboard statistik (grafik tren lembur, absensi per departemen)
- [ ] Notifikasi rekap otomatis (email ke atasan setiap akhir bulan)
- [ ] Integrasi dengan HRIS atau sistem penggajian existing

---

## 13. Testing Plan

### 12.1 Skenario Testing Phase 0

**Buat 10 lembar form rekayasa** dengan variasi berikut:

| Form | Kondisi Tulisan | Kondisi Foto | Nama yang Ditulis | Tujuan Uji |
|------|----------------|-------------|-------------------|------------|
| 01 | Rapi, cetak kapital | Lurus, cahaya cukup | Budi Santoso | Baseline akurasi |
| 02 | Rapi, cetak kapital | Lurus, cahaya cukup | Siti Rahayu | Baseline akurasi |
| 03 | Tulisan tangan sedang | Sedikit miring 5° | Ahmad Fauzi | Toleransi miring |
| 04 | Tulisan tangan sedang | Normal | "Ahmad Fauzy" (typo) | Fuzzy match nama |
| 05 | Tulisan tangan kurang jelas | Normal | Dewi Permatasari | Confidence handling |
| 06 | Huruf sambung | Agak gelap | "Riko Prasetio" (typo) | Fuzzy match + preprocessing |
| 07 | Tulisan sangat jelek | Normal | Rina Wulandari | Worst case OCR |
| 08 | Rapi, cetak kapital | Terlalu terang (backlit) | Hendra Setiawan | Preprocessing kontras |
| 09 | Tulisan tangan sedang | Normal | Lestari Ningrum | Format tanggal: "1 Jun 26" |
| 10 | Sama persis dengan Form 01 | Normal | Budi Santoso | Deteksi duplikat |

**Target Phase 0:** Minimal 7 dari 10 form ter-parse dengan ≥ 80% field akurat.

### 12.2 Functional Checklist

- [ ] Upload gambar → proses OCR berjalan tanpa error
- [ ] Preview muncul dengan field terisi otomatis
- [ ] Field confidence rendah ter-highlight
- [ ] Submit berhasil → data muncul di tabel rekap
- [ ] Edit record → perubahan tersimpan
- [ ] Hapus record → hilang dari tampilan (soft delete)
- [ ] Export Excel → file bisa dibuka, data sesuai
- [ ] Form duplikat → warning muncul
- [ ] Upload gambar non-foto (PDF) → error yang jelas
- [ ] Required field kosong → tombol Submit disabled

---

## 14. Appendix

### A. AI Parser Prompt Template

```
Kamu adalah parser otomatis untuk sistem rekap HR PT Toshin Prima Fine Blanking.
Tugasmu: baca teks hasil OCR dari form kertas, lalu ekstrak data ke field yang terstruktur.

TEKS OCR DARI FORM:
---
{raw_ocr_text}
---

DATABASE KARYAWAN (gunakan untuk validasi dan koreksi nama):
{employee_list_json}

INSTRUKSI:
1. Tentukan jenis form: SPKL / CUTI / IZIN / SAKIT
2. Ekstrak field: nik, nama_karyawan, departemen, tanggal_mulai, tanggal_selesai, jumlah_hari, keterangan
3. Normalisasi semua tanggal ke format YYYY-MM-DD, apapun cara penulisannya
4. Cocokkan nama_karyawan ke database. Jika ada yang mirip (typo), gunakan nama dari database
5. Beri confidence score (0.0–1.0) per field — rendah jika teks tidak terbaca jelas
6. Jika field tidak bisa dibaca sama sekali, isi null

RESPONSE FORMAT (JSON only, tanpa markdown, tanpa teks lain):
{
  "jenis_form": "CUTI",
  "fields": {
    "nik":             { "value": "1001",          "confidence": 0.95, "corrected": false },
    "nama_karyawan":   { "value": "Budi Santoso",  "confidence": 0.85, "corrected": true, "original": "Budi Snatos" },
    "departemen":      { "value": "Produksi",      "confidence": 0.90, "corrected": false },
    "tanggal_mulai":   { "value": "2026-06-01",    "confidence": 0.95, "corrected": false },
    "tanggal_selesai": { "value": "2026-06-03",    "confidence": 0.92, "corrected": false },
    "jumlah_hari":     { "value": 3,               "confidence": 0.88, "corrected": false },
    "keterangan":      { "value": "Keperluan keluarga", "confidence": 0.75, "corrected": false }
  }
}
```

### B. Struktur Folder Project

```
smart-form-scanner/
├── app/
│   ├── page.tsx                    ← Dashboard / Rekap (halaman utama)
│   ├── scan/
│   │   └── page.tsx                ← Scan form baru (capture → preview → submit)
│   ├── submissions/
│   │   └── [id]/
│   │       └── edit/
│   │           └── page.tsx        ← Edit record
│   └── api/
│       ├── scan/
│       │   └── route.ts            ← OCR + AI parse endpoint
│       ├── submissions/
│       │   ├── route.ts            ← GET list + POST create
│       │   └── [id]/
│       │       └── route.ts        ← GET detail + PATCH + DELETE
│       ├── submissions/export/
│       │   └── route.ts            ← GET export Excel
│       └── employees/
│           └── route.ts            ← GET search karyawan
├── components/
│   ├── scan/
│   │   ├── ImageCapture.tsx        ← Upload / kamera component
│   │   ├── ProcessingState.tsx     ← Loading state saat OCR
│   │   └── ScanPreview.tsx         ← Preview + form edit sebelum submit
│   ├── submissions/
│   │   ├── RekapTable.tsx          ← Tabel rekap utama
│   │   ├── RekapFilters.tsx        ← Filter & search
│   │   └── ExportButton.tsx        ← Trigger export Excel
│   └── ui/                         ← shadcn/ui components
├── lib/
│   ├── ocr.ts                      ← Google Cloud Vision wrapper
│   ├── ai-parser.ts                ← Claude API parser
│   ├── image-processor.ts          ← Sharp preprocessing
│   ├── fuzzy-match.ts              ← Fuse.js employee matching
│   ├── duplicate-check.ts          ← Hash + logic duplicate detection
│   ├── excel-export.ts             ← ExcelJS export logic
│   └── prisma.ts                   ← Prisma client
├── prisma/
│   ├── schema.prisma
│   └── seed.ts                     ← Sample employee data
├── public/
│   └── manifest.json               ← PWA manifest
└── .env.local
    ├── GOOGLE_VISION_API_KEY
    ├── ANTHROPIC_API_KEY
    └── DATABASE_URL (Supabase)
```

### C. Estimasi Biaya Operasional (Pasca Production)

| Layanan | Volume Est. | Biaya/Bulan |
|---------|------------|-------------|
| Google Cloud Vision | ~300 scan/bulan | Gratis (free tier 1.000/bulan) |
| Claude API (Sonnet) | ~300 request/bulan | ~$0.50–$1.00 |
| Supabase | Internal tool scale | Gratis (free tier) |
| Vercel Hosting | Internal tool | Gratis (free tier) |
| **Total estimasi** | | **< $2/bulan** |

> Untuk skala internal perusahaan dengan volume rekap normal, biaya operasional sangat minimal.

---

*Dokumen ini akan diupdate di Phase 1 dengan field form SPKL dan Cuti asli setelah template form aktual diterima dari tim HRPGA.*

**KyloDev × PT Toshin Prima Fine Blanking — HRPGA IT Project 2026**
