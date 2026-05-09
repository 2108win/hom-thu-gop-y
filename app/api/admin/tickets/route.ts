import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { adminCookieName, getAdminSession } from "@/lib/admin-auth";
import { jsonError } from "@/lib/api-utils";
import {
  getAdminAccount,
  getManagedListeners,
  getTickets,
  getTicketsForCategories,
} from "@/lib/data-store";

export const runtime = "nodejs";

async function requireAdminProfile() {
  const cookieStore = await cookies();
  const session = getAdminSession(cookieStore.get(adminCookieName)?.value);
  if (!session) {
    return null;
  }

  const account = await getAdminAccount(session.user);
  if (!account?.is_enabled) {
    return null;
  }

  return account;
}

export async function GET() {
  try {
    const account = await requireAdminProfile();
    if (!account) {
      return NextResponse.json({ message: "Chưa đăng nhập." }, { status: 401 });
    }

    if (account.role !== "listener") {
      const tickets = await getTickets();
      return NextResponse.json({ tickets });
    }

    const listeners = await getManagedListeners();
    const listener = listeners.find((item) => item.id === account.listener_id);
    const tickets = await getTicketsForCategories(
      listener?.assigned_categories ?? [],
    );
    return NextResponse.json({ tickets });
  } catch (error) {
    return jsonError(error, "Không thể tải danh sách góp ý.");
  }
}
