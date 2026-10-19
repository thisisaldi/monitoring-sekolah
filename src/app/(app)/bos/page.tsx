import type { Metadata } from "next";

import { CreateButton, EditLink } from "@/components/app/create-button";
import { EmptyState, PageHeader, Pagination, Panel, StatusBadge } from "@/components/app/ui";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { bosRecords } from "@/db/schema";
import { isBranch } from "@/lib/auth/authz";
import { requireUser } from "@/lib/auth/guards";
import { bosEndingBalance } from "@/lib/calc";
import { rupiah } from "@/lib/format";
import { pageNumber } from "@/lib/forms";
import { listAnnual } from "@/server/annual";

export const metadata: Metadata = { title: "BOS" };

export default async function BosListPage({ searchParams }: PageProps<"/bos">) {
  const user = await requireUser();
  const data = await listAnnual("bos", user, pageNumber((await searchParams).page));
  return (
    <>
      <PageHeader
        title="BOS"
        description="Saldo dana BOS per tahun anggaran. Saldo akhir = saldo awal + penerimaan - penggunaan."
        actions={isBranch(user) && <CreateButton href="/bos/new" label="Tambah Data BOS" />}
      />
      <Panel>
        {data.rows.length === 0 ? (
          <EmptyState title="Belum ada data BOS" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Sekolah</TableHead>
                <TableHead>Tahun Anggaran</TableHead>
                <TableHead className="text-right">Saldo Awal</TableHead>
                <TableHead className="text-right">Penerimaan</TableHead>
                <TableHead className="text-right">Penggunaan</TableHead>
                <TableHead className="text-right">Saldo Akhir</TableHead>
                <TableHead>Laporan</TableHead>
                <TableHead className="pr-5" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.rows.map(({ record, schoolName, budgetYearName }) => {
                const r = record as typeof bosRecords.$inferSelect;
                return (
                  <TableRow key={r.id}>
                    <TableCell className="pl-5 font-medium">{schoolName}</TableCell>
                    <TableCell className="text-muted-foreground">{budgetYearName}</TableCell>
                    <TableCell className="num text-right">{rupiah(r.openingBalance)}</TableCell>
                    <TableCell className="num text-right">{rupiah(r.receiptAmount)}</TableCell>
                    <TableCell className="num text-right">{rupiah(r.usageAmount)}</TableCell>
                    <TableCell className="num text-right font-semibold">
                      {rupiah(bosEndingBalance(r.openingBalance, r.receiptAmount, r.usageAmount))}
                    </TableCell>
                    <TableCell>
                      {r.reportStatus === "COMPLETE" ? (
                        <StatusBadge tone="success">Lengkap</StatusBadge>
                      ) : (
                        <StatusBadge tone="warning">Belum Lengkap</StatusBadge>
                      )}
                    </TableCell>
                    <TableCell className="pr-5 text-right">{isBranch(user) && <EditLink href={`/bos/${r.id}/edit`} />}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
        <Pagination {...data} basePath="/bos" />
      </Panel>
    </>
  );
}
