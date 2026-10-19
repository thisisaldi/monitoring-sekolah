import type { Metadata } from "next";
import Link from "next/link";

import { CreateButton, EditLink } from "@/components/app/create-button";
import { EmptyState, PageHeader, Pagination, Panel } from "@/components/app/ui";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { isBranch } from "@/lib/auth/authz";
import { requireUser } from "@/lib/auth/guards";
import { rupiah } from "@/lib/format";
import { pageNumber } from "@/lib/forms";
import { listSemester } from "@/server/realizations";

export const metadata: Metadata = { title: "Realisasi Semester" };

export default async function SemesterListPage({ searchParams }: PageProps<"/realisasi/semester">) {
  const user = await requireUser();
  const data = await listSemester(user, pageNumber((await searchParams).page));
  return (
    <>
      <PageHeader
        title="Realisasi Semester"
        description="Realisasi per semester. Ringkasan menghitung total, persentase dan sisa anggaran terhadap RKAS terakhir."
        actions={isBranch(user) && <CreateButton href="/realisasi/semester/new" label="Tambah Realisasi" />}
      />
      <Panel>
        {data.rows.length === 0 ? (
          <EmptyState title="Belum ada data realisasi semester" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Sekolah</TableHead>
                <TableHead>Tahun Anggaran</TableHead>
                <TableHead>Semester</TableHead>
                <TableHead className="text-right">Realisasi</TableHead>
                <TableHead className="pr-5" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.rows.map(({ record: r, schoolName, budgetYearName }) => (
                <TableRow key={r.id}>
                  <TableCell className="pl-5 font-medium">{schoolName}</TableCell>
                  <TableCell className="text-muted-foreground">{budgetYearName}</TableCell>
                  <TableCell>Semester {r.semester}</TableCell>
                  <TableCell className="num text-right">{rupiah(r.realizationAmount)}</TableCell>
                  <TableCell className="pr-5 text-right">
                    <Link
                      href={`/realisasi/semester/ringkasan/${r.schoolId}/${r.budgetYearId}`}
                      className="mr-2 text-sm text-primary hover:underline"
                    >
                      Ringkasan
                    </Link>
                    {isBranch(user) && <EditLink href={`/realisasi/semester/${r.id}/edit`} />}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <Pagination {...data} basePath="/realisasi/semester" />
      </Panel>
    </>
  );
}
