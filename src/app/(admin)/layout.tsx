import { requireAdminPage } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

export default async function AdminRouteGroupLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPage();
  return children;
}
