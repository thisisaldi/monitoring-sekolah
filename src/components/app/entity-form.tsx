"use client";

/**
 * One form component for every create/edit screen. Fields are declared as
 * data; validation and authorization always run again in the server action.
 */
import { WarningCircleIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { rupiah } from "@/lib/format";
import type { FormState } from "@/lib/forms";
import { normalizeMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

export type Option = { value: string; label: string };

export type FieldDef = {
  name: string;
  label: string;
  type?: "text" | "textarea" | "money" | "number" | "date" | "select" | "checkbox" | "password";
  options?: Option[];
  required?: boolean;
  help?: string;
  placeholder?: string;
  /** Spans both columns of the two-column grid. */
  wide?: boolean;
};

export type Section = { title?: string; fields: FieldDef[] };

const NONE = "__none__";

function MoneyInput({ id, name, defaultValue, invalid }: { id: string; name: string; defaultValue: string; invalid: boolean }) {
  const [value, setValue] = useState(defaultValue);
  const normalized = value ? normalizeMoney(value) : null;
  return (
    <>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">Rp</span>
        <Input
          id={id}
          name={name}
          inputMode="decimal"
          autoComplete="off"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-invalid={invalid || undefined}
          className="num h-9 pl-9"
        />
      </div>
      {/* Read-back of how the number was understood (dots = thousands, comma = decimals). */}
      {value && (
        <p className="num text-xs text-muted-foreground" aria-live="polite">
          {normalized ? `Tercatat: ${rupiah(normalized)}` : "Gunakan titik untuk ribuan dan koma untuk desimal."}
        </p>
      )}
    </>
  );
}

function Control({ field, value, invalid }: { field: FieldDef; value: string; invalid: boolean }) {
  const id = `f-${field.name}`;
  const common = { id, name: field.name, defaultValue: value, "aria-invalid": invalid || undefined };
  switch (field.type) {
    case "textarea":
      return <Textarea {...common} rows={3} placeholder={field.placeholder} />;
    case "money":
      return <MoneyInput id={id} name={field.name} defaultValue={value} invalid={invalid} />;
    case "select":
      return (
        <Select name={field.name} defaultValue={value === "" ? (field.required ? undefined : NONE) : value}>
          <SelectTrigger id={id} aria-invalid={invalid || undefined} className="h-9 w-full">
            <SelectValue placeholder={field.placeholder ?? "Pilih..."} />
          </SelectTrigger>
          <SelectContent>
            {!field.required && <SelectItem value={NONE}>Tidak diisi</SelectItem>}
            {field.options?.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    case "checkbox":
      return (
        <div className="flex h-9 items-center gap-2">
          <Checkbox id={id} name={field.name} defaultChecked={value === "on" || value === "true"} />
          <Label htmlFor={id} className="font-normal">
            {field.help ?? "Ya"}
          </Label>
        </div>
      );
    default:
      return (
        <Input
          {...common}
          type={field.type ?? "text"}
          inputMode={field.type === "number" ? "numeric" : undefined}
          placeholder={field.placeholder}
          className="h-9"
        />
      );
  }
}

export function EntityForm({
  action,
  sections,
  initial = {},
  submitLabel = "Simpan",
  cancelHref,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  sections: Section[];
  initial?: Record<string, string>;
  submitLabel?: string;
  cancelHref: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const values = { ...initial, ...state.values };

  // Radix Select posts the placeholder sentinel for "not filled"; send "" instead.
  const submit = (formData: FormData) => {
    for (const [k, v] of [...formData.entries()]) if (v === NONE) formData.set(k, "");
    return formAction(formData);
  };

  return (
    <form action={submit} className="flex flex-col gap-8" noValidate>
      {state.formError && (
        <div role="alert" className="flex items-start gap-2 rounded-lg bg-danger-soft px-4 py-3 text-sm text-destructive">
          <WarningCircleIcon className="mt-0.5 size-4 shrink-0" weight="bold" />
          {state.formError}
        </div>
      )}
      {sections.map((section, i) => (
        <fieldset key={i} className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
          {/* float + w-full keeps the legend inside the grid flow instead of overlapping the first field. */}
          {section.title && <legend className="float-left mb-1 w-full border-b pb-2 text-sm font-semibold sm:col-span-2">{section.title}</legend>}
          {section.fields.map((field) => {
            const errors = state.errors?.[field.name];
            return (
              <div key={field.name} className={cn("flex flex-col gap-2", (field.wide || field.type === "textarea") && "sm:col-span-2")}>
                {field.type !== "checkbox" && (
                  <Label htmlFor={`f-${field.name}`}>
                    {field.label}
                    {field.required && <span className="text-destructive" aria-hidden> *</span>}
                  </Label>
                )}
                {field.type === "checkbox" && <span className="text-sm font-medium">{field.label}</span>}
                <Control field={field} value={values[field.name] ?? ""} invalid={!!errors} />
                {field.help && field.type !== "checkbox" && !errors && <p className="text-xs text-muted-foreground">{field.help}</p>}
                {errors?.map((e) => (
                  <p key={e} className="text-xs font-medium text-destructive">
                    {e}
                  </p>
                ))}
              </div>
            );
          })}
        </fieldset>
      ))}
      <div className="flex items-center gap-2 border-t pt-6">
        <Button type="submit" size="lg" disabled={pending} className="min-w-28">
          {pending ? "Menyimpan..." : submitLabel}
        </Button>
        <Button variant="ghost" size="lg" asChild>
          <Link href={cancelHref}>Batal</Link>
        </Button>
      </div>
    </form>
  );
}
