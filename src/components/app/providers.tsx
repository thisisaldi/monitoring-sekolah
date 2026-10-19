"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

import { Toaster } from "@/components/ui/sonner";

/** Shows the one-shot "flash" cookie set by a server action (Django messages). */
function FlashToast() {
  const pathname = usePathname();
  useEffect(() => {
    const match = document.cookie.match(/(?:^|; )flash=([^;]*)/);
    if (!match) return;
    document.cookie = "flash=; Max-Age=0; path=/";
    toast.success(decodeURIComponent(match[1]));
  }, [pathname]);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster position="top-right" />
      <FlashToast />
    </>
  );
}
