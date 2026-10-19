import type { Metadata } from "next";
import Link from "next/link";

import { CreateButton } from "@/components/app/create-button";
import { EmptyState, PageHeader, Pagination, Panel } from "@/components/app/ui";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { isBranch } from "@/lib/auth/authz";
import { requireUser } from "@/lib/auth/guards";
import { rupiah } from "@/lib/format";
import { pageNumber } from "@/lib/forms";
import { listRkas } from "@/server/rkas";

export const metadata: Metadata = { title: "RKAS" };

export default async function RkasListPage({ searchParams }: PageProps<"/rkas">) {
  const user = await requireUser();
  const data = await listRkas(user, pageNumber((await searchParams).page));
  const create = isBranch(user) && <CreateButton href="/rkas/new" label="Tambah RKAS" />;
  return (
    <>
      <PageHeader
        title="RKAS"
        description="Rencana Kegiatan dan Anggaran Sekolah per tahun anggaran, beserta revisinya."
        actions={create}
      />
      <Panel>
        {data.rows.length === 0 ? (
          <EmptyState title="Belum ada RKAS" hint={isBranch(user) ? "Tambahkan RKAS awal untuk sekolah Anda." : undefined} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Sekolah</TableHead>
                <TableHead>Tahun Anggaran</TableHead>
                <TableHead className="text-right">RKAS Awal</TableHead>
                <TableHead className="pr-5 text-right">RKAS Terakhir</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="pl-5 font-medium">
                    <Link href={`/rkas/${r.id}`} className="hover:text-primary hover:underline">
                      {r.schoolName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{r.budgetYearName}</TableCell>
                  <TableCell className="num text-right text-muted-foreground">{rupiah(r.initialAmount)}</TableCell>
                  <TableCell className="num pr-5 text-right font-semibold">{rupiah(r.currentAmount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <Pagination {...data} basePath="/rkas" />
      </Panel>
    </>
  );
}
