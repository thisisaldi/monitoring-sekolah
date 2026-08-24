# BUSINESS REQUIREMENT DOCUMENT (BRD)

## Sistem Monitoring Keuangan Sekolah Binaan

**Version:** 0.1
**Status:** Draft for SDD & Development
**Basis:** Template Monitoring Keuangan Sekolah Daerah/Perwakilan
**Target:** Web Application
**Primary Users:** Cabang/Perwakilan dan Pusat

---

# 1. Document Purpose

Dokumen ini mendefinisikan kebutuhan bisnis untuk pengembangan aplikasi web monitoring keuangan sekolah binaan.

Sistem dikembangkan sebagai pengganti proses monitoring berbasis spreadsheet/Excel yang saat ini digunakan untuk mengumpulkan dan memonitor data dari sekolah melalui masing-masing cabang/perwakilan.

Tujuan utama sistem:

1. Memungkinkan setiap cabang/perwakilan melakukan input data sekolah yang berada di bawah tanggung jawabnya.
2. Memungkinkan cabang memperbarui data yang sudah pernah diinput.
3. Memungkinkan pusat memonitor seluruh data dari seluruh cabang.
4. Mengurangi ketergantungan terhadap spreadsheet sebagai media input dan monitoring.
5. Menghasilkan perhitungan dan indikator monitoring secara otomatis.
6. Menyimpan informasi waktu dan user yang melakukan input/perubahan data.
7. Menjaga agar pusat hanya memiliki akses monitoring dan tidak dapat mengubah data cabang.

---

# 2. Background

Proses monitoring saat ini menggunakan spreadsheet dengan beberapa sheet yang saling berkaitan.

Struktur utama template terdiri dari:

1. Dashboard
2. Master Sekolah
3. RKAS
4. Realisasi Bulanan
5. Realisasi Semester
6. BOS
7. Piutang
8. Rekonsiliasi
9. Temuan & Tindak Lanjut

Dashboard digunakan sebagai ringkasan monitoring dari data yang terdapat pada modul-modul tersebut.

Dalam aplikasi baru, struktur spreadsheet tidak akan diterjemahkan menjadi sheet atau tabel secara langsung.

Data akan dimodelkan sebagai entitas yang saling berhubungan sehingga:

* data sekolah menjadi master;
* data RKAS menjadi dasar perencanaan;
* realisasi mengacu kepada RKAS;
* data semester merupakan agregasi/evaluasi realisasi;
* data BOS memiliki perhitungan saldo;
* data piutang memiliki perhitungan saldo;
* rekonsiliasi membandingkan saldo laporan dan saldo bank;
* temuan dan tindak lanjut menjadi bagian monitoring.

---

# 3. Business Objective

## 3.1 Primary Objective

Membangun sistem terpusat untuk pengumpulan dan monitoring data keuangan sekolah binaan dari seluruh cabang/perwakilan.

## 3.2 Secondary Objectives

* Mempercepat proses monitoring pusat.
* Mengurangi kesalahan perhitungan manual.
* Mengurangi duplikasi data.
* Mengetahui sekolah yang belum melakukan pengisian.
* Mengetahui kapan data terakhir diperbarui.
* Mempermudah penelusuran kondisi keuangan setiap sekolah.
* Menyediakan data yang terstruktur untuk pengembangan dashboard monitoring.

---

# 4. Scope

## 4.1 In Scope

Versi pertama sistem mencakup:

### Authentication

* Login user.
* Role-based access.

### Master Data

* Cabang/perwakilan.
* Sekolah.
* Informasi dasar sekolah.

### Modul Keuangan

* RKAS.
* Realisasi Bulanan.
* Realisasi Semester.
* BOS.
* Piutang.
* Rekonsiliasi.

### Modul Monitoring

* Temuan & Tindak Lanjut.

### Dashboard

* Dashboard cabang.
* Dashboard pusat.
* Ringkasan status pengisian.
* Monitoring data sekolah.
* Filter berdasarkan cabang, sekolah, dan periode.

### Audit Information

Setiap data yang dibuat atau diperbarui menyimpan:

* waktu pembuatan;
* user pembuat;
* waktu perubahan terakhir;
* user yang melakukan perubahan terakhir.

---

# 5. Out of Scope

Fitur berikut tidak termasuk versi pertama:

