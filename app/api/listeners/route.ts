import { NextResponse } from "next/server";

import { jsonError } from "@/lib/api-utils";
import { getManagedListeners } from "@/lib/data-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const listeners = (await getManagedListeners())
      .filter((listener) => listener.is_enabled)
      .sort((a, b) => a.order - b.order);

    return NextResponse.json({ listeners });
  } catch (error) {
    return jsonError(error, "Không thể tải người phụ trách.");
  }
}
