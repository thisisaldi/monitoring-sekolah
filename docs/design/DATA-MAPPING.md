# DATA-MAPPING.md

Version: 1.2
Status: Development Baseline
Source: Workbook Monitoring Keuangan Sekolah
Scope: Dashboard + 8 operational sheets

---

# 1. Purpose

Dokumen ini mendefinisikan bagaimana struktur workbook monitoring
keuangan sekolah diterjemahkan menjadi struktur sistem web.

Dokumen ini berfungsi sebagai jembatan antara:

- workbook sumber;
- BRD;
- OBD;
- ERD;
- SDD;
- DATABASE-SCHEMA;
- implementation.

Tujuan utama:

1. Mengidentifikasi data yang berasal dari workbook.
2. Memisahkan data input dari data hasil perhitungan.
3. Mendefinisikan hubungan antar entity.
4. Menentukan ownership dan scope data.
5. Menentukan data yang dapat langsung diimplementasikan.
6. Menandai requirement yang belum ditentukan stakeholder.
7. Mencegah developer atau AI mengarang business rule.

Dokumen ini tidak menggantikan:

- BRD
- OBD
- ERD
- SDD
- DATABASE-SCHEMA

Jika terdapat konflik, gunakan hierarchy pada Section 2.

---

# 2. Requirement Authority

Jika terdapat perbedaan antara dokumen, gunakan hierarchy berikut:

1. Confirmed stakeholder decisions / OBD yang berstatus DECIDED
2. DATABASE-SCHEMA.md untuk database structure dan constraints
3. ERD.md untuk entity dan relationship
4. SDD.md untuk system architecture dan technical design
5. DATA-MAPPING.md untuk mapping workbook → system
6. UI-DESIGN-SPEC.md untuk presentation/UI

## Important Rule

DATA-MAPPING.md tidak boleh membuka kembali business decision yang
sudah berstatus DECIDED pada OBD.

Jika sebuah OBD telah berstatus DECIDED, mapping harus mengikuti
keputusan tersebut.

Jika requirement belum diputuskan stakeholder, DATA-MAPPING.md harus
menandainya sebagai TBD/Open.

Developer dan AI tidak boleh mengubah asumsi menjadi business rule.

---

# 3. Source Workbook

Workbook terdiri dari:

1. Dashboard
2. Master Sekolah
3. RKAS
4. Realisasi Bulanan
5. Realisasi Semester
6. BOS
7. Piutang
8. Rekonsiliasi
9. Temuan & Tindak Lanjut

Dashboard merupakan layer monitoring.

Delapan sheet lainnya merupakan sumber data operasional.

Workbook adalah representasi proses kerja saat ini.

Struktur workbook tidak harus diterjemahkan 1:1 menjadi database.

Kolom yang digunakan untuk presentation, aggregation, atau calculation
tidak otomatis menjadi database field.

---

# 4. Requirement Classification

Setiap requirement diklasifikasikan menjadi:

## 4.1 Confirmed

Requirement sudah diketahui dan dapat diimplementasikan.

Contoh:

- Branch memiliki banyak School.
- Operational data menggunakan school_id.
- Financial data menggunakan budget_year_id.
- Calculated values tidak menjadi input manual.
- Branch user hanya dapat mengakses branch sendiri.
- Central user dapat melakukan monitoring seluruh branch.
- Reconciliation status memiliki rule yang sudah diputuskan.
- Finding status memiliki rule yang sudah diputuskan.
- BOS RKAS compliance menggunakan BOOLEAN.

## 4.2 TBD / Open

Requirement belum ditentukan stakeholder.

Developer dan AI:

- tidak boleh mengarang business rule;
- tidak boleh membuat workflow berdasarkan asumsi;
- tidak boleh menetapkan formula yang belum disepakati;
- harus membuat desain yang dapat dikembangkan kemudian.

## 4.3 Deferred

Requirement sengaja ditunda karena belum diperlukan atau belum masuk
scope implementasi saat ini.

---

# 5. Data Ownership

## 5.1 Branch User

Branch User:

- dapat login;
- dapat mengisi data operasional;
- dapat mengubah data operasional milik branch;
- dapat melihat data dalam scope branch sendiri.

