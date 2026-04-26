import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { adminCookieName, isValidAdminSession } from "@/lib/admin-auth";
import { jsonError } from "@/lib/api-utils";
import { getTickets } from "@/lib/data-store";

export const runtime = "nodejs";

export async function GET() {
  const cookieStore = await cookies();
  if (!isValidAdminSession(cookieStore.get(adminCookieName)?.value)) {
    return NextResponse.json({ message: "Chưa đăng nhập." }, { status: 401 });
  }

  try {
    const tickets = await getTickets();
    return NextResponse.json({ tickets });
  } catch (error) {
    return jsonError(error, "Không thể tải danh sách góp ý.");
  }
}
