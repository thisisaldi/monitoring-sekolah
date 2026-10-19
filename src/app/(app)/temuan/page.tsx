import type { Metadata } from "next";

import { CreateButton, EditLink } from "@/components/app/create-button";
import { EmptyState, PageHeader, Pagination, Panel, StatusBadge } from "@/components/app/ui";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { isBranch } from "@/lib/auth/authz";
import { requireUser } from "@/lib/auth/guards";
import { shortDate } from "@/lib/format";
import { pageNumber } from "@/lib/forms";
import { listFindings } from "@/server/findings";

export const metadata: Metadata = { title: "Temuan & Tindak Lanjut" };

const STATUS = {
  OPEN: <StatusBadge tone="neutral">Terbuka</StatusBadge>,
  ON_PROGRESS: <StatusBadge tone="warning">Proses</StatusBadge>,
  COMPLETED: <StatusBadge tone="success">Selesai</StatusBadge>,
};

export default async function FindingListPage({ searchParams }: PageProps<"/temuan">) {
  const user = await requireUser();
  const data = await listFindings(user, pageNumber((await searchParams).page));
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
  return (
    <>
      <PageHeader
        title="Temuan & Tindak Lanjut"
        description="Temuan pemeriksaan per sekolah beserta rekomendasi, penanggung jawab dan batas waktunya."
        actions={isBranch(user) && <CreateButton href="/temuan/new" label="Tambah Temuan" />}
      />
      <Panel>
        {data.rows.length === 0 ? (
          <EmptyState title="Belum ada temuan" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Tanggal</TableHead>
                <TableHead>Sekolah</TableHead>
                <TableHead>Temuan</TableHead>
                <TableHead>PIC</TableHead>
                <TableHead>Batas Waktu</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-5" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.rows.map(({ record: r, schoolName }) => {
                const overdue = r.status !== "COMPLETED" && r.deadline < today;
                return (
                  <TableRow key={r.id}>
                    <TableCell className="pl-5 text-muted-foreground">{shortDate(r.findingDate)}</TableCell>
                    <TableCell className="font-medium">{schoolName}</TableCell>
                    <TableCell className="max-w-xs truncate" title={r.finding}>
                      {r.finding}
                    </TableCell>
                    <TableCell>{r.pic}</TableCell>
                    <TableCell className={overdue ? "font-medium text-destructive" : "text-muted-foreground"}>
                      {shortDate(r.deadline)}
                      {overdue && <span className="sr-only"> (lewat batas waktu)</span>}
                    </TableCell>
                    <TableCell>{STATUS[r.status]}</TableCell>
                    <TableCell className="pr-5 text-right">{isBranch(user) && <EditLink href={`/temuan/${r.id}/edit`} />}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
        <Pagination {...data} basePath="/temuan" />
      </Panel>
    </>
  );
}
