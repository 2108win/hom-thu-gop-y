import { AdminLogin } from "@/components/admin-login";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  return <AdminLogin />;
}
