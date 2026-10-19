import { PencilSimpleIcon, PlusIcon } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { EmptyState, Field, PageHeader, Panel } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireUser } from "@/lib/auth/guards";
import { rupiah, shortDate } from "@/lib/format";
import { idParam } from "@/lib/forms";
import { getRkasDetail } from "@/server/rkas";

export const metadata: Metadata = { title: "Detail RKAS" };

export default async function RkasDetailPage({ params }: PageProps<"/rkas/[id]">) {
  const id = idParam((await params).id) ?? notFound();
  const r = await getRkasDetail(await requireUser(), id);
  const latest = r.revisions.at(-1);
  return (
    <>
      <PageHeader
        title={r.schoolName}
        description={`RKAS tahun anggaran ${r.budgetYearName}`}
        actions={
          r.canModify && (
            <>
              <Button variant="outline" asChild>
                <Link href={`/rkas/${r.id}/edit`}>
                  <PencilSimpleIcon /> Ubah
                </Link>
              </Button>
              <Button asChild>
                <Link href={`/rkas/${r.id}/revisions/new`}>
                  <PlusIcon weight="bold" /> Tambah Revisi
                </Link>
              </Button>
            </>
          )
        }
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <Panel className="h-fit p-5">
          <p className="text-sm text-muted-foreground">RKAS Terakhir</p>
          <p className="num mt-1 text-3xl font-semibold tracking-tight">{rupiah(r.currentAmount)}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {latest ? `Dari revisi ${latest.revisionNumber}` : "Belum ada revisi, sama dengan RKAS awal"}
          </p>
          <dl className="mt-6 grid gap-4 border-t pt-5">
            <Field label="RKAS Awal">
              <span className="num">{rupiah(r.initialAmount)}</span>
            </Field>
            <Field label="Tanggal Pengesahan">{shortDate(r.initialApprovalDate)}</Field>
            <Field label="Perubahan Utama">
              <span className="font-normal whitespace-pre-line">{r.majorChangeDescription ?? "-"}</span>
            </Field>
          </dl>
        </Panel>
        <Panel>
          <h2 className="px-5 py-4 font-semibold">Riwayat Revisi</h2>
          {r.revisions.length === 0 ? (
            <EmptyState title="Belum ada revisi" hint="Revisi bersifat permanen; koreksi dilakukan dengan menambah revisi baru." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-5">Revisi</TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead className="pr-5">Keterangan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {r.revisions.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="num pl-5 font-medium">{v.revisionNumber}</TableCell>
                    <TableCell className="num text-right">{rupiah(v.amount)}</TableCell>
                    <TableCell className="text-muted-foreground">{shortDate(v.revisionDate)}</TableCell>
                    <TableCell className="max-w-md pr-5 whitespace-normal text-muted-foreground">
                      {v.changeDescription ?? "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Panel>
      </div>
    </>
  );
}
