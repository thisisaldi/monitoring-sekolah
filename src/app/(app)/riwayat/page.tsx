import type { Metadata } from "next";

import { FilterSelect } from "@/components/app/filter-select";
import { EmptyState, PageHeader, Pagination, Panel, StatusBadge } from "@/components/app/ui";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireCentral } from "@/lib/auth/guards";
import { MONTH_NAMES, rupiah } from "@/lib/format";
import { pageNumber } from "@/lib/forms";
import { listAudit } from "@/server/audit";

export const metadata: Metadata = { title: "Riwayat Aktivitas" };

const ENTITY_LABEL: Record<string, string> = {
  rkas: "RKAS",
  rkas_revision: "Revisi RKAS",
  monthly_realization: "Realisasi Bulanan",
  semester_realization: "Realisasi Semester",
  bos: "BOS",
  receivables: "Piutang",
  reconciliation: "Rekonsiliasi",
  finding: "Temuan",
  school: "Sekolah",
  budget_year: "Tahun Anggaran",
  branch: "Cabang",
  user: "Pengguna",
};

const ACTION = {
  CREATE: { label: "Tambah", tone: "success" },
  UPDATE: { label: "Ubah", tone: "info" },
  ACTIVATE: { label: "Aktifkan", tone: "success" },
  DEACTIVATE: { label: "Nonaktifkan", tone: "danger" },
  PASSWORD: { label: "Ganti Password", tone: "warning" },
  LOGIN: { label: "Masuk", tone: "neutral" },
} as const;

const FIELD_LABEL: Record<string, string> = {
  schoolId: "Sekolah", budgetYearId: "Tahun anggaran", branchId: "Cabang", month: "Bulan", semester: "Semester",
  initialAmount: "RKAS awal", initialApprovalDate: "Tanggal pengesahan", majorChangeDescription: "Perubahan utama",
  amount: "Jumlah", revisionDate: "Tanggal revisi", changeDescription: "Keterangan", revisionNumber: "Nomor revisi",
  budgetAmount: "Anggaran", realizationAmount: "Realisasi", varianceExplanation: "Penjelasan selisih",
  reportStatus: "Status laporan", evaluationNote: "Catatan evaluasi", openingBalance: "Saldo awal",
  receiptAmount: "Penerimaan", usageAmount: "Penggunaan", rkasCompliance: "Sesuai RKAS", notes: "Catatan",
  additionAmount: "Penambahan", settlementAmount: "Pelunasan", dominantAge: "Umur dominan", followUp: "Tindak lanjut",
  financialStatementBalance: "Saldo laporan", bankBalance: "Saldo bank", findingDate: "Tanggal temuan",
  source: "Sumber", finding: "Temuan", risk: "Risiko", recommendation: "Rekomendasi", pic: "PIC", deadline: "Batas waktu",
  status: "Status", completedDate: "Tanggal selesai", code: "Kode", name: "Nama", type: "Jenis", isActive: "Aktif",
  educationLevel: "Jenjang", principalName: "Kepala sekolah", treasurerName: "Bendahara", studentCount: "Jumlah siswa",
  note: "Catatan", startDate: "Mulai", endDate: "Selesai", username: "Username", role: "Peran",
};

function show(field: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "kosong";
  if (typeof value === "boolean") return value ? "Ya" : "Tidak";
  if (field === "month") return MONTH_NAMES[Number(value)] ?? String(value);
  if (typeof value === "string" && /^-?\d+\.\d{2}$/.test(value)) return rupiah(value);
  return String(value);
}

const timeFmt = new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "medium", timeStyle: "short" });

export default async function AuditPage({ searchParams }: PageProps<"/riwayat">) {
  const user = await requireCentral();
  const q = await searchParams;
  const filters = { entity: typeof q.modul === "string" ? q.modul : "", action: typeof q.aksi === "string" ? q.aksi : "" };
  const data = await listAudit(user, pageNumber(q.page), filters);
  return (
    <>
      <PageHeader title="Riwayat Aktivitas" description="Semua perubahan data dan login, terbaru di atas. Hanya Admin dan Pusat yang dapat melihat halaman ini." />
      <Panel>
        <div className="flex flex-wrap items-end gap-3 border-b p-3">
          <FilterSelect
            name="modul"
            label="Modul"
            allLabel="Semua modul"
            value={filters.entity}
            options={Object.entries(ENTITY_LABEL).map(([value, label]) => ({ value, label }))}
          />
          <FilterSelect
            name="aksi"
            label="Aksi"
            allLabel="Semua aksi"
            value={filters.action}
            options={Object.entries(ACTION).map(([value, a]) => ({ value, label: a.label }))}
          />
        </div>
        {data.rows.length === 0 ? (
          <EmptyState title="Belum ada aktivitas yang cocok." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Waktu</TableHead>
                <TableHead>Pengguna</TableHead>
                <TableHead>Aksi</TableHead>
                <TableHead>Modul</TableHead>
                <TableHead className="pr-5">Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.rows.map(({ log, userName, username }) => {
                const action = ACTION[log.action];
                const changes = Object.entries(log.changes ?? {});
                return (
                  <TableRow key={log.id} className="align-top">
                    <TableCell className="num pl-5 whitespace-nowrap text-muted-foreground">{timeFmt.format(log.createdAt)}</TableCell>
                    <TableCell>
                      <p className="font-medium">{userName}</p>
                      <p className="font-mono text-xs text-muted-foreground">{username}</p>
                    </TableCell>
                    <TableCell>
                      <StatusBadge tone={action.tone}>{action.label}</StatusBadge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{ENTITY_LABEL[log.entity] ?? log.entity}</TableCell>
                    <TableCell className="max-w-xl pr-5 whitespace-normal">
                      <p>{log.label}</p>
                      {changes.length > 0 && (
                        <details className="mt-1 text-sm">
                          <summary className="cursor-pointer text-primary">
                            {log.action === "CREATE" ? "Isi data" : `${changes.length} perubahan`}
                          </summary>
                          <dl className="mt-2 grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1">
                            {changes.map(([field, [from, to]]) => (
                              <div key={field} className="contents">
                                <dt className="text-muted-foreground">{FIELD_LABEL[field] ?? field}</dt>
                                <dd className="num">
                                  {log.action === "CREATE" ? (
                                    show(field, to)
                                  ) : (
                                    <>
                                      <span className="text-muted-foreground line-through">{show(field, from)}</span>
                                      {" menjadi "}
                                      <span className="font-medium">{show(field, to)}</span>
                                    </>
                                  )}
                                </dd>
                              </div>
                            ))}
                          </dl>
                        </details>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
        <Pagination {...data} basePath="/riwayat" params={{ modul: filters.entity || undefined, aksi: filters.action || undefined }} />
      </Panel>
    </>
  );
}