1. Approval workflow.
2. Submission/approval status.
3. Pusat melakukan editing data cabang.
4. Pusat melakukan input data operasional cabang.
5. Delete data oleh cabang.
6. Delete data oleh pusat.
7. Penentuan otomatis status risiko Hijau/Kuning/Oranye/Merah.
8. Workflow audit SPI.
9. Notifikasi otomatis.
10. Integrasi dengan sistem eksternal.
11. Mobile application native.
12. AI-based financial analysis.

Fitur-fitur tersebut dapat dipertimbangkan pada fase berikutnya.

---

# 6. User Roles

## 6.1 Role: Cabang/Perwakilan

Cabang bertanggung jawab terhadap data sekolah yang berada di bawah cabang tersebut.

### Permissions

| Action              | Permission |
| ------------------- | ---------- |
| Login               | Yes        |
| View own branch     | Yes        |
| View own schools    | Yes        |
| Input data          | Yes        |
| Edit own data       | Yes        |
| Delete data         | No         |
| View other branches | No         |
| Edit central data   | No         |

Cabang hanya dapat mengakses sekolah yang terasosiasi dengan cabangnya.

---

## 6.2 Role: Pusat

Pusat bertindak sebagai monitoring user.

### Permissions

| Action                 | Permission |
| ---------------------- | ---------- |
| Login                  | Yes        |
| View all branches      | Yes        |
| View all schools       | Yes        |
| View all modules       | Yes        |
| Input operational data | No         |
| Edit branch data       | No         |
| Delete data            | No         |

Pusat bersifat read-only terhadap data operasional.

---

# 7. Organizational Structure

Setiap cabang/perwakilan mengelola tepat satu sekolah (hubungan Cabang:Sekolah bersifat 1:1).

```text
Pusat
 ├── Cabang A ── Sekolah A
 ├── Cabang B ── Sekolah B
 └── Cabang C ── Sekolah C
```

> **Koreksi requirement:** Contoh sebelumnya menampilkan satu cabang dengan
> beberapa sekolah (1:N). Ini telah dikoreksi menjadi 1:1 (satu cabang =
> satu sekolah) sesuai keputusan bisnis terbaru. Lihat ERD.md/DATABASE-SCHEMA.md
> untuk detail penerapan pada level database.

Daftar sekolah merupakan master data yang telah ditentukan.

Cabang tidak memiliki permission untuk:

* membuat sekolah baru;
* menghapus sekolah;
* memindahkan sekolah ke cabang lain.

Pengelolaan master sekolah dapat dilakukan melalui mekanisme administrasi yang akan ditentukan pada fase desain sistem.

---

# 8. Business Process

## 8.1 General Flow

```text
Login
  ↓
Identifikasi Role
  ↓
┌───────────────────────┐
│                       │
Cabang                 Pusat
│                       │
↓                       ↓
Sekolah Cabang        Dashboard
│                       │
↓                       ↓
Input/Edit Data       Monitoring
│
↓
Database
```

---

# 9. Data Relationship

Hubungan utama antar-data:

```text
Cabang
   │
   └── Sekolah
            │
            ├──< RKAS
            │
            ├──< Realisasi Bulanan
            │
            ├──< Realisasi Semester
            │
            ├──< BOS
            │
            ├──< Piutang
            │
            ├──< Rekonsiliasi
            │
            └──< Temuan & Tindak Lanjut
```

Setiap modul harus memiliki referensi ke sekolah melalui `school_id`.

Data tidak boleh mengandalkan nama sekolah sebagai foreign key.

---

# 10. Tahun Anggaran

Sistem menggunakan konsep Tahun Anggaran.

Contoh:

```text
TA 2026/2027
```

Semua data keuangan yang bersifat periodik harus memiliki referensi terhadap tahun anggaran.

Tujuan:

* mencegah data antar-tahun tercampur;
* memungkinkan monitoring historis;
* memungkinkan penggunaan sistem pada tahun anggaran berikutnya.

---

# 11. Module Requirements

# 11.1 Master Sekolah

Master sekolah menjadi sumber referensi untuk seluruh modul.

## Data

| Field           | Description              |
| --------------- | ------------------------ |
| school_id       | Unique identifier        |
| branch_id       | Cabang/perwakilan        |
| school_name     | Nama sekolah             |
| education_level | Jenjang                  |
| principal_name  | Kepala sekolah           |
| treasurer_name  | Bendahara                |
| student_count   | Jumlah siswa             |
| risk_status     | Status risiko, sementara |
| note            | Catatan                  |

