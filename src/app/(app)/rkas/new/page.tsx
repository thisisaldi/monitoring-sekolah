import type { Metadata } from "next";

import { EntityForm } from "@/components/app/entity-form";
import { budgetYearField, preselect, schoolField } from "@/components/app/fields";
import { NoSchools } from "@/components/app/no-schools";
import { PageHeader, Panel } from "@/components/app/ui";
import { requireBranch } from "@/lib/auth/guards";
import { activeBudgetYears, userSchools } from "@/server/common";

import { create } from "../actions";
import { rkasFields } from "../fields";

export const metadata: Metadata = { title: "Tambah RKAS" };

export default async function NewRkasPage() {
  const user = await requireBranch();
  const [schools, years] = await Promise.all([userSchools(user), activeBudgetYears()]);
  return (
    <>
      <PageHeader title="Tambah RKAS" />
      <Panel className="max-w-3xl p-6">
        {schools.length === 0 ? (
          <NoSchools />
        ) : (
          <EntityForm
            action={create}
            cancelHref="/rkas"
            initial={preselect(schools)}
            sections={[{ fields: [schoolField(schools), budgetYearField(years)] }, { title: "Anggaran", fields: rkasFields }]}
          />
        )}
      </Panel>
    </>
  );
}
