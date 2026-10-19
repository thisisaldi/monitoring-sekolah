import { InfoIcon } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";

import { FilterSelect } from "@/components/app/filter-select";
import { EmptyState, Metric, PageHeader, Pagination, Panel, StatusBadge } from "@/components/app/ui";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireUser } from "@/lib/auth/guards";
import { rupiah } from "@/lib/format";
import { idParam, pageNumber } from "@/lib/forms";
import { getDashboard } from "@/server/dashboard";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  const user = await requireUser();
  const q = await searchParams;
  const d = await getDashboard(
    user,
    { budgetYearId: idParam(q.budget_year), branchId: idParam(q.branch), schoolId: idParam(q.school) },
    pageNumber(q.page),
  );
  const m = d.metrics;
  const scopeLabel = d.isCentral
    ? d.branchId
      ? d.branchList.find((b) => b.id === d.branchId)?.name
      : "Semua cabang"
    : user.branchName;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`${scopeLabel ?? ""}${d.year ? `, tahun anggaran ${d.year.name}` : ""}`}
      />

      <div className="mb-6 flex flex-wrap items-end gap-3">
        <FilterSelect
          name="budget_year"
          label="Tahun Anggaran"
          value={d.year ? String(d.year.id) : ""}
          options={d.years.map((y) => ({ value: String(y.id), label: y.name }))}
        />
        {d.isCentral && (
          <FilterSelect
            name="branch"
            label="Cabang"
            allLabel="Semua cabang"
            value={d.branchId ? String(d.branchId) : ""}
            options={d.branchList.map((b) => ({ value: String(b.id), label: b.name }))}
          />
        )}
        <FilterSelect
          name="school"
          label="Sekolah"
          allLabel="Semua sekolah"
          value={d.schoolId ? String(d.schoolId) : ""}
          options={d.schoolOptions.map((s) => ({ value: String(s.id), label: s.name }))}
        />
      </div>

      <Panel className="mb-6 grid grid-cols-2 gap-px overflow-hidden bg-border lg:grid-cols-5 [&>*:last-child]:col-span-2 lg:[&>*:last-child]:col-span-1">
        <Metric label="Total Sekolah" value={m.totalSchools} />
        <Metric label={d.isCentral ? "Total Cabang" : "Cabang"} value={m.totalBranches} />
        <Metric label="Laporan Bulanan Belum Lengkap" value="-" hint="Definisi belum ditetapkan (OBD-DM-006)" />
        <Metric
          label="Rekonsiliasi Bermasalah"
          value={m.reconciliationProblemCount ?? "-"}
          tone={m.reconciliationProblemCount ? "danger" : undefined}
        />
        <Metric label="Temuan Terbuka" value={m.openFindingsCount} tone={m.openFindingsCount ? "warning" : undefined} />
      </Panel>

      <Panel>
        <div className="flex items-center justify-between gap-4 px-5 py-4">
          <h2 className="font-semibold">Monitoring per Sekolah</h2>
          {!d.year && <p className="text-sm text-muted-foreground">Belum ada tahun anggaran.</p>}
        </div>
        {d.paged.rows.length === 0 ? (
          <EmptyState title="Tidak ada sekolah yang cocok dengan filter ini." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Sekolah</TableHead>
                {d.isCentral && <TableHead>Cabang</TableHead>}
                <TableHead className="text-right">RKAS Terakhir</TableHead>
                <TableHead>Rekonsiliasi</TableHead>
                <TableHead className="pr-5 text-right">Temuan Terbuka</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {d.paged.rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="pl-5 font-medium">{r.name}</TableCell>
                  {d.isCentral && <TableCell className="text-muted-foreground">{r.branchName}</TableCell>}
                  <TableCell className="num text-right">
                    {r.rkasId ? (
                      <Link href={`/rkas/${r.rkasId}`} className="text-primary hover:underline">
                        {rupiah(r.rkasCurrentAmount)}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {r.reconciliation ? (
                      r.reconciliation.status === "SESUAI" ? (
                        <StatusBadge tone="success">Sesuai</StatusBadge>
                      ) : (
                        <StatusBadge tone="danger">Tidak Sesuai</StatusBadge>
                      )
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="num pr-5 text-right">
                    {r.openFindingsCount ? (
                      <Link href="/temuan" className="text-primary hover:underline">
                        {r.openFindingsCount}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <Pagination
          {...d.paged}
          basePath="/dashboard"
          params={{ budget_year: q.budget_year as string, branch: q.branch as string, school: q.school as string }}
        />
      </Panel>

      <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
        <InfoIcon className="mt-0.5 size-3.5 shrink-0" />
        Status risiko (Hijau/Kuning/Oranye/Merah) belum ditampilkan karena formula skoringnya belum ditetapkan (OBD-DM-005).
      </p>
    </>
  );
}