Branch User tidak dapat:

- melihat data branch lain;
- membuat branch;
- mengubah branch;
- menghapus branch;
- membuat school melalui operational workflow;
- menghapus school melalui operational workflow;
- mengubah Budget Year.

## 5.2 Central User

Central User:

- dapat login;
- dapat melihat seluruh branch;
- dapat melihat seluruh school;
- dapat melihat seluruh operational data;
- dapat melakukan monitoring.

Central User tidak menginput operational financial data dalam
workflow normal.

Central User bersifat read-only terhadap operational financial records.

---

# 6. Scope Hierarchy

Struktur organisasi:

    Branch
      ↓
    School
      ↓
    Operational Records

Struktur periode:

    Budget Year
      ↓
    Operational Records

Dengan demikian operational record umumnya memiliki:

    school_id
    budget_year_id

Branch diperoleh melalui:

    Operational Record
      ↓
    School
      ↓
    Branch

Tidak menggunakan nama branch atau nama school sebagai foreign key.

---

# 7. Sheet: Master Sekolah

## 7.1 Purpose

Menyimpan master data sekolah.

## 7.2 Workbook Fields

- Daerah / Perwakilan
- Nama Sekolah
- Jenjang
- Kepala Sekolah
- Bendahara
- Jumlah Siswa
- Status Risiko
- Catatan

## 7.3 Database Entity

School

## 7.4 Field Mapping

| Workbook | Database |
|---|---|
| Daerah / Perwakilan | Branch relationship |
| Nama Sekolah | School.name |
| Jenjang | School.education_level |
| Kepala Sekolah | School.principal_name |
| Bendahara | School.treasurer_name |
| Jumlah Siswa | School.student_count |
| Catatan | School.note |

## 7.5 Input Fields

- education_level
- principal_name
- treasurer_name
- student_count
- note

## 7.6 Branch Relationship

School belongs to exactly one Branch, and each Branch operates exactly one School.

    Branch 1:1 School

School contains:

    branch_id

Daerah / Perwakilan tidak disimpan sebagai text berulang.

## 7.7 Status Risiko

Workbook menampilkan:

- Hijau
- Kuning
- Oranye
- Merah

Namun Status Risiko bukan field Master Sekolah.

Status Risiko merupakan Dashboard indicator.

Tidak ada `risk_status` field pada School.

Aturan pembentukan indikator belum ditentukan.

Lihat:

    OBD-DM-005

---

# 8. Sheet: RKAS

## 8.1 Purpose

Menyimpan RKAS dan riwayat perubahan/revisi RKAS.

## 8.2 Workbook Fields

- RKAS Awal
- Tanggal Pengesahan
- Revisi 1
- Tanggal Revisi 1
- Revisi 2
- Tanggal Revisi 2
- Nilai RKAS Terakhir
- Perubahan Utama
- Status Review

## 8.3 Database Entities

### RKAS

Conceptual fields:

- id
- school_id
- budget_year_id
- initial_amount
- approved_at
- review_status
- created_at
- updated_at

### RKAS Revision

Conceptual fields:

- id
- rkas_id
- revision_number
- amount
- revision_date
- change_description
- created_at
- updated_at

## 8.4 Revision Design

Workbook saat ini memiliki:

- RKAS Awal
- Revisi 1
- Revisi 2

Namun jumlah revisi bersifat tentative dan dapat berubah berdasarkan
permintaan stakeholder.

Jumlah revisi tidak boleh dikunci pada dua revisi.

Conceptual structure:

    RKAS
      ├── Initial
      ├── Revision 1
      ├── Revision 2
      └── Revision N

Dengan demikian perubahan jumlah revisi tidak membutuhkan perubahan
schema.

## 8.5 Calculated Value

Nilai RKAS terakhir diperoleh dari:

- initial amount jika belum terdapat revision;
- amount dari revision terbaru jika revision tersedia.

`latest_amount` tidak boleh menjadi source of truth yang dapat diubah
secara independen oleh user.

## 8.6 Status Review

Workbook memiliki field:

    Status Review

