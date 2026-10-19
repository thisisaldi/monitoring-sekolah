import type { Metadata } from "next";

import { ConfirmAction } from "@/components/app/confirm-action";
import { CreateButton, EditLink } from "@/components/app/create-button";
import { EmptyState, PageHeader, Pagination, Panel, StatusBadge } from "@/components/app/ui";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireAdmin } from "@/lib/auth/guards";
import { BRANCH_TYPE_LABEL } from "@/lib/format";
import { pageNumber } from "@/lib/forms";
import { listBranches } from "@/server/master";

import { setActive } from "./actions";

export const metadata: Metadata = { title: "Cabang" };

export default async function BranchListPage({ searchParams }: PageProps<"/admin/cabang">) {
  const user = await requireAdmin();
  const data = await listBranches(user, pageNumber((await searchParams).page));
  return (
    <>
      <PageHeader
        title="Cabang"
        description="Cabang, Perwakilan dan Pengurus Pusat. Masing-masing dapat mengelola banyak sekolah."
        actions={<CreateButton href="/admin/cabang/new" label="Tambah Cabang" />}
      />
      <Panel>
        {data.rows.length === 0 ? (
          <EmptyState title="Belum ada cabang" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Kode</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Jenis</TableHead>
                <TableHead className="text-right">Sekolah</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-5" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.rows.map(({ branch: b, schoolCount }) => (
                <TableRow key={b.id}>
                  <TableCell className="pl-5 font-mono text-xs text-muted-foreground">{b.code}</TableCell>
                  <TableCell className="font-medium">{b.name}</TableCell>
                  <TableCell>{BRANCH_TYPE_LABEL[b.type]}</TableCell>
                  <TableCell className="num text-right">{schoolCount ?? 0}</TableCell>
                  <TableCell>
                    {b.isActive ? <StatusBadge tone="success">Aktif</StatusBadge> : <StatusBadge>Tidak Aktif</StatusBadge>}
                  </TableCell>
                  <TableCell className="pr-5 text-right">
                    <div className="flex justify-end gap-1">
                      <EditLink href={`/admin/cabang/${b.id}/edit`} />
                      <ConfirmAction
                        action={setActive.bind(null, b.id, !b.isActive)}
                        label={b.isActive ? "Nonaktifkan" : "Aktifkan"}
                        title={`${b.isActive ? "Nonaktifkan" : "Aktifkan"} ${b.name}?`}
                        description={
                          b.isActive
                            ? "Cabang nonaktif tidak bisa dipilih saat mendaftarkan sekolah baru."
                            : "Cabang akan bisa dipilih kembali."
                        }
                        confirmLabel={b.isActive ? "Nonaktifkan" : "Aktifkan"}
                        destructive={b.isActive}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <Pagination {...data} basePath="/admin/cabang" />
      </Panel>
    </>
  );
}