### Business Rules

1. Satu sekolah hanya memiliki satu cabang pada satu waktu.
2. Nama sekolah bukan primary key.
3. Cabang hanya dapat melihat sekolah miliknya.
4. Pusat dapat melihat seluruh sekolah.
5. Cabang tidak dapat membuat atau menghapus sekolah melalui workflow operasional.

---

# 11.2 RKAS

RKAS merupakan data perencanaan anggaran sekolah.

Data mengikuti konsep:

```text
RKAS Awal
     ↓
Revisi 1
     ↓
Revisi 2
     ↓
RKAS Terakhir
```

## Input

* RKAS Awal.
* Tanggal Pengesahan.
* Revisi 1.
* Tanggal Revisi 1.
* Revisi 2.
* Tanggal Revisi 2.
* Perubahan Utama.
* Status Review jika diperlukan pada implementasi lanjutan.

## Calculated Field

`Nilai RKAS Terakhir`

Business rule:

```text
Jika Revisi 2 tersedia:
    RKAS Terakhir = Revisi 2

Jika Revisi 2 tidak tersedia tetapi Revisi 1 tersedia:
    RKAS Terakhir = Revisi 1

Jika tidak ada revisi:
    RKAS Terakhir = RKAS Awal
```

Sistem harus menghitung nilai ini secara otomatis.

Cabang tidak perlu menginput `Nilai RKAS Terakhir`.

---

# 11.3 Realisasi Bulanan

Realisasi bulanan membandingkan anggaran RKAS dengan realisasi aktual setiap bulan.

Periode default tahun anggaran:

```text
Juli
Agustus
September
Oktober
November
Desember
Januari
Februari
Maret
April
Mei
Juni
```

## Input

* Bulan.
* Anggaran RKAS Bulanan.
* Realisasi.
* Penjelasan Selisih.

## Calculated Field

### Selisih

```text
Selisih = Anggaran RKAS Bulanan - Realisasi
```

### Persentase Realisasi

```text
% Realisasi = Realisasi / Anggaran RKAS Bulanan × 100%
```

Jika anggaran kosong atau nol, sistem tidak boleh menghasilkan error pembagian.

## Status Laporan

Sistem perlu dapat menentukan apakah data bulan tersebut sudah tersedia atau belum.

Contoh:

```text
Sudah Diisi
Belum Diisi
```

Status ini digunakan oleh dashboard pusat.

---

# 11.4 Realisasi Semester

Realisasi semester digunakan untuk mengevaluasi realisasi terhadap RKAS terakhir.

## Input

* Realisasi Semester 1.
* Realisasi Semester 2.
* Catatan Evaluasi.

## Reference

* RKAS Terakhir dari modul RKAS.

## Calculated Field

### Persentase Semester 1

```text
% Semester 1 =
Realisasi Semester 1 / RKAS Terakhir × 100%
```

### Total Realisasi

```text
Total Realisasi =
Realisasi Semester 1 + Realisasi Semester 2
```

### Persentase Akhir

```text
% Akhir =
Total Realisasi / RKAS Terakhir × 100%
```

### Sisa Anggaran

```text
Sisa Anggaran =
RKAS Terakhir - Total Realisasi
```

Nilai calculated field tidak boleh diedit secara manual.

---

# 11.5 BOS

Modul BOS digunakan untuk monitoring saldo dan penggunaan dana BOS.

## Input

* Saldo Awal BOS.
* Penerimaan BOS.
* Penggunaan BOS.
* Kesesuaian dengan RKAS.
* Status Laporan BOS.
* Catatan/Temuan.

## Calculated Field

```text
Saldo Akhir BOS =
Saldo Awal BOS
+ Penerimaan BOS
- Penggunaan BOS
```

Saldo akhir harus dihitung sistem.

---

# 11.6 Piutang

Modul Piutang digunakan untuk memonitor saldo piutang sekolah.

## Input

* Piutang Awal.
* Penambahan.
* Pelunasan.
* Umur Piutang Dominan.
* Tindak Lanjut.

## Calculated Field

```text
Piutang Akhir =
Piutang Awal
+ Penambahan
- Pelunasan
```

Persentase tunggakan mengikuti definisi bisnis yang akan dikonfirmasi sebelum implementasi final.

---

# 11.7 Rekonsiliasi

