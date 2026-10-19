import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";

import { ConfirmAction } from "@/components/app/confirm-action";
import { CreateButton, EditLink } from "@/components/app/create-button";
import { EmptyState, PageHeader, Pagination, Panel, StatusBadge } from "@/components/app/ui";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { isCentral } from "@/lib/auth/authz";
import { requireUser } from "@/lib/auth/guards";
import { pageNumber } from "@/lib/forms";
import { listSchools } from "@/server/master";

import { setActive } from "./actions";

export const metadata: Metadata = { title: "Sekolah" };

export default async function SchoolListPage({ searchParams }: PageProps<"/sekolah">) {
  const user = await requireUser();
  const q = await searchParams;
  const search = typeof q.q === "string" ? q.q.trim() : "";
  const data = await listSchools(user, pageNumber(q.page), search);
  const central = isCentral(user);
  return (
    <>
      <PageHeader
        title="Sekolah"
        description={central ? "Master data sekolah binaan dan cabang pengelolanya." : "Sekolah yang dikelola cabang Anda."}
        actions={central && <CreateButton href="/sekolah/new" label="Tambah Sekolah" />}
      />
      <Panel>
        <form className="border-b p-3" role="search">
          <div className="relative max-w-sm">
            <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input name="q" defaultValue={search} placeholder="Cari nama atau kode sekolah" aria-label="Cari sekolah" className="h-9 pl-9" />
          </div>
        </form>
        {data.rows.length === 0 ? (
          <EmptyState title={search ? "Tidak ada sekolah yang cocok." : "Belum ada sekolah."} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Kode</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Cabang</TableHead>
                <TableHead>Jenjang</TableHead>
                <TableHead className="text-right">Siswa</TableHead>
                <TableHead>Status</TableHead>
                {central && <TableHead className="pr-5" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.rows.map(({ school: s, branchName }) => (
                <TableRow key={s.id}>
                  <TableCell className="pl-5 font-mono text-xs text-muted-foreground">{s.code}</TableCell>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="text-muted-foreground">{branchName}</TableCell>
                  <TableCell>{s.educationLevel ?? "-"}</TableCell>
                  <TableCell className="num text-right">{s.studentCount ?? "-"}</TableCell>
                  <TableCell>
                    {s.isActive ? <StatusBadge tone="success">Aktif</StatusBadge> : <StatusBadge>Tidak Aktif</StatusBadge>}
                  </TableCell>
                  {central && (
                    <TableCell className="pr-5 text-right">
                      <div className="flex justify-end gap-1">
                        <EditLink href={`/sekolah/${s.id}/edit`} />
                        {s.isActive ? (
                          <ConfirmAction
                            action={setActive.bind(null, s.id, false)}
                            label="Nonaktifkan"
                            title={`Nonaktifkan ${s.name}?`}
                            description="Sekolah nonaktif tidak bisa dipilih untuk data baru. Data lama tetap tersimpan."
                            confirmLabel="Nonaktifkan"
                            destructive
                          />
                        ) : (
                          <ConfirmAction
                            action={setActive.bind(null, s.id, true)}
                            label="Aktifkan"
                            title={`Aktifkan ${s.name}?`}
                            description="Sekolah akan bisa dipilih kembali untuk data baru."
                            confirmLabel="Aktifkan"
                          />
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <Pagination {...data} basePath="/sekolah" params={{ q: search || undefined }} />
      </Panel>
    </>
  );
}