Daftar status dan workflow Review RKAS belum ditentukan stakeholder.

Status:

    TBD

Developer tidak boleh mengarang:

- Draft
- Review
- Approved
- Rejected
- Returned
- atau status lainnya.

Tidak ada approval workflow yang boleh dibuat tanpa keputusan
stakeholder.

Lihat:

    OBD-DM-003

---

# 9. Sheet: Realisasi Bulanan

## 9.1 Purpose

Monitoring realisasi keuangan per bulan terhadap RKAS.

## 9.2 Workbook Fields

- Bulan
- Anggaran RKAS Bulanan
- Realisasi
- Selisih
- Persentase Realisasi
- Penjelasan Selisih
- Status Laporan

## 9.3 Database Entity

MonthlyRealization

## 9.4 Conceptual Fields

- id
- school_id
- budget_year_id
- month
- budget_amount
- realization_amount
- explanation
- report_status
- created_at
- updated_at

## 9.5 Input Fields

- month
- budget_amount
- realization_amount
- explanation
- report_status

## 9.6 Calculated Fields

### Variance

    variance =
    budget_amount - realization_amount

### Realization Percentage

    realization_percentage =
    realization_amount / budget_amount × 100

## 9.7 Zero Budget Case

Jika:

    budget_amount = 0

maka:

    realization_amount / budget_amount

tidak terdefinisi.

System harus mencegah division-by-zero.

Business interpretation untuk kondisi tersebut belum ditentukan.

Status:

    TBD

Tidak boleh mengartikan zero budget sebagai 0% secara otomatis.

---

# 10. Monthly Report Status

Workbook memiliki:

    Status Laporan

Daftar status resmi harus mengikuti keputusan stakeholder atau
dokumentasi authoritative yang sudah tersedia.

Jika belum terdapat keputusan resmi, status behavior tidak boleh
diperluas dengan workflow baru.

Status completeness Dashboard dibahas terpisah pada:

    OBD-DM-006

---

# 11. Month Ordering

School year menggunakan urutan:

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

Underlying month value tetap menggunakan representasi yang konsisten
dengan database schema.

Urutan tersebut merupakan presentation ordering.

---

# 12. Sheet: Realisasi Semester

## 12.1 Purpose

Monitoring realisasi berdasarkan semester.

## 12.2 Workbook Fields

- RKAS Terakhir
- Realisasi Semester 1
- Persentase Semester 1
- Realisasi Semester 2
- Total Realisasi
- Persentase Akhir
- Sisa Anggaran
- Catatan Evaluasi

## 12.3 Database Entity

SemesterRealization

## 12.4 Conceptual Fields

- id
- school_id
- budget_year_id
- semester
- amount
- evaluation_note
- created_at
- updated_at

Implementasi mengikuti DATABASE-SCHEMA.md yang authoritative untuk
representasi semester.

## 12.5 Input Fields

- semester
- amount
- evaluation_note

## 12.6 Calculated Fields

### Total Realization

    total_realization =
    semester_1_amount + semester_2_amount

### Semester 1 Percentage

    semester_1_percentage =
    semester_1_amount / latest_rkas × 100

### Final Percentage

    final_percentage =
    total_realization / latest_rkas × 100

### Remaining Budget

    remaining_budget =
    latest_rkas - total_realization

Calculated values tidak boleh menjadi input manual.

## 12.7 Semester Definition

Workbook memiliki:

- Semester 1
- Semester 2

Expected school-year interpretation:

    Semester 1 = Juli–Desember
    Semester 2 = Januari–Juni

Namun definisi periode tersebut belum dikonfirmasi secara eksplisit
oleh stakeholder.

Status:

    TBD

Implementation harus mudah disesuaikan jika stakeholder memberikan
definisi berbeda.

---

# 13. Sheet: BOS

## 13.1 Purpose

Monitoring dana BOS.

## 13.2 Workbook Fields

- Saldo Awal BOS
- Penerimaan BOS
- Penggunaan BOS
- Saldo Akhir BOS
- Sesuai RKAS
- Status Laporan
- Catatan / Temuan

## 13.3 Database Entity

BOS

## 13.4 Conceptual Fields

