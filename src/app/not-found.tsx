import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="num text-sm font-medium text-muted-foreground">404</p>
      <h1 className="text-xl font-semibold">Halaman tidak ditemukan</h1>
      <Button asChild variant="outline" className="mt-2">
        <Link href="/dashboard">Kembali ke Dashboard</Link>
      </Button>
    </div>
  );
}
