import type { Metadata } from "next";

import { NewRecordPage } from "@/components/app/record-pages";

import { create } from "../actions";
import { findingSections } from "../shared";

export const metadata: Metadata = { title: "Tambah Temuan" };

export default function Page() {
  return (
    <NewRecordPage title="Tambah Temuan" action={create} cancelHref="/temuan" withBudgetYear={false} sections={findingSections} />
  );
}
