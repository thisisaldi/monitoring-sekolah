import type { FieldDef, Section } from "@/components/app/entity-form";

export const ROLE_OPTIONS = [
  { value: "ADMIN", label: "Admin" },
  { value: "CENTRAL", label: "Pusat" },
  { value: "BRANCH", label: "Cabang" },
];

export const passwordFields: FieldDef[] = [
  { name: "password", label: "Password", type: "password", required: true, help: "Minimal 8 karakter, tidak hanya angka." },
  { name: "passwordConfirm", label: "Konfirmasi Password", type: "password", required: true },
];

export const userSections = (branches: { id: number; name: string }[], withPassword: boolean): Section[] => [
  {
    fields: [
      { name: "name", label: "Nama", required: true },
      { name: "username", label: "Username", required: true },
      { name: "role", label: "Peran", type: "select", required: true, options: ROLE_OPTIONS },
      {
        name: "branchId",
        label: "Cabang",
        type: "select",
        options: branches.map((b) => ({ value: String(b.id), label: b.name })),
        help: "Wajib untuk peran Cabang, kosongkan untuk Admin dan Pusat.",
      },
      { name: "isActive", label: "Status", type: "checkbox", help: "Aktif" },
    ],
  },
  ...(withPassword ? [{ title: "Password", fields: passwordFields }] : []),
];