Rekonsiliasi digunakan untuk membandingkan saldo menurut laporan keuangan dengan saldo bank.

## Input

* Saldo Menurut Laporan Keuangan.
* Saldo Bank.
* Kesesuaian RKAS.
* Catatan.
* Tindak Lanjut.

## Calculated Field

```text
Selisih Bank-Laporan =
Saldo Bank - Saldo Menurut Laporan Keuangan
```

## Status Rekonsiliasi

Status rekonsiliasi harus dapat menunjukkan apakah saldo sesuai atau tidak.

Minimum status:

```text
Sesuai
Tidak Sesuai
```

Rule detail untuk menentukan toleransi selisih perlu dikonfirmasi sebelum implementasi.

---

# 11.8 Temuan & Tindak Lanjut

Modul ini digunakan untuk mencatat hasil monitoring dan tindak lanjut.

## Input

* Tanggal.
* Sekolah.
* Sumber Temuan.
* Temuan.
* Nilai.
* Risiko.
* Rekomendasi.
* PIC.
* Deadline.
* Status.
* Tanggal Selesai.

## Business Rule

Temuan harus terkait dengan sekolah.

Status tindak lanjut minimal perlu mendukung kondisi seperti:

```text
Open
On Progress
Selesai
```

Daftar status final perlu dikonfirmasi sebelum implementasi.

---

# 12. Data Entry Rules

## 12.1 General

1. Field wajib harus divalidasi sebelum penyimpanan.
2. Field nominal hanya menerima angka/nilai mata uang yang valid.
3. Field tanggal menggunakan format tanggal standar.
4. Foreign key harus mengacu pada ID database, bukan nama.
5. Sistem tidak boleh membuat duplicate record untuk kombinasi data yang seharusnya unik.
6. Data yang telah tersimpan tidak dapat dihapus melalui UI.
7. Data dapat diedit oleh cabang yang memiliki hak akses terhadap data tersebut.
8. Pusat tidak dapat mengubah data.

---

# 13. Audit Information

Setiap entitas operasional minimal memiliki:

```text
created_at
created_by
updated_at
updated_by
```

Contoh:

```text
Created:
12 August 2026 09:32
by: Cabang Bandung

Last Updated:
15 August 2026 14:21
by: Cabang Bandung
```

Tujuannya agar pusat dapat mengetahui kapan data terakhir diinput atau diperbarui.

## Future Enhancement

Full audit history dapat ditambahkan kemudian:

```text
Value Before
Value After
Changed Field
Changed By
Changed At
```

Fitur ini belum menjadi mandatory pada versi pertama.

---

# 14. Dashboard Requirements

Dashboard merupakan hasil agregasi dari data operasional.

Dashboard tidak menjadi sumber input manual.

## 14.1 Dashboard Pusat

Dashboard pusat minimal menyediakan:

### Summary

* Jumlah sekolah.
* Jumlah sekolah berdasarkan cabang.
* Jumlah laporan bulanan yang belum lengkap.
* Jumlah rekonsiliasi bermasalah.

### Monitoring

Pusat dapat melakukan filter berdasarkan:

* Tahun Anggaran.
* Cabang.
* Sekolah.

### School Monitoring

Pusat dapat melihat status data setiap sekolah.

Contoh:

| Sekolah   | RKAS | Bulanan | Semester | BOS | Piutang | Rekonsiliasi |
| --------- | ---- | ------- | -------- | --- | ------- | ------------ |
| Sekolah A | ✓    | ✓       | ✓        | ✓   | ✓       | ✓            |
| Sekolah B | ✓    | ✓       | -        | ✓   | ✓       | ✗            |

Pusat dapat memilih sekolah untuk melihat detail datanya.

---

# 15. Dashboard Cabang

Dashboard cabang hanya menampilkan data sekolah yang menjadi tanggung jawab cabang tersebut.

Minimal menampilkan:

* Jumlah sekolah.
* Status kelengkapan data.
* Sekolah yang belum memiliki data tertentu.
* Last updated.
* Ringkasan kondisi data.

Cabang tidak dapat melihat sekolah milik cabang lain.

---

# 16. Navigation

Struktur aplikasi yang direkomendasikan:

```text
Dashboard
│
├── Sekolah
│
├── RKAS
│
├── Realisasi Bulanan
│
├── Realisasi Semester
│
├── BOS
│
├── Piutang
│
├── Rekonsiliasi
│
└── Temuan & Tindak Lanjut
```

