/** Small presentational building blocks shared by every page (server-safe). */
import { CaretLeftIcon, CaretRightIcon, TrayIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 max-w-[65ch] text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

const TONES = {
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-destructive",
  info: "bg-info-soft text-primary",
  neutral: "bg-muted text-muted-foreground",
} as const;

export function StatusBadge({ tone = "neutral", children }: { tone?: keyof typeof TONES; children: React.ReactNode }) {
  return <Badge className={cn("rounded-md font-medium", TONES[tone])}>{children}</Badge>;
}

export function Panel({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("rounded-xl border bg-card shadow-[0_1px_2px_oklch(0.3_0.05_262/0.05)]", className)} {...props} />;
}

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
      <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <TrayIcon className="size-5" />
      </span>
      <p className="font-medium">{title}</p>
      {hint && <p className="max-w-sm text-sm text-muted-foreground">{hint}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/** Prev/next pager that keeps the other query params (filters) intact. */
export function Pagination({
  page,
  pages,
  total,
  basePath,
  params = {},
}: {
  page: number;
  pages: number;
  total: number;
  basePath: string;
  params?: Record<string, string | undefined>;
}) {
  if (total === 0) return null;
  const href = (p: number) => {
    const q = new URLSearchParams(Object.entries({ ...params, page: String(p) }).filter(([, v]) => v) as [string, string][]);
    return `${basePath}?${q}`;
  };
  return (
    <div className="flex items-center justify-between gap-4 border-t px-4 py-3 text-sm text-muted-foreground">
      <p>
        <span className="num font-medium text-foreground">{total}</span> data, halaman{" "}
        <span className="num">{page}</span> dari <span className="num">{pages}</span>
      </p>
      <div className="flex gap-1">
        <Button variant="outline" size="icon-sm" asChild aria-disabled={page <= 1} className={cn(page <= 1 && "pointer-events-none opacity-50")}>
          <Link href={href(page - 1)} aria-label="Halaman sebelumnya">
            <CaretLeftIcon />
          </Link>
        </Button>
        <Button variant="outline" size="icon-sm" asChild aria-disabled={page >= pages} className={cn(page >= pages && "pointer-events-none opacity-50")}>
          <Link href={href(page + 1)} aria-label="Halaman berikutnya">
            <CaretRightIcon />
          </Link>
        </Button>
      </div>
    </div>
  );
}

export function Metric({ label, value, hint, tone }: { label: string; value: React.ReactNode; hint?: string; tone?: "danger" | "warning" }) {
  return (
    <div className="flex flex-col gap-1 bg-card px-5 py-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p
        className={cn(
          "num text-2xl font-semibold tracking-tight",
          tone === "danger" && "text-destructive",
          tone === "warning" && "text-warning",
        )}
      >
        {value}
      </p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/** Label/value pair for detail pages. */
export function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium">{children}</dd>
    </div>
  );
}
