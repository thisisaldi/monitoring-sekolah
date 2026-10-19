import type { Metadata } from "next";

import { CreateButton, EditLink } from "@/components/app/create-button";
import { EmptyState, PageHeader, Pagination, Panel } from "@/components/app/ui";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { receivables } from "@/db/schema";
import { isBranch } from "@/lib/auth/authz";
import { requireUser } from "@/lib/auth/guards";
import { receivableEndingBalance } from "@/lib/calc";
import { rupiah } from "@/lib/format";
import { pageNumber } from "@/lib/forms";
import { listAnnual } from "@/server/annual";

export const metadata: Metadata = { title: "Piutang" };

export default async function ReceivableListPage({ searchParams }: PageProps<"/piutang">) {
  const user = await requireUser();
  const data = await listAnnual("receivables", user, pageNumber((await searchParams).page));
  return (
    <>
      <PageHeader
        title="Piutang"
        description="Piutang per tahun anggaran. Piutang akhir = piutang awal + penambahan - pelunasan."
        actions={isBranch(user) && <CreateButton href="/piutang/new" label="Tambah Data Piutang" />}
      />
      <Panel>
        {data.rows.length === 0 ? (
          <EmptyState title="Belum ada data piutang" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Sekolah</TableHead>
                <TableHead>Tahun Anggaran</TableHead>
                <TableHead className="text-right">Piutang Awal</TableHead>
                <TableHead className="text-right">Penambahan</TableHead>
                <TableHead className="text-right">Pelunasan</TableHead>
                <TableHead className="text-right">Piutang Akhir</TableHead>
                <TableHead className="text-right" title="Formula belum ditetapkan (OBD-005)">
                  % Tunggakan
                </TableHead>
                <TableHead className="pr-5" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.rows.map(({ record, schoolName, budgetYearName }) => {
                const r = record as typeof receivables.$inferSelect;
                return (
                  <TableRow key={r.id}>
                    <TableCell className="pl-5 font-medium">{schoolName}</TableCell>
                    <TableCell className="text-muted-foreground">{budgetYearName}</TableCell>
                    <TableCell className="num text-right">{rupiah(r.openingBalance)}</TableCell>
                    <TableCell className="num text-right">{rupiah(r.additionAmount)}</TableCell>
                    <TableCell className="num text-right">{rupiah(r.settlementAmount)}</TableCell>
                    <TableCell className="num text-right font-semibold">
                      {rupiah(receivableEndingBalance(r.openingBalance, r.additionAmount, r.settlementAmount))}
                    </TableCell>
                    {/* OBD-005 pending: no formula, never fabricated. */}
                    <TableCell className="text-right text-muted-foreground">-</TableCell>
                    <TableCell className="pr-5 text-right">{isBranch(user) && <EditLink href={`/piutang/${r.id}/edit`} />}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
        <Pagination {...data} basePath="/piutang" />
      </Panel>
    </>
  );
}
