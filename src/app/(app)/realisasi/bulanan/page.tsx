import type { Metadata } from "next";

import { CreateButton, EditLink } from "@/components/app/create-button";
import { EmptyState, PageHeader, Pagination, Panel, StatusBadge } from "@/components/app/ui";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { isBranch } from "@/lib/auth/authz";
import { requireUser } from "@/lib/auth/guards";
import { monthlyVariance } from "@/lib/calc";
import { MONTH_NAMES, percent, rupiah } from "@/lib/format";
import { pageNumber } from "@/lib/forms";
import { cn } from "@/lib/utils";
import { listMonthly } from "@/server/realizations";

export const metadata: Metadata = { title: "Realisasi Bulanan" };

export default async function MonthlyListPage({ searchParams }: PageProps<"/realisasi/bulanan">) {
  const user = await requireUser();
  const data = await listMonthly(user, pageNumber((await searchParams).page));
  return (
    <>
      <PageHeader
        title="Realisasi Bulanan"
        description="Anggaran dan realisasi per bulan, diurutkan mengikuti tahun ajaran (Juli sampai Juni)."
        actions={isBranch(user) && <CreateButton href="/realisasi/bulanan/new" label="Tambah Realisasi" />}
      />
      <Panel>
        {data.rows.length === 0 ? (
          <EmptyState title="Belum ada data realisasi bulanan" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Sekolah</TableHead>
                <TableHead>Tahun Anggaran</TableHead>
                <TableHead>Bulan</TableHead>
                <TableHead className="text-right">Anggaran</TableHead>
                <TableHead className="text-right">Realisasi</TableHead>
                <TableHead className="text-right">Selisih</TableHead>
                <TableHead className="text-right">%</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-5" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.rows.map(({ record: r, schoolName, budgetYearName }) => {
                const v = monthlyVariance(r.budgetAmount, r.realizationAmount);
                return (
                  <TableRow key={r.id}>
                    <TableCell className="pl-5 font-medium">{schoolName}</TableCell>
                    <TableCell className="text-muted-foreground">{budgetYearName}</TableCell>
                    <TableCell>{MONTH_NAMES[r.month]}</TableCell>
                    <TableCell className="num text-right">{rupiah(r.budgetAmount)}</TableCell>
                    <TableCell className="num text-right">{rupiah(r.realizationAmount)}</TableCell>
                    <TableCell className={cn("num text-right", v.variance < 0n && "text-destructive")}>{rupiah(v.variance)}</TableCell>
                    <TableCell className="num text-right">{percent(v.percentage)}</TableCell>
                    <TableCell>
                      {r.reportStatus === "COMPLETE" ? (
                        <StatusBadge tone="success">Lengkap</StatusBadge>
                      ) : (
                        <StatusBadge tone="warning">Belum Lengkap</StatusBadge>
                      )}
                    </TableCell>
                    <TableCell className="pr-5 text-right">
                      {/* Rows are already scoped to the user's branch; CENTRAL is read-only. */}
                      {isBranch(user) && <EditLink href={`/realisasi/bulanan/${r.id}/edit`} />}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
        <Pagination {...data} basePath="/realisasi/bulanan" />
      </Panel>
    </>
  );
}
