import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function Forbidden() {
  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="num text-sm font-medium text-muted-foreground">403</p>
      <h1 className="text-xl font-semibold">Anda tidak memiliki akses ke halaman ini</h1>
      <p className="max-w-sm text-sm text-muted-foreground">Data ini berada di luar cakupan akun Anda.</p>
      <Button asChild variant="outline" className="mt-2">
        <Link href="/dashboard">Kembali ke Dashboard</Link>
      </Button>
    </div>
  );
}
