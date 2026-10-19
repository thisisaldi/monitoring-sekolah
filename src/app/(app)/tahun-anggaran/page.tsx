import type { Metadata } from "next";

import { ConfirmAction } from "@/components/app/confirm-action";
import { CreateButton, EditLink } from "@/components/app/create-button";
import { EmptyState, PageHeader, Pagination, Panel, StatusBadge } from "@/components/app/ui";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { isCentral } from "@/lib/auth/authz";
import { requireUser } from "@/lib/auth/guards";
import { shortDate } from "@/lib/format";
import { pageNumber } from "@/lib/forms";
import { listBudgetYears } from "@/server/master";

import { setActive } from "./actions";

export const metadata: Metadata = { title: "Tahun Anggaran" };

export default async function BudgetYearListPage({ searchParams }: PageProps<"/tahun-anggaran">) {
  const user = await requireUser();
  const data = await listBudgetYears(pageNumber((await searchParams).page));
  const central = isCentral(user);
  return (
    <>
      <PageHeader
        title="Tahun Anggaran"
        description="Berlaku untuk semua sekolah. Hanya tahun anggaran aktif yang bisa dipilih untuk data baru."
        actions={central && <CreateButton href="/tahun-anggaran/new" label="Tambah Tahun Anggaran" />}
      />
      <Panel>
        {data.rows.length === 0 ? (
          <EmptyState title="Belum ada tahun anggaran" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Nama</TableHead>
                <TableHead>Mulai</TableHead>
                <TableHead>Selesai</TableHead>
                <TableHead>Status</TableHead>
                {central && <TableHead className="pr-5" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.rows.map((y) => (
                <TableRow key={y.id}>
                  <TableCell className="pl-5 font-medium">{y.name}</TableCell>
                  <TableCell>{shortDate(y.startDate)}</TableCell>
                  <TableCell>{shortDate(y.endDate)}</TableCell>
                  <TableCell>
                    {y.isActive ? <StatusBadge tone="success">Aktif</StatusBadge> : <StatusBadge>Tidak Aktif</StatusBadge>}
                  </TableCell>
                  {central && (
                    <TableCell className="pr-5 text-right">
                      <div className="flex justify-end gap-1">
                        <EditLink href={`/tahun-anggaran/${y.id}/edit`} />
                        <ConfirmAction
                          action={setActive.bind(null, y.id, !y.isActive)}
                          label={y.isActive ? "Nonaktifkan" : "Aktifkan"}
                          title={`${y.isActive ? "Nonaktifkan" : "Aktifkan"} ${y.name}?`}
                          description={
                            y.isActive
                              ? "Tahun anggaran nonaktif tidak bisa dipilih untuk data baru. Data lama tetap tersimpan."
                              : "Tahun anggaran akan bisa dipilih kembali untuk data baru."
                          }
                          confirmLabel={y.isActive ? "Nonaktifkan" : "Aktifkan"}
                          destructive={y.isActive}
                        />
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <Pagination {...data} basePath="/tahun-anggaran" />
      </Panel>
    </>
  );
}
