/** Create/edit page frames shared by every per-school operational module. */
import type { FormState } from "@/lib/forms";
import { requireBranch } from "@/lib/auth/guards";
import { activeBudgetYears, userSchools } from "@/server/common";

import { EntityForm, type FieldDef, type Section } from "./entity-form";
import { budgetYearField, preselect, schoolField } from "./fields";
import { NoSchools } from "./no-schools";
import { PageHeader, Panel } from "./ui";

type Action = (state: FormState, formData: FormData) => Promise<FormState>;

/** BRANCH-only create page: school (+ budget year) pickers, then the module's fields. */
export async function NewRecordPage({
  title,
  action,
  cancelHref,
  periodFields = [],
  sections,
  withBudgetYear = true,
}: {
  title: string;
  action: Action;
  cancelHref: string;
  /** Extra identity fields shown next to school/year (month, semester). */
  periodFields?: FieldDef[];
  sections: Section[];
  withBudgetYear?: boolean;
}) {
  const user = await requireBranch();
  const [schools, years] = await Promise.all([userSchools(user), activeBudgetYears()]);
  const identity = [schoolField(schools), ...(withBudgetYear ? [budgetYearField(years)] : []), ...periodFields];
  return (
    <>
      <PageHeader title={title} />
      <Panel className="max-w-3xl p-6">
        {schools.length === 0 ? (
          <NoSchools />
        ) : (
          <EntityForm action={action} cancelHref={cancelHref} initial={preselect(schools)} sections={[{ fields: identity }, ...sections]} />
        )}
      </Panel>
    </>
  );
}

export function EditRecordPage({
  title,
  description,
  action,
  cancelHref,
  initial,
  sections,
}: {
  title: string;
  description: string;
  action: Action;
  cancelHref: string;
  initial: Record<string, string>;
  sections: Section[];
}) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <Panel className="max-w-3xl p-6">
        <EntityForm action={action} cancelHref={cancelHref} initial={initial} sections={sections} />
      </Panel>
    </>
  );
}
