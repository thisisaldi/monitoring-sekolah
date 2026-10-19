"use client";

import {
  BuildingsIcon,
  CalendarDotsIcon,
  ClockCounterClockwiseIcon,
  ChartBarIcon,
  ClipboardTextIcon,
  CoinsIcon,
  HandCoinsIcon,
  ListMagnifyingGlassIcon,
  ReceiptIcon,
  ScalesIcon,
  SquaresFourIcon,
  StudentIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const GROUPS = [
  { label: null, items: [{ href: "/dashboard", label: "Dashboard", icon: SquaresFourIcon }] },
  {
    label: "Data Keuangan",
    items: [
      { href: "/rkas", label: "RKAS", icon: ClipboardTextIcon },
      { href: "/realisasi/bulanan", label: "Realisasi Bulanan", icon: ChartBarIcon },
      { href: "/realisasi/semester", label: "Realisasi Semester", icon: CalendarDotsIcon },
      { href: "/bos", label: "BOS", icon: CoinsIcon },
      { href: "/piutang", label: "Piutang", icon: HandCoinsIcon },
      { href: "/rekonsiliasi", label: "Rekonsiliasi", icon: ScalesIcon },
      { href: "/temuan", label: "Temuan & Tindak Lanjut", icon: ListMagnifyingGlassIcon },
    ],
  },
  {
    label: "Master Data",
    items: [
      { href: "/sekolah", label: "Sekolah", icon: StudentIcon },
      { href: "/tahun-anggaran", label: "Tahun Anggaran", icon: ReceiptIcon },
    ],
  },
  {
    label: "Pemantauan",
    centralOnly: true,
    items: [{ href: "/riwayat", label: "Riwayat Aktivitas", icon: ClockCounterClockwiseIcon }],
  },
  {
    label: "Administrasi",
    adminOnly: true,
    items: [
      { href: "/admin/pengguna", label: "Pengguna", icon: UsersThreeIcon },
      { href: "/admin/cabang", label: "Cabang", icon: BuildingsIcon },
    ],
  },
];

export function Nav({ isAdmin, isCentral, onNavigate }: { isAdmin: boolean; isCentral: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-6 px-3 py-4" aria-label="Navigasi utama">
      {GROUPS.filter((g) => (!g.adminOnly || isAdmin) && (!g.centralOnly || isCentral)).map((group) => (
        <div key={group.label ?? "root"} className="flex flex-col gap-0.5">
          {group.label && (
            <p className="px-3 pb-1.5 text-xs font-medium text-sidebar-foreground/60">{group.label}</p>
          )}
          {group.items.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                  active
                    ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className="size-4.5 shrink-0" weight={active ? "fill" : "regular"} />
                {label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