Namun UI harus berorientasi pada **sekolah**, bukan meniru struktur spreadsheet.

Contoh:

```text
Sekolah A
│
├── Overview
├── RKAS
├── Realisasi Bulanan
├── Realisasi Semester
├── BOS
├── Piutang
├── Rekonsiliasi
└── Temuan & Tindak Lanjut
```

Dengan demikian user tidak perlu berpindah-pindah spreadsheet-style sheet untuk memahami satu sekolah.

---

# 17. School Overview

Setiap sekolah sebaiknya memiliki halaman overview.

Contoh informasi:

```text
SEKOLAH A
Cabang: Bandung
Jenjang: SD
Kepala Sekolah: XXXXX
Bendahara: XXXXX
Jumlah Siswa: XXX

DATA MONITORING

RKAS                 ✓
Realisasi Bulanan    10/12 bulan
Realisasi Semester   ✓
BOS                  ✓
Piutang              ✓
Rekonsiliasi         ✗
Temuan               2
```

Halaman ini menjadi titik utama bagi pusat untuk melakukan monitoring terhadap satu sekolah.

---

# 18. Status Kelengkapan

Status kelengkapan bukan status approval.

Sistem hanya perlu membedakan apakah data yang diperlukan sudah tersedia.

Contoh:

```text
Complete
Incomplete
Not Available
```

Status harus dihitung berdasarkan kebutuhan masing-masing modul dan periode.

---

# 19. Business Rules Regarding Editing

Cabang dapat mengedit data yang sebelumnya telah disimpan.

Contoh:

```text
Data awal:
Realisasi = Rp10.000.000

User memperbaiki:
Realisasi = Rp12.000.000
```

Record tetap merupakan data yang sama.

Sistem memperbarui:

```text
updated_at
updated_by
```

Tidak membuat duplicate record.

Pusat hanya melihat nilai terakhir.

---

# 20. Business Rules Regarding Deletion

Tidak tersedia fungsi delete pada UI untuk data operasional.

Jika terdapat kesalahan data:

```text
Cabang
  ↓
Edit existing record
  ↓
Save
```

Bukan:

```text
Delete
  ↓
Create new record
```

Penghapusan secara database hanya diperbolehkan melalui mekanisme administrasi/maintenance yang berada di luar workflow pengguna biasa.

---

# 21. Data Integrity

Sistem harus menjaga agar:

1. Satu sekolah tidak memiliki duplicate data untuk periode yang sama.
2. Data satu cabang tidak dapat diakses oleh cabang lain.
3. Data pusat bersifat read-only.
4. Calculated field tidak dapat diubah manual.
5. Data antar-tahun anggaran tidak tercampur.
6. Relasi antar-modul menggunakan ID.
7. Data yang telah tersimpan tidak dapat dihapus melalui UI.

---

# 22. Non-Functional Requirements

## 22.1 Security

* Authentication wajib digunakan.
* Authorization berdasarkan role.
* Cabang hanya dapat mengakses data cabangnya.
* Pusat memiliki akses read-only.
* Password tidak disimpan dalam plaintext.
* API harus melakukan authorization, bukan hanya frontend.

## 22.2 Performance

Dashboard harus mampu menampilkan ringkasan data tanpa membutuhkan loading seluruh data mentah di frontend.

Query agregasi harus dilakukan pada database/backend apabila diperlukan.

## 22.3 Usability

Form harus:

* sederhana;
* jelas;
* menggunakan format nominal yang mudah dibaca;
* memberikan validasi;
* menunjukkan field calculated sebagai read-only;
* menunjukkan last updated.

## 22.4 Maintainability

Kode harus modular.

Business calculation tidak boleh hanya berada di frontend.

Perhitungan penting harus dapat divalidasi pada backend/service layer.

---

# 23. Error Handling

Sistem harus memberikan pesan yang jelas apabila:

* field wajib kosong;
* format angka tidak valid;
* format tanggal tidak valid;
* user tidak memiliki akses;
* data periode sudah tersedia;
* terjadi duplicate data;
* server/database mengalami error.

Contoh:

```text
Data bulan Juli untuk Sekolah A sudah tersedia.
Silakan edit data yang sudah ada.
```

---

# 24. Recommended API Concept

API belum menjadi desain teknis final, tetapi SDD harus menyediakan endpoint berdasarkan resource.

