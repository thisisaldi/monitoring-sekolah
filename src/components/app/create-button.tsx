import { PencilSimpleIcon, PlusIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export function CreateButton({ href, label }: { href: string; label: string }) {
  return (
    <Button asChild>
      <Link href={href}>
        <PlusIcon weight="bold" /> {label}
      </Link>
    </Button>
  );
}

export function EditLink({ href, label = "Ubah" }: { href: string; label?: string }) {
  return (
    <Button variant="ghost" size="sm" asChild>
      <Link href={href}>
        <PencilSimpleIcon /> {label}
      </Link>
    </Button>
  );
}
