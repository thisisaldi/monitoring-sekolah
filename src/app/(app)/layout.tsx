import { logout } from "@/app/auth-actions";
import { Shell } from "@/components/app/shell";
import { isAdmin, isCentral } from "@/lib/auth/authz";
import { requireUser } from "@/lib/auth/guards";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();
  const scope =
    user.role === "ADMIN" ? "Admin, semua cabang" : user.role === "CENTRAL" ? "Pusat, semua cabang" : (user.branchName ?? "Cabang");
  return (
    <Shell user={{ name: user.name, scope, isAdmin: isAdmin(user), isCentral: isCentral(user) }} logout={logout}>
      {children}
    </Shell>
  );
}
