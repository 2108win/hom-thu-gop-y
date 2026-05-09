import { NextResponse } from "next/server";

import { jsonError } from "@/lib/api-utils";
import { getAdminAccounts, getManagedListeners } from "@/lib/data-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const accounts = await getAdminAccounts();
    const linkedListenerIds = new Set(
      accounts
        .filter((account) => account.is_enabled && account.role === "listener")
        .map((account) => account.listener_id)
        .filter(Boolean),
    );

    const listeners = (await getManagedListeners())
      .filter((listener) => listener.is_enabled)
      .sort((a, b) => a.order - b.order)
      .map((listener) => ({
        ...listener,
        has_linked_account: linkedListenerIds.has(listener.id),
      }));

    return NextResponse.json({ listeners });
  } catch (error) {
    return jsonError(error, "Không thể tải người phụ trách.");
  }
}