- id
- school_id
- budget_year_id
- opening_balance
- receipt_amount
- usage_amount
- rkas_compliance
- report_status
- note
- created_at
- updated_at

Exact database column names follow:

    DATABASE-SCHEMA.md

## 13.5 Input Fields

- opening_balance
- receipt_amount
- usage_amount
- rkas_compliance
- report_status
- note

## 13.6 Calculated Field

    ending_balance =
    opening_balance + receipt_amount - usage_amount

Saldo Akhir tidak boleh menjadi input manual.

---

# 14. BOS RKAS Compliance

## Status

DECIDED

Field:

    rkas_compliance

menggunakan BOOLEAN.

Nilai:

    TRUE
        → Sesuai RKAS

    FALSE
        → Tidak Sesuai RKAS

Tidak ada status tambahan seperti:

- Pending
- Review
- Unknown
- Partial

Tidak ada approval workflow tambahan.

Database type dan constraint mengikuti:

    DATABASE-SCHEMA.md
    OBD yang sudah DECIDED

---

# 15. Sheet: Piutang

## 15.1 Purpose

Monitoring piutang sekolah.

## 15.2 Workbook Fields

- Piutang Awal
- Penambahan
- Pelunasan
- Piutang Akhir
- Persentase Tunggakan
- Umur Piutang Dominan
- Tindak Lanjut

## 15.3 Database Entity

Receivable

## 15.4 Conceptual Fields

- id
- school_id
- budget_year_id
- opening_balance
- additions
- settlements
- dominant_age
- follow_up
- created_at
- updated_at

Exact database column names follow:

    DATABASE-SCHEMA.md

## 15.5 Input Fields

- opening_balance
- additions
- settlements
- dominant_age
- follow_up

## 15.6 Calculated Field

    ending_balance =
    opening_balance + additions - settlements

---

# 16. Overdue Percentage

Workbook memiliki:

    Persentase Tunggakan

Namun belum terdapat formula bisnis resmi.

Status:

    TBD

System tidak boleh mengarang formula.

Jangan membuat:

- percentage formula;
- threshold;
- risk classification;

berdasarkan asumsi developer.

Lihat:

    OBD-DM-002

---

# 17. Receivable Dominant Age

Workbook memiliki:

    Umur Piutang Dominan

Belum diketahui apakah nilai tersebut:

- manual;
- calculated;
- berasal dari detail receivable;
- berasal dari sumber eksternal.

Status:

    TBD

Tidak boleh membuat calculation engine atau aging engine tanpa
requirement stakeholder.

Lihat:

    OBD-DM-009

---

# 18. Sheet: Rekonsiliasi

## 18.1 Purpose

Monitoring kesesuaian saldo laporan keuangan dengan saldo bank.

## 18.2 Workbook Fields

- Saldo Menurut Laporan Keuangan
- Saldo Bank
- Selisih Bank-Laporan
- Status Rekonsiliasi
- Kesesuaian RKAS
- Catatan
- Tindak Lanjut

## 18.3 Database Entity

Reconciliation

## 18.4 Conceptual Fields

- id
- school_id
- budget_year_id
- financial_statement_balance
- bank_balance
- rkas_compliance
- note
- follow_up
- created_at
- updated_at

Status mengikuti implementation/schema apabila merupakan calculated
property.

## 18.5 Input Fields

- financial_statement_balance
- bank_balance
- rkas_compliance
- note
- follow_up

Calculated fields tidak menjadi input.

## 18.6 Calculated Difference

    difference =
    bank_balance - financial_statement_balance

Difference tidak boleh menjadi input manual.

---

# 19. Reconciliation Status

## Status

DECIDED

Status Rekonsiliasi diturunkan dari `difference`.

Formula:

    difference =
    bank_balance - financial_statement_balance

Status:

    difference = 0
        → SESUAI

    difference != 0
        → TIDAK_SESUAI

Tidak ada tolerance.

Tidak ada status tambahan.

Status bukan input manual.

Status harus dihitung oleh system berdasarkan difference.

Tidak boleh terdapat dua independent sources of truth antara:

- difference
- reconciliation status

---

