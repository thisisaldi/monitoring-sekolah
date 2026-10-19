import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Metric, PageHeader, Panel } from "@/components/app/ui";
import { requireUser } from "@/lib/auth/guards";
import { percent, rupiah } from "@/lib/format";
import { idParam } from "@/lib/forms";
import { getSemesterSummary } from "@/server/realizations";

export const metadata: Metadata = { title: "Ringkasan Semester" };

export default async function Page({ params }: PageProps<"/realisasi/semester/ringkasan/[schoolId]/[budgetYearId]">) {
  const p = await params;
  const schoolId = idParam(p.schoolId) ?? notFound();
  const budgetYearId = idParam(p.budgetYearId) ?? notFound();
  const s = await getSemesterSummary(await requireUser(), schoolId, budgetYearId);
  const negative = s.remainingBudget !== null && s.remainingBudget < 0n;
  return (
    <>
      <PageHeader title={s.school.name} description={`Ringkasan realisasi semester, tahun anggaran ${s.budgetYearName}`} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Panel className="p-6">
          <p className="text-sm text-muted-foreground">Total Realisasi</p>
          <p className="num mt-1 text-4xl font-semibold tracking-tight">{rupiah(s.total)}</p>
          <p className="num mt-2 text-sm text-muted-foreground">
            {percent(s.percentageFinal)} dari RKAS terakhir {rupiah(s.latestRkas)}
          </p>
          <dl className="mt-8 grid grid-cols-2 gap-6 border-t pt-6">
            <div>
              <dt className="text-sm text-muted-foreground">Semester 1</dt>
              <dd className="num mt-1 text-lg font-semibold">{rupiah(s.semester1)}</dd>
              <dd className="num text-xs text-muted-foreground">{percent(s.percentageSemester1)} dari RKAS</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Semester 2</dt>
              <dd className="num mt-1 text-lg font-semibold">{rupiah(s.semester2)}</dd>
            </div>
          </dl>
        </Panel>
        <Panel className="grid h-fit gap-px overflow-hidden bg-border">
          <Metric label="RKAS Terakhir" value={rupiah(s.latestRkas)} hint={s.latestRkas === null ? "RKAS belum diinput" : undefined} />
          <Metric
            label="Sisa Anggaran"
            value={rupiah(s.remainingBudget)}
            tone={negative ? "danger" : undefined}
            hint={negative ? "Realisasi melebihi RKAS terakhir" : undefined}
          />
        </Panel>
      </div>
    </>
  );
}
