import type { Metadata } from "next";

import { CreateButton, EditLink } from "@/components/app/create-button";
import { EmptyState, PageHeader, Pagination, Panel, StatusBadge } from "@/components/app/ui";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { reconciliations } from "@/db/schema";
import { isBranch } from "@/lib/auth/authz";
import { requireUser } from "@/lib/auth/guards";
import { reconciliationResult } from "@/lib/calc";
import { rupiah } from "@/lib/format";
import { pageNumber } from "@/lib/forms";
import { cn } from "@/lib/utils";
import { listAnnual } from "@/server/annual";

export const metadata: Metadata = { title: "Rekonsiliasi" };

export default async function ReconciliationListPage({ searchParams }: PageProps<"/rekonsiliasi">) {
  const user = await requireUser();
  const data = await listAnnual("reconciliation", user, pageNumber((await searchParams).page));
  return (
    <>
      <PageHeader
        title="Rekonsiliasi"
        description="Saldo laporan keuangan dibandingkan saldo bank. Selisih 0 berarti Sesuai."
        actions={isBranch(user) && <CreateButton href="/rekonsiliasi/new" label="Tambah Rekonsiliasi" />}
      />
      <Panel>
        {data.rows.length === 0 ? (
          <EmptyState title="Belum ada data rekonsiliasi" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Sekolah</TableHead>
                <TableHead>Tahun Anggaran</TableHead>
                <TableHead className="text-right">Saldo Laporan</TableHead>
                <TableHead className="text-right">Saldo Bank</TableHead>
                <TableHead className="text-right">Selisih</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-5" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.rows.map(({ record, schoolName, budgetYearName }) => {
                const r = record as typeof reconciliations.$inferSelect;
                const result = reconciliationResult(r.financialStatementBalance, r.bankBalance);
                return (
                  <TableRow key={r.id}>
                    <TableCell className="pl-5 font-medium">{schoolName}</TableCell>
                    <TableCell className="text-muted-foreground">{budgetYearName}</TableCell>
                    <TableCell className="num text-right">{rupiah(r.financialStatementBalance)}</TableCell>
                    <TableCell className="num text-right">{rupiah(r.bankBalance)}</TableCell>
                    <TableCell className={cn("num text-right", result.difference !== 0n && "font-semibold text-destructive")}>
                      {rupiah(result.difference)}
                    </TableCell>
                    <TableCell>
                      {result.status === "SESUAI" ? (
                        <StatusBadge tone="success">Sesuai</StatusBadge>
                      ) : (
                        <StatusBadge tone="danger">Tidak Sesuai</StatusBadge>
                      )}
                    </TableCell>
                    <TableCell className="pr-5 text-right">
                      {isBranch(user) && <EditLink href={`/rekonsiliasi/${r.id}/edit`} />}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
        <Pagination {...data} basePath="/rekonsiliasi" />
      </Panel>
    </>
  );
}
