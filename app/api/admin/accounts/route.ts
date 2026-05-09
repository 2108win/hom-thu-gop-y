import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { adminCookieName, getAdminSession } from "@/lib/admin-auth";
import { badRequest, jsonError } from "@/lib/api-utils";
import { createManagedAdminAccount } from "@/lib/data-models";
import {
  appendAdminAccount,
  getAdminAccount,
  getAdminAccounts,
  getManagedListeners,
  patchManagedListener,
  patchAdminAccount,
} from "@/lib/data-store";
import { categories } from "@/lib/site-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AccountBody = {
  username?: unknown;
  password?: unknown;
  displayName?: unknown;
  role?: unknown;
  listenerId?: unknown;
  email?: unknown;
  phone?: unknown;
  rank?: unknown;
  position?: unknown;
  unit?: unknown;
  assignedCategories?: unknown;
  isEnabled?: unknown;
};

async function requireAdminAccount() {
  const cookieStore = await cookies();
  const session = getAdminSession(cookieStore.get(adminCookieName)?.value);
  if (!session) {
    return null;
  }

  const account = await getAdminAccount(session.user);
  if (!account?.is_enabled || account.role === "listener") {
    return null;
  }

  return account;
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

async function accountPayload(account: Awaited<ReturnType<typeof getAdminAccounts>>[number]) {
  const listener = account.listener_id
    ? (await getManagedListeners()).find(
        (item) => item.id === account.listener_id,
      )
    : null;

  return {
    username: account.username,
    display_name: account.display_name,
    role: account.role === "listener" ? "listener" : "admin",
    listener_id: account.listener_id ?? "",
    email: account.email ?? "",
    phone: account.phone ?? "",
    rank: account.rank ?? "",
    position: account.position ?? "",
    unit: account.unit ?? "",
    assigned_categories: listener?.assigned_categories ?? [],
    is_enabled: account.is_enabled,
    updated_at: account.updated_at,
  };
}

function hasLinkedListenerConflict(
  accounts: Awaited<ReturnType<typeof getAdminAccounts>>,
  listenerId: string,
  ignoreUsername?: string,
) {
  if (!listenerId) {
    return false;
  }

  return accounts.some(
    (account) =>
      account.listener_id === listenerId &&
      (!ignoreUsername || account.username !== ignoreUsername),
  );
}

export async function GET() {
  if (!(await requireAdminAccount())) {
    return NextResponse.json({ message: "Không có quyền quản lý tài khoản." }, { status: 403 });
  }

  try {
    const accounts = await getAdminAccounts();
    return NextResponse.json({
      accounts: await Promise.all(accounts.map(accountPayload)),
    });
  } catch (error) {
    return jsonError(error, "Không thể tải danh sách tài khoản.");
  }
}

export async function POST(request: Request) {
  if (!(await requireAdminAccount())) {
    return NextResponse.json({ message: "Không có quyền quản lý tài khoản." }, { status: 403 });
  }

  try {
    const body = (await request.json()) as AccountBody;
    const username = String(body.username ?? "").trim();
    const password = String(body.password ?? "").trim();
    const displayName = String(body.displayName ?? "").trim();
    const role = body.role === "listener" ? "listener" : "admin";
    const listenerId = String(body.listenerId ?? "").trim();

    if (!username) {
      return badRequest("Vui lòng nhập tên đăng nhập.");
    }
    if (!password || password.length < 6) {
      return badRequest("Mật khẩu cần ít nhất 6 ký tự.");
    }
    if (!displayName) {
      return badRequest("Vui lòng nhập tên hiển thị.");
    }
    if (role === "listener") {
      if (!listenerId) {
        return badRequest("Vui lòng liên kết người phụ trách.");
      }
      const listeners = await getManagedListeners();
      if (!listeners.some((listener) => listener.id === listenerId)) {
        return badRequest("Người phụ trách liên kết không hợp lệ.");
      }
      const accounts = await getAdminAccounts();
      if (hasLinkedListenerConflict(accounts, listenerId)) {
        return badRequest("Người phụ trách này đã có tài khoản liên kết.");
      }
    }
    if (await getAdminAccount(username)) {
      return badRequest("Tên đăng nhập đã tồn tại.");
    }

    const account = createManagedAdminAccount({
      username,
      password,
      displayName,
      role,
      listenerId: role === "listener" ? listenerId : "",
      email: String(body.email ?? ""),
      phone: String(body.phone ?? ""),
      rank: String(body.rank ?? ""),
      position: String(body.position ?? ""),
      unit: String(body.unit ?? ""),
      isEnabled: typeof body.isEnabled === "boolean" ? body.isEnabled : true,
    });

    await appendAdminAccount(account);
    return NextResponse.json({ account: await accountPayload(account) });
  } catch (error) {
    return jsonError(error, "Không thể tạo tài khoản.");
  }
}

export async function PATCH(request: Request) {
  if (!(await requireAdminAccount())) {
    return NextResponse.json({ message: "Không có quyền quản lý tài khoản." }, { status: 403 });
  }

  try {
    const body = (await request.json()) as AccountBody;
    const username = String(body.username ?? "").trim();
    if (!username) {
      return badRequest("Thiếu tên đăng nhập cần cập nhật.");
    }

    const patch: Parameters<typeof patchAdminAccount>[1] = {};
    if (typeof body.displayName === "string" && body.displayName.trim()) {
      patch.display_name = body.displayName.trim();
    }
    if (typeof body.password === "string" && body.password.trim()) {
      if (body.password.trim().length < 6) {
        return badRequest("Mật khẩu cần ít nhất 6 ký tự.");
      }
      patch.password = body.password.trim();
    }
    if (body.role === "admin" || body.role === "listener") {
      patch.role = body.role;
    }
    if (typeof body.listenerId === "string") {
      patch.listener_id = body.listenerId.trim();
    }
    if (typeof body.email === "string") patch.email = body.email.trim();
    if (typeof body.phone === "string") patch.phone = body.phone.trim();
    if (typeof body.rank === "string") patch.rank = body.rank.trim();
    if (typeof body.position === "string") patch.position = body.position.trim();
    if (typeof body.unit === "string") patch.unit = body.unit.trim();
    if (typeof body.isEnabled === "boolean") patch.is_enabled = body.isEnabled;

    if (patch.role === "admin") {
      patch.listener_id = "";
    }

    if (patch.role === "listener" || (typeof body.listenerId === "string" && patch.role !== "admin")) {
      const listenerId = (patch.listener_id ?? "").trim();
      if (!listenerId) {
        return badRequest("Tài khoản người phụ trách cần liên kết người phụ trách.");
      }
      const listeners = await getManagedListeners();
      if (!listeners.some((listener) => listener.id === listenerId)) {
        return badRequest("Người phụ trách liên kết không hợp lệ.");
      }
      const accounts = await getAdminAccounts();
      if (hasLinkedListenerConflict(accounts, listenerId, username)) {
        return badRequest("Người phụ trách này đã có tài khoản liên kết.");
      }
    }

    const updated = await patchAdminAccount(username, patch);
    if (!updated) {
      return NextResponse.json({ message: "Không tìm thấy tài khoản." }, { status: 404 });
    }

    if (updated.role === "listener" && updated.listener_id) {
      const assignedCategories = cleanAssignedCategories(body.assignedCategories);
      await patchManagedListener(updated.listener_id, {
        fullname: updated.display_name,
        phone: updated.phone ?? "",
        rank: updated.rank ?? "",
        position: updated.position ?? "",
        is_enabled: updated.is_enabled,
        ...(Array.isArray(body.assignedCategories)
          ? { assigned_categories: assignedCategories }
          : {}),
      });
    }

    return NextResponse.json({ account: await accountPayload(updated) });
  } catch (error) {
    return jsonError(error, "Không thể cập nhật tài khoản.");
  }
}