# 20. Sheet: Temuan & Tindak Lanjut

## 20.1 Purpose

Mencatat temuan dan tindak lanjut yang berkaitan dengan sekolah.

## 20.2 Workbook Fields

- Tanggal
- Daerah / Perwakilan
- Nama Sekolah
- Sumber Temuan
- Temuan
- Nilai
- Risiko
- Rekomendasi
- PIC
- Deadline
- Status
- Tanggal Selesai

## 20.3 Database Entity

Finding

## 20.4 Conceptual Fields

- id
- school_id
- finding_date
- source
- finding_description
- amount
- risk
- recommendation
- pic
- deadline
- status
- completed_date
- created_at
- updated_at

Exact database column names follow:

    DATABASE-SCHEMA.md

## 20.5 Relationship

    School 1:N Finding

Satu School dapat memiliki banyak Finding.

Daerah / Perwakilan tidak disimpan sebagai duplicate field.

Relationship:

    Finding
      ↓
    School
      ↓
    Branch

---

# 21. Finding Risk

Workbook memiliki:

    Risiko

Daftar level risiko resmi belum ditentukan stakeholder.

Status:

    TBD

Jangan membuat choices seperti:

- LOW
- MEDIUM
- HIGH
- CRITICAL

tanpa keputusan stakeholder.

Lihat:

    OBD-DM-010

---

# 22. Finding Status

## Status

DECIDED

Finding memiliki tiga status:

    OPEN
    ON_PROGRESS
    COMPLETED

Definisi:

### OPEN

Temuan belum ditindaklanjuti.

### ON_PROGRESS

Tindak lanjut sedang berjalan.

### COMPLETED

Tindak lanjut telah selesai.

Jika:

    status = COMPLETED

maka:

    completed_date IS NOT NULL

Jika:

    status != COMPLETED

maka:

    completed_date IS NULL

Tidak ada status lain tanpa keputusan stakeholder.

Tidak ada workflow tambahan yang boleh dibuat tanpa keputusan baru.

---

# 23. Dashboard

## 23.1 Purpose

Dashboard merupakan layer monitoring.

Dashboard bukan source of truth.

Dashboard membaca data dari operational entities.

Sources:

- School
- RKAS
- MonthlyRealization
- SemesterRealization
- BOS
- Receivable
- Reconciliation
- Finding

---

# 24. Known Dashboard Indicators

Workbook menunjukkan indikator:

### School Monitoring

- Jumlah sekolah

### Risk Indicators

- Hijau
- Kuning
- Oranye
- Merah

### Monthly Report Monitoring

- Laporan Bulanan Belum Lengkap

### Reconciliation Monitoring

- Rekonsiliasi Bermasalah

### Findings Monitoring

- Temuan dan tindak lanjut

---

# 25. Dashboard Risk Indicator

## Status

TBD

Hijau, Kuning, Oranye, dan Merah bukan School fields.

Tidak ada `risk_status` yang disimpan sebagai source of truth pada
School.

Rule pembentukan Risk Indicator belum ditentukan.

Tidak boleh membuat:

- risk scoring;
- threshold;
- automatic severity;
- arbitrary color mapping;

tanpa keputusan stakeholder.

Lihat:

    OBD-DM-005

---

# 26. Monthly Report Completeness

Dashboard membutuhkan indikator:

    Laporan Bulanan Belum Lengkap

Namun definisi formal "lengkap" belum ditentukan.

Belum diputuskan apakah completeness berdasarkan:

- keberadaan record bulan;
- required fields;
- validation;
- report status;
- atau kombinasi beberapa kondisi.

Status:

    TBD

Developer tidak boleh mengubah satu interpretation menjadi business
rule tanpa keputusan stakeholder.

Lihat:

    OBD-DM-006

---

# 27. Input vs Calculated Fields

## 27.1 Principle

User hanya menginput data yang merupakan source data.

System menghitung nilai yang dapat diperoleh secara deterministik.

Pattern:

    User Input
        ↓
    Database
        ↓
    Calculation
        ↓
    Monitoring

## 27.2 Calculated Fields

Field berikut tidak boleh menjadi input manual:

