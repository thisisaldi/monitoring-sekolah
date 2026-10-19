import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/session";

import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Masuk" };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/dashboard");
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1.1fr]">
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-20">
        <div className="mx-auto w-full max-w-sm">
          <Image src="/logo.png" alt="Logo Yayasan Hang Tuah" width={72} height={72} priority className="mb-8 size-18" />
          <h1 className="text-2xl font-semibold tracking-tight">Masuk</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Gunakan akun yang diberikan administrator yayasan.</p>
          <LoginForm />
        </div>
      </div>
      <div className="relative hidden overflow-hidden bg-sidebar lg:block">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,oklch(0.45_0.12_258/0.55),transparent_55%),radial-gradient(circle_at_10%_90%,oklch(0.35_0.09_230/0.5),transparent_50%)]"
        />
        <div className="relative flex h-full flex-col justify-end p-14 text-sidebar-primary">
          <p className="text-sm text-sidebar-foreground/80">Yayasan Hang Tuah</p>
          <p className="mt-2 max-w-md text-3xl font-semibold leading-tight tracking-tight">
            Monitoring keuangan sekolah binaan, dari cabang sampai pusat.
          </p>
          <p className="mt-4 max-w-sm text-sm text-sidebar-foreground/80">
            RKAS, realisasi, BOS, piutang, rekonsiliasi dan temuan dalam satu tempat.
          </p>
        </div>
      </div>
    </div>
  );
}