Contoh:

```text
/auth
/users
/branches
/schools
/budget-years
/rkas
/monthly-realizations
/semester-realizations
/bos
/receivables
/reconciliations
/findings
/dashboard
```

Detail endpoint, HTTP method, request/response schema, authentication, dan authorization akan ditentukan dalam SDD.

---

# 25. Recommended Core Entities

Minimal database perlu memiliki konsep:

```text
User
Branch
School
BudgetYear

RKAS
RKASRevision

MonthlyRealization
SemesterRealization

BOS
Receivable
Reconciliation

Finding
FollowUp

AuditMetadata
```

Struktur database final tidak boleh dibuat hanya berdasarkan nama sheet Excel.

SDD harus menentukan normalisasi dan relationship final berdasarkan business requirements ini.

---

# 26. Acceptance Criteria

## Authentication

* User dapat login menggunakan credential yang valid.
* User dengan role Cabang diarahkan ke dashboard cabang.
* User dengan role Pusat diarahkan ke dashboard pusat.

## Authorization

* Cabang tidak dapat melihat sekolah cabang lain.
* Cabang tidak dapat mengakses data melalui API cabang lain.
* Pusat dapat melihat seluruh sekolah.
* Pusat tidak dapat melakukan update melalui UI/API operasional.

## School

* Sekolah memiliki unique ID.
* Sekolah terhubung dengan satu cabang.
* Cabang tidak dapat membuat sekolah baru melalui workflow normal.

## RKAS

* Cabang dapat memasukkan RKAS awal.
* Cabang dapat memasukkan revisi.
* Sistem menghitung RKAS terakhir.
* Nilai RKAS terakhir tidak dapat diedit manual.

## Realisasi Bulanan

* Cabang dapat mengisi realisasi per bulan.
* Sistem menghitung selisih.
* Sistem menghitung persentase realisasi.
* Sistem mengetahui apakah suatu bulan sudah memiliki data.
* Data bulan yang sama tidak boleh duplicate.

## Realisasi Semester

* Sistem mengambil RKAS terakhir.
* Sistem menghitung persentase semester.
* Sistem menghitung total realisasi.
* Sistem menghitung persentase akhir.
* Sistem menghitung sisa anggaran.

## BOS

* Cabang dapat menginput saldo awal, penerimaan, dan penggunaan.
* Sistem menghitung saldo akhir.

## Piutang

* Cabang dapat menginput piutang awal, penambahan, dan pelunasan.
* Sistem menghitung piutang akhir.

## Rekonsiliasi

* Cabang dapat menginput saldo laporan dan saldo bank.
* Sistem menghitung selisih.
* Sistem menampilkan status rekonsiliasi.

## Monitoring

* Pusat dapat melihat seluruh sekolah.
* Pusat dapat melakukan filter.
* Pusat dapat melihat detail sekolah.
* Pusat dapat melihat waktu terakhir data diperbarui.
* Pusat dapat melihat data seluruh modul secara read-only.

---

# 27. Future Enhancement

Fitur berikut tidak menjadi bagian MVP tetapi struktur sistem sebaiknya tidak menghalangi implementasinya di masa depan:

1. Approval workflow.
2. Full audit trail.
3. Notification/reminder.
4. Export Excel/PDF.
5. Upload dokumen pendukung.
6. Risk scoring otomatis.
7. Automatic anomaly detection.
8. Dashboard analytics.
9. Mobile responsive enhancement.
10. Integrasi sistem eksternal.
11. AI-assisted financial analysis.
12. Role tambahan seperti Admin, Auditor, atau Reviewer.

---

# 28. AI Development Guidelines

Dokumen BRD ini akan digunakan sebagai sumber requirement untuk AI coding/development agent.

AI developer **tidak boleh mengasumsikan requirement yang belum didefinisikan**.

Jika requirement teknis belum ditentukan, AI harus:

1. Mengikuti business rules dalam BRD.
2. Tidak mengubah business logic tanpa persetujuan.
3. Tidak membuat fitur di luar scope.
4. Tidak membuat approval workflow.
5. Tidak memberikan akses edit kepada pusat.
6. Tidak memberikan delete kepada cabang.
7. Tidak membuat sekolah baru melalui workflow cabang.
8. Tidak menjadikan calculated field sebagai input manual.
9. Menggunakan relational ID untuk hubungan antar-data.
10. Menjaga pemisahan authorization antara cabang dan pusat.

