import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { adminCookieName, getAdminSession } from "@/lib/admin-auth";
import { badRequest, jsonError } from "@/lib/api-utils";
import type { ManagedListener } from "@/lib/data-models";
import {
  getAdminAccounts,
  getAdminAccount,
  patchManagedListener,
  patchAdminAccount,
  removeManagedListener,
} from "@/lib/data-store";
import { categories } from "@/lib/site-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AdminListenerRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

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

export async function PATCH(
  request: Request,
  { params }: AdminListenerRouteProps,
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ message: "Chưa đăng nhập." }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = (await request.json()) as Partial<ManagedListener>;
    const patch: Partial<ManagedListener> = {};

    if (typeof body.fullname === "string") {
      if (!body.fullname.trim()) {
        return badRequest("Vui lòng nhập họ tên người phụ trách.");
      }
      patch.fullname = body.fullname.trim();
    }
    if (typeof body.rank === "string") {
      if (!body.rank.trim()) {
        return badRequest("Vui lòng nhập chức danh/cấp bậc hiển thị.");
      }
      patch.rank = body.rank.trim();
    }
    if (typeof body.position === "string") {
      if (!body.position.trim()) {
        return badRequest("Vui lòng nhập chức vụ/nhiệm vụ phụ trách.");
      }
      patch.position = body.position.trim();
    }
    if (typeof body.phone === "string") {
      if (!body.phone.trim()) {
        return badRequest("Vui lòng nhập số điện thoại.");
      }
      patch.phone = body.phone.trim();
    }
    if (typeof body.order === "number") {
      patch.order = Number(body.order) || 0;
    }
    if (Array.isArray(body.assigned_categories)) {
      patch.assigned_categories = cleanAssignedCategories(
        body.assigned_categories,
      );
    }
    if (typeof body.is_enabled === "boolean") {
      patch.is_enabled = body.is_enabled;
    }

    patch.updated_at = new Date().toISOString();

    const listener = await patchManagedListener(id, patch);
    if (!listener) {
      return NextResponse.json(
        { message: "Không tìm thấy người phụ trách." },
        { status: 404 },
      );
    }

    const linkedAccount = (await getAdminAccounts()).find(
      (account) => account.listener_id === id,
    );
    if (linkedAccount) {
      await patchAdminAccount(linkedAccount.username, {
        display_name: listener.fullname,
        phone: listener.phone,
        rank: listener.rank,
        position: listener.position,
        is_enabled: listener.is_enabled,
      });
    }

    return NextResponse.json({ listener });
  } catch (error) {
    return jsonError(error, "Không thể cập nhật người phụ trách.");
  }
}

export async function DELETE(
  _request: Request,
  { params }: AdminListenerRouteProps,
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ message: "Chưa đăng nhập." }, { status: 401 });
  }

  try {
    const { id } = await params;
    const deleted = await removeManagedListener(id);

    if (!deleted) {
      return NextResponse.json(
        { message: "Không tìm thấy người phụ trách." },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error, "Không thể xóa người phụ trách.");
  }
}