- RKAS latest amount
- Monthly variance
- Monthly realization percentage
- Semester totals
- Semester percentages
- Remaining budget
- BOS ending balance
- Receivable ending balance
- Reconciliation difference
- Reconciliation status

## 27.3 TBD Calculations

Perhitungan berikut belum boleh dibuat:

- Persentase Tunggakan
- Risk Indicator
- Monthly completeness
- Dominant receivable age calculation
- status-derived calculations yang belum ditentukan

---

# 28. Relationship Summary

## 28.1 Branch

    Branch
      1:N
    School

## 28.2 RKAS

    School
      1:N
    RKAS

    RKAS
      1:N
    RKAS Revision

    Budget Year
      1:N
    RKAS

## 28.3 Monthly Realization

    School
      1:N
    Monthly Realization

    Budget Year
      1:N
    Monthly Realization

## 28.4 Semester Realization

    School
      1:N
    Semester Realization

    Budget Year
      1:N
    Semester Realization

## 28.5 BOS

    School
      1:N
    BOS

    Budget Year
      1:N
    BOS

## 28.6 Receivable

    School
      1:N
    Receivable

    Budget Year
      1:N
    Receivable

## 28.7 Reconciliation

    School
      1:N
    Reconciliation

    Budget Year
      1:N
    Reconciliation

## 28.8 Findings

    School
      1:N
    Finding

---

# 29. Branch Scoping

Operational records harus mengikuti branch authorization.

Branch scope diperoleh melalui School.

    Operational Record
        ↓
    school_id
        ↓
    School.branch_id
        ↓
    Branch

Branch User hanya dapat mengakses operational records apabila:

    record.school.branch_id == user.branch_id

Central User dapat mengakses seluruh branch.

Branch ID tidak perlu diduplikasi pada setiap operational table apabila
dapat diperoleh secara deterministik melalui School.

---

# 30. Budget Year Scoping

Budget Year merupakan global master data.

Budget Year tidak dimiliki oleh:

- Branch
- School

Contoh:

    TA 2025/2026
    TA 2026/2027
    TA 2027/2028

Operational records mereferensikan:

    budget_year_id

Budget Year tidak menggunakan:

    branch_id

atau:

    school_id

sebagai ownership relationship.

---

# 31. Data Normalization Principles

## Principle 1 — Foreign Keys

Gunakan:

    branch_id
    school_id
    budget_year_id

bukan:

    branch_name
    school_name
    budget_year_name

sebagai identifier.

## Principle 2 — Calculated Values

Calculated values tidak boleh menjadi input manual.

## Principle 3 — RKAS Revisions

Jangan membuat fixed columns:

    revision_1
    revision_2
    revision_3

Gunakan revision records yang dapat berkembang.

## Principle 4 — Dashboard

Dashboard merupakan aggregation/read layer.

Dashboard bukan source of truth.

## Principle 5 — Master Data

Master data dipisahkan dari operational records.

## Principle 6 — Historical Data

Historical records harus tetap dapat ditelusuri melalui:

- school_id
- branch relationship
- budget_year_id

## Principle 7 — No Invented Business Rules

Jika requirement belum diketahui:

    TBD

Bukan:

    Assumed Rule

Developer dan AI tidak boleh mengubah asumsi menjadi business rule.

---

# 32. Open Business Decisions

## OBD-DM-001 — RKAS Revision

### Status

DECIDED / TENTATIVE STRUCTURE

### Decision

Jumlah revisi RKAS tidak dikunci berdasarkan format workbook saat ini.

Workbook saat ini menampilkan:

- RKAS Awal
- Revisi 1
- Revisi 2

Namun jumlah revisi dapat berubah berdasarkan kebutuhan stakeholder.

Database harus mendukung jumlah revisi yang dapat berkembang tanpa
perubahan schema.

Expected conceptual structure:

    RKAS
      ├── Initial
      ├── Revision 1
      ├── Revision 2
      └── Revision N

---

## OBD-DM-002 — Persentase Tunggakan Piutang

### Status

OPEN

### Decision

Belum terdapat formula resmi untuk Persentase Tunggakan.

System tidak boleh mengarang formula.