Jika terdapat requirement yang ambigu atau bertentangan, AI harus menandai ambiguity tersebut dan meminta keputusan sebelum mengimplementasikan business logic yang bersangkutan.

AI developer juga harus memisahkan:

```text
Business Logic
     ↓
Backend / Service Layer

Data Persistence
     ↓
Database

Presentation
     ↓
Frontend
```

Business calculation tidak boleh hanya diimplementasikan sebagai logic frontend.

---

# 29. Open Business Decisions

Requirement berikut masih harus dikonfirmasi sebelum SDD final:

### OBD-001 — Master Data Management

Siapa yang memiliki hak untuk:

* menambah cabang;
* menambah sekolah;
* mengubah informasi sekolah;
* menonaktifkan sekolah?

### OBD-002 — Periode Modul

Perlu ditentukan apakah:

* BOS;
* Piutang;
* Rekonsiliasi;
* Temuan;

menggunakan periode bulanan, semester, tahunan, atau kombinasi tertentu.

### OBD-003 — Status Rekonsiliasi

Rule untuk:

```text
Sesuai
Tidak Sesuai
```

belum ditentukan secara formal.

Perlu ditentukan apakah:

```text
Selisih = 0 → Sesuai
Selisih ≠ 0 → Tidak Sesuai
```

atau menggunakan tolerance tertentu.

### OBD-004 — Persentase Tunggakan

Formula `% Tunggakan` pada Piutang perlu dikonfirmasi.

### OBD-005 — Status Temuan

Daftar status final perlu dikonfirmasi.

### OBD-006 — Status Risiko

Status:

```text
Hijau
Kuning
Oranye
Merah
```

untuk sementara tidak digunakan sebagai business rule otomatis.

### OBD-007 — Audit Trail

Versi pertama menggunakan:

```text
created_at
created_by
updated_at
updated_by
```

Full change history dapat ditambahkan kemudian.

---

# 30. MVP Definition

MVP dianggap selesai apabila:

```text
User Login
    ↓
Role Authorization
    ↓
Cabang memilih Sekolah
    ↓
Cabang mengisi data
    ↓
Data tersimpan
    ↓
Cabang dapat edit
    ↓
Tidak dapat delete
    ↓
Pusat melihat seluruh data
    ↓
Dashboard melakukan agregasi
    ↓
Last Updated tercatat
```

Seluruh modul berikut tersedia:

```text
✓ Master Sekolah
✓ RKAS
✓ Realisasi Bulanan
✓ Realisasi Semester
✓ BOS
✓ Piutang
✓ Rekonsiliasi
✓ Temuan & Tindak Lanjut
✓ Dashboard
```

---

# 31. SDD Handoff

BRD ini menjadi input untuk pembuatan Software Design Document (SDD).

SDD selanjutnya harus menerjemahkan requirement menjadi:

1. System architecture.
2. Technology stack.
3. Database architecture.
4. ERD.
5. Entity definitions.
6. Database constraints.
7. Authentication architecture.
8. RBAC implementation.
9. API specification.
10. Request/response schemas.
11. Frontend page structure.
12. Form specifications.
13. Validation rules.
14. Calculation/service logic.
15. Dashboard query architecture.
16. Audit metadata implementation.
17. Error handling.
18. Security controls.
19. Testing strategy.
20. Deployment architecture.

SDD tidak boleh menghilangkan business requirement yang telah didefinisikan dalam BRD.

Apabila SDD membutuhkan keputusan bisnis yang belum tersedia, keputusan tersebut harus dimasukkan kembali ke daftar Open Business Decisions sebelum implementasi final.

---

# 32. Guiding Principle

Prinsip utama aplikasi:

> **Cabang mengisi data. Sistem menghitung dan menyimpan data. Pusat memonitor data.**

Aplikasi tidak dibuat sebagai replika Excel.

Excel digunakan sebagai **sumber kebutuhan dan referensi proses bisnis**, sedangkan aplikasi harus menggunakan model data relasional dan workflow yang lebih terstruktur.

Tujuan akhirnya adalah:

```text
INPUT CABANG
     ↓
DATA TERSTRUKTUR
     ↓
PERHITUNGAN OTOMATIS
     ↓
MONITORING TERPUSAT
     ↓
INFORMASI YANG MUDAH DITINDAKLANJUTI
```
