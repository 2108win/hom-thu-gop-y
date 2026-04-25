import { AdminLogin } from "@/components/admin-login";
import { ensureAdminAccountsSheet } from "@/lib/google-sheets-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await ensureAdminAccountsSheet().catch(() => undefined);

  return <AdminLogin />;
}
