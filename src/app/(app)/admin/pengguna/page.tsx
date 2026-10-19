import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";

import { ConfirmAction } from "@/components/app/confirm-action";
import { CreateButton, EditLink } from "@/components/app/create-button";
import { FilterSelect } from "@/components/app/filter-select";
import { EmptyState, PageHeader, Pagination, Panel, StatusBadge } from "@/components/app/ui";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireAdmin } from "@/lib/auth/guards";
import { ROLE_LABEL } from "@/lib/format";
import { idParam, pageNumber } from "@/lib/forms";
import { branchOptions } from "@/server/master";
import { listUsers } from "@/server/users";

import { setActive } from "./actions";
import { ROLE_OPTIONS } from "./fields";

export const metadata: Metadata = { title: "Pengguna" };

const str = (v: string | string[] | undefined) => (typeof v === "string" ? v.trim() : "");

export default async function UserListPage({ searchParams }: PageProps<"/admin/pengguna">) {
  const admin = await requireAdmin();
  const q = await searchParams;
  const filters = { search: str(q.q), role: str(q.role), status: str(q.status), branchId: idParam(q.branch) };
  const [data, branches] = await Promise.all([listUsers(admin, pageNumber(q.page), filters), branchOptions()]);
  return (
    <>
      <PageHeader
        title="Pengguna"
        description="Akun dibuat oleh administrator; tidak ada pendaftaran mandiri."
        actions={<CreateButton href="/admin/pengguna/new" label="Tambah Pengguna" />}
      />
      <Panel>
        <div className="flex flex-wrap items-end gap-3 border-b p-3">
          <form role="search" className="relative w-full max-w-xs">
            {filters.role && <input type="hidden" name="role" value={filters.role} />}
            {filters.status && <input type="hidden" name="status" value={filters.status} />}
            {filters.branchId && <input type="hidden" name="branch" value={filters.branchId} />}
            <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input name="q" defaultValue={filters.search} placeholder="Cari nama atau username" aria-label="Cari pengguna" className="h-9 pl-9" />
          </form>
          <FilterSelect name="role" label="Peran" allLabel="Semua peran" value={filters.role} options={ROLE_OPTIONS} />
          <FilterSelect
            name="status"
            label="Status"
            allLabel="Semua status"
            value={filters.status}
            options={[
              { value: "active", label: "Aktif" },
              { value: "inactive", label: "Tidak Aktif" },
            ]}
          />
          <FilterSelect
            name="branch"
            label="Cabang"
            allLabel="Semua cabang"
            value={filters.branchId ? String(filters.branchId) : ""}
            options={branches.map((b) => ({ value: String(b.id), label: b.name }))}
          />
        </div>
        {data.rows.length === 0 ? (
          <EmptyState title="Tidak ada pengguna yang cocok." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Nama</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Peran</TableHead>
                <TableHead>Cabang</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-5" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.rows.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="pl-5 font-medium">
                    {u.name}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{u.username}</TableCell>
                  <TableCell>
                    {u.role === "ADMIN" ? <StatusBadge tone="info">Admin</StatusBadge> : ROLE_LABEL[u.role]}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{u.branchName ?? "-"}</TableCell>
                  <TableCell>
                    {u.isActive ? <StatusBadge tone="success">Aktif</StatusBadge> : <StatusBadge>Tidak Aktif</StatusBadge>}
                  </TableCell>
                  <TableCell className="pr-5 text-right">
                    <div className="flex justify-end gap-1">
                      <EditLink href={`/admin/pengguna/${u.id}/edit`} />
                      <Link href={`/admin/pengguna/${u.id}/password`} className="px-2 py-1 text-sm text-primary hover:underline">
                        Password
                      </Link>
                      {u.id !== admin.id && (
                        <ConfirmAction
                          action={setActive.bind(null, u.id, !u.isActive)}
                          label={u.isActive ? "Nonaktifkan" : "Aktifkan"}
                          title={`${u.isActive ? "Nonaktifkan" : "Aktifkan"} ${u.name}?`}
                          description={u.isActive ? "Pengguna tidak akan bisa masuk sampai diaktifkan kembali." : "Pengguna akan bisa masuk kembali."}
                          confirmLabel={u.isActive ? "Nonaktifkan" : "Aktifkan"}
                          destructive={u.isActive}
                        />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <Pagination
          {...data}
          basePath="/admin/pengguna"
          params={{ q: filters.search || undefined, role: filters.role || undefined, status: filters.status || undefined, branch: q.branch as string }}
        />
      </Panel>
    </>
  );
}