Implementation ditunda sampai formula bisnis ditentukan.

---

## OBD-DM-003 — Status Review RKAS

### Status

OPEN

### Decision

Daftar status resmi dan workflow Review RKAS belum ditentukan.

System tidak boleh mengarang:

- Draft
- Review
- Approved
- Rejected
- Returned
- atau status lainnya.

Tidak ada approval workflow sampai stakeholder memberikan keputusan.

---

## OBD-DM-004 — Status Rekonsiliasi

### Status

DECIDED

### Decision

Status Rekonsiliasi diturunkan dari difference.

Formula:

    difference =
    bank_balance - financial_statement_balance

Status:

    difference = 0
        → SESUAI

    difference != 0
        → TIDAK_SESUAI

Tidak ada tolerance.

Status tidak menjadi input manual.

Tidak ada status tambahan.

---

## OBD-DM-005 — Dashboard Risk Indicator

### Status

OPEN

### Decision

Dashboard memiliki indikator:

- Hijau
- Kuning
- Oranye
- Merah

Namun rule pembentukan indikator belum ditentukan.

Indikator tidak disimpan sebagai School field.

Risk calculation ditunda sampai business rule ditentukan.

---

## OBD-DM-006 — Monthly Report Completeness

### Status

OPEN

### Decision

Dashboard membutuhkan indikator:

    Laporan Bulanan Belum Lengkap

Namun definisi formal "lengkap" belum ditentukan.

Belum ditentukan apakah completeness didasarkan pada:

- record existence;
- required fields;
- validation;
- report status;
- atau kombinasi.

Tidak boleh mengarang rule.

---

## OBD-DM-007 — Semester Period Definition

### Status

OPEN

### Decision

Workbook memiliki:

- Semester 1
- Semester 2

Interpretasi yang diharapkan:

    Semester 1 = Juli–Desember
    Semester 2 = Januari–Juni

Namun definisi tersebut belum dikonfirmasi secara eksplisit oleh
stakeholder.

System harus mengikuti definisi stakeholder apabila diberikan.

---

## OBD-DM-008 — BOS RKAS Compliance

### Status

DECIDED

### Decision

Field:

    rkas_compliance

menggunakan BOOLEAN.

Nilai:

    TRUE
        → Sesuai RKAS

    FALSE
        → Tidak Sesuai RKAS

Tidak ada status tambahan.

Tidak ada approval workflow.

Database type mengikuti DATABASE-SCHEMA.md.

---

## OBD-DM-009 — Receivable Dominant Age

### Status

OPEN

### Decision

Workbook memiliki:

    Umur Piutang Dominan

Belum diketahui apakah nilai tersebut:

- manual;
- calculated;
- berasal dari detail receivable;
- berasal dari sumber eksternal.

Jangan membuat calculation engine sebelum requirement tersedia.

---

## OBD-DM-010 — Finding Risk

### Status

OPEN

### Decision

Workbook memiliki:

    Risiko

Daftar level risiko resmi belum ditentukan.

Jangan membuat choices atau severity logic sendiri.

---

## OBD-DM-011 — Finding Status

### Status

DECIDED

### Decision

Finding memiliki tiga status:

    OPEN
    ON_PROGRESS
    COMPLETED

Definisi:

- OPEN → temuan belum ditindaklanjuti.
- ON_PROGRESS → tindak lanjut sedang berjalan.
- COMPLETED → tindak lanjut telah selesai.

Jika:

    status = COMPLETED

maka:

    completed_date IS NOT NULL

Jika:

    status != COMPLETED

maka:

    completed_date IS NULL

Tidak ada status lain tanpa keputusan stakeholder.

---

## OBD-DM-012 — Monthly Zero Budget

### Status

OPEN

### Decision

Belum diketahui apakah Anggaran RKAS Bulanan dapat bernilai zero.

Jika zero terjadi, division-by-zero harus dicegah.

Business presentation untuk persentase ketika denominator zero belum
ditentukan.

---

# 33. Implementation Rules for AI Development

AI development agent wajib mengikuti aturan berikut.

## Rule 1 — Do Not Invent

