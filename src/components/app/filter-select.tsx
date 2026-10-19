"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import type { Option } from "./entity-form";

const ALL = "__all__";

/** A URL-driven filter: changing it updates ?name= and resets paging. */
export function FilterSelect({
  name,
  label,
  options,
  value,
  allLabel,
}: {
  name: string;
  label: string;
  options: Option[];
  value: string;
  /** When set, offers an "all" choice that clears the filter. */
  allLabel?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const onChange = (next: string) => {
    const q = new URLSearchParams(params);
    if (next === ALL) q.delete(name);
    else q.set(name, next);
    q.delete("page");
    // Narrowing the branch invalidates a school picked from the old branch.
    if (name === "branch") q.delete("school");
    router.push(`?${q}`);
  };
  return (
    <div className="flex min-w-48 flex-col gap-1.5">
      <Label htmlFor={`filter-${name}`} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <Select value={value || (allLabel ? ALL : undefined)} onValueChange={onChange}>
        <SelectTrigger id={`filter-${name}`} className="h-9 w-full bg-card">
          <SelectValue placeholder={allLabel ?? "Pilih..."} />
        </SelectTrigger>
        <SelectContent>
          {allLabel && <SelectItem value={ALL}>{allLabel}</SelectItem>}
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
