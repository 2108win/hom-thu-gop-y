import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { adminCookieName, getAdminSession } from "@/lib/admin-auth";
import { badRequest, jsonError } from "@/lib/api-utils";
import { createManagedListener } from "@/lib/data-models";
import {
  appendManagedListener,
  getAdminAccount,
  getAdminAccounts,
  getManagedListeners,
} from "@/lib/data-store";
import { createEntityId } from "@/lib/server-codes";
import { categories } from "@/lib/site-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireAdmin() {
  const cookieStore = await cookies();
  const session = getAdminSession(cookieStore.get(adminCookieName)?.value);
  if (!session) {
    return false;
  }

  const account = await getAdminAccount(session.user);
  return Boolean(account?.is_enabled && account.role === "admin");
}

function cleanAssignedCategories(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  const validIds = new Set(categories.map((category) => category.id));
  return value
    .map((item) => String(item).trim())
    .filter(
      (item, index, array) =>
        validIds.has(item) && array.indexOf(item) === index,
    );
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ message: "Chưa đăng nhập." }, { status: 401 });
  }

  try {
    const [listeners, accounts] = await Promise.all([
      getManagedListeners(),
      getAdminAccounts(),
    ]);
    const linkedListenerIds = new Set(
      accounts
        .filter((account) => account.is_enabled && account.role === "listener")
        .map((account) => account.listener_id)
        .filter(Boolean),
    );

    return NextResponse.json({
      listeners: listeners.map((listener) => ({
        ...listener,
        has_linked_account: linkedListenerIds.has(listener.id),
      })),
    });
  } catch (error) {
    return jsonError(error, "Không thể tải người phụ trách.");
  }
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ message: "Chưa đăng nhập." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      fullname?: string;
      rank?: string;
      position?: string;
      phone?: string;
      order?: number;
      assigned_categories?: string[];
      is_enabled?: boolean;
    };
    const fullname = String(body.fullname ?? "").trim();
    const rank = String(body.rank ?? "").trim();
    const position = String(body.position ?? "").trim();
    const phone = String(body.phone ?? "").trim();

    if (!fullname) {
      return badRequest("Vui lòng nhập họ tên người phụ trách.");
    }
    if (!rank) {
      return badRequest("Vui lòng nhập chức danh/cấp bậc hiển thị.");
    }
    if (!position) {
      return badRequest("Vui lòng nhập chức vụ/nhiệm vụ phụ trách.");
    }
    if (!phone) {
      return badRequest("Vui lòng nhập số điện thoại.");
    }

    const listener = createManagedListener({
      id: createEntityId("listener"),
      fullname,
      rank,
      position,
      phone,
      order: Number(body.order) || 0,
      assignedCategories: cleanAssignedCategories(body.assigned_categories),
      isEnabled: body.is_enabled ?? true,
    });

    await appendManagedListener(listener);
    return NextResponse.json({ listener });
  } catch (error) {
    return jsonError(error, "Không thể tạo người phụ trách.");
  }
}