Jika DATA-MAPPING menyatakan:

    TBD
    Open

jangan membuat business rule sendiri.

## Rule 2 — Respect Decided OBD

Jika OBD berstatus:

    DECIDED

maka implementation harus mengikuti keputusan tersebut.

Jangan membuka kembali keputusan tersebut hanya karena workbook
memiliki representasi yang berbeda.

## Rule 3 — Do Not Expand Scope

Jangan mengimplementasikan:

- business workflow yang belum diminta;
- approval system yang belum didefinisikan;
- risk engine yang belum didefinisikan;
- notification system yang belum didefinisikan;
- audit workflow yang belum didefinisikan.

## Rule 4 — Prefer Extensible Design

Jika requirement dapat berubah, gunakan struktur yang dapat diperluas
tanpa schema redesign.

Contoh:

    RKAS Revision

gunakan child records, bukan fixed revision columns.

## Rule 5 — Calculations

Calculated values harus berasal dari source data yang tersimpan.

## Rule 6 — Server-Side Authorization

Branch scope harus selalu diverifikasi server-side.

Client-provided branch atau school identifier tidak boleh dipercaya
tanpa authorization check.

## Rule 7 — Database Integrity

Business-critical relational integrity harus ditegakkan melalui:

- Foreign Key
- NOT NULL
- UNIQUE
- CHECK constraint

apabila requirement sudah jelas.

## Rule 8 — Preserve Existing Architecture

Financial modules harus mengikuti architecture yang sudah ada:

- Django
- PostgreSQL
- modular application structure
- server-side authorization
- existing custom User model
- existing Branch relationship
- existing School model
- existing Budget Year design

Jangan mengganti architecture tanpa alasan dan approval.

---

# 34. Phase 4 Implementation Status

Phase 4 financial modules telah diimplementasikan dan diverifikasi.

Modules:

- RKAS
- RKAS Revision
- Realisasi Bulanan
- Realisasi Semester
- BOS
- Piutang
- Rekonsiliasi
- Temuan & Tindak Lanjut

Current verification:

    Full test suite: 256/256 passed

    manage.py check:
    No issues

    makemigrations --check:
    No changes detected

    PostgreSQL:
    Confirmed

Infrastructure:

    web
    db

No Phase 5 functionality is included in this section.

---

# 35. Phase 5 Readiness

Dashboard and Monitoring are the next major development phase.

Phase 5 may use all operational financial modules as data sources.

Known monitoring areas:

- school count;
- monthly report completeness;
- reconciliation problems;
- findings;
- risk indicators.

However the following remain unresolved:

    OBD-DM-005
    Dashboard Risk Indicator

    OBD-DM-006
    Monthly Report Completeness

These must not be turned into arbitrary business rules.

Phase 5 should implement confirmed monitoring functionality first and
keep unresolved indicators explicitly TBD.

---

# 36. Change Management

Jika stakeholder memberikan requirement baru:

    Stakeholder Decision
            ↓
    Update OBD
            ↓
    Update DATA-MAPPING
            ↓
    Update ERD
            ↓
    Update DATABASE-SCHEMA
            ↓
    Update SDD if necessary
            ↓
    Implementation
            ↓
    Tests

Jangan langsung mengubah implementation tanpa memperbarui design
documentation apabila perubahan memengaruhi data model atau business
rule.

Jika stakeholder mengubah keputusan yang sebelumnya DECIDED:

1. Update OBD terlebih dahulu.
2. Update affected design documents.
3. Assess impact terhadap database.
4. Assess impact terhadap existing data.
5. Create migration if necessary.
6. Update implementation.
7. Update tests.
8. Verify complete system.

---

# 37. Final Design Principle

Sistem harus mengikuti prinsip:

    Known Requirement
        ↓
    Explicit Design
        ↓
    Implementation

Bukan:

    Unknown Requirement
        ↓
    Developer Assumption
        ↓
    Permanent Business Rule

Requirement yang belum diketahui harus tetap fleksibel sampai
stakeholder memberikan keputusan.

Keputusan yang sudah DECIDED harus diperlakukan sebagai authoritative
business rule sampai stakeholder secara eksplisit membukanya kembali.