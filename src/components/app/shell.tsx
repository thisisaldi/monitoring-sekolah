"use client";

import { ListIcon, MoonIcon, SignOutIcon, SunIcon } from "@phosphor-icons/react";
import Image from "next/image";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

import { Nav } from "./nav";

type ShellUser = { name: string; scope: string; isAdmin: boolean; isCentral: boolean };

function Brand() {
  return (
    <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-5">
      <Image src="/logo.png" alt="Logo Yayasan Hang Tuah" width={36} height={36} priority className="size-9 shrink-0" />
      <div className="leading-tight">
        <p className="text-sm font-semibold text-sidebar-primary">Monitoring Keuangan</p>
        <p className="text-xs text-sidebar-foreground/70">Yayasan Hang Tuah</p>
      </div>
    </div>
  );
}

function toggleTheme() {
  const dark = document.documentElement.classList.toggle("dark");
  try {
    localStorage.setItem("theme", dark ? "dark" : "light");
  } catch {}
}

function ThemeToggle() {
  return (
    <Button variant="ghost" size="icon" aria-label="Ganti tema terang/gelap" onClick={toggleTheme}>
      <SunIcon className="hidden size-4.5 dark:block" />
      <MoonIcon className="size-4.5 dark:hidden" />
    </Button>
  );
}

export function Shell({ user, logout, children }: { user: ShellUser; logout: () => Promise<void>; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[256px_1fr]">
      <div className="hidden bg-sidebar lg:block">
        <aside className="sticky top-0 flex h-dvh flex-col">
          <Brand />
          {/* Only the menu scrolls; the brand header stays put. */}
          <div className="scrollbar-sidebar min-h-0 flex-1 overflow-y-auto">
            <Nav isAdmin={user.isAdmin} isCentral={user.isCentral} />
          </div>
        </aside>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 gap-0 border-none bg-sidebar p-0">
          <SheetTitle className="sr-only">Navigasi</SheetTitle>
          <Brand />
          <div className="scrollbar-sidebar min-h-0 flex-1 overflow-y-auto">
            <Nav isAdmin={user.isAdmin} isCentral={user.isCentral} onNavigate={() => setOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur sm:px-6">
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Buka navigasi" onClick={() => setOpen(true)}>
            <ListIcon className="size-5" />
          </Button>
          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <div className="hidden text-right leading-tight sm:block">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.scope}</p>
            </div>
            <ThemeToggle />
            <form action={logout}>
              <Button variant="ghost" size="icon" type="submit" aria-label="Keluar">
                <SignOutIcon className="size-4.5" />
              </Button>
            </form>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
