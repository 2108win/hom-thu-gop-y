import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  adminCookieName,
  adminSessionMaxAgeSeconds,
  createAdminSessionValue,
  getAdminSession,
} from "@/lib/admin-auth";
import { badRequest, jsonError } from "@/lib/api-utils";
import {
  getAdminAccount,
  getManagedListeners,
  patchManagedListener,
  patchAdminAccount,
} from "@/lib/data-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AdminProfileBody = {
  displayName?: unknown;
  email?: unknown;
  phone?: unknown;
  rank?: unknown;
  position?: unknown;
  unit?: unknown;
  currentPassword?: unknown;
  newPassword?: unknown;
  confirmPassword?: unknown;
};

async function requireAdminSession() {
  const cookieStore = await cookies();
  return getAdminSession(cookieStore.get(adminCookieName)?.value);
}

async function adminPayload(account: {
  username: string;
  display_name: string;
  role?: string;
  listener_id?: string;
  email?: string;
  phone?: string;
  rank?: string;
  position?: string;
  unit?: string;
}) {
  const role = account.role === "listener" ? "listener" : "admin";
  const listenerId = account.listener_id ?? "";
  const assignedCategoryIds =
    role === "listener" && listenerId
      ? (
          (await getManagedListeners()).find(
            (listener) => listener.id === listenerId,
          )?.assigned_categories ?? []
        )
      : [];

  return {
    username: account.username,
    displayName: account.display_name,
    role,
    listenerId,
    email: account.email ?? "",
    phone: account.phone ?? "",
    rank: account.rank ?? "",
    position: account.position ?? "",
    unit: account.unit ?? "",
    assignedCategoryIds,
  };
}

function unauthorized() {
  const response = NextResponse.json(
    { message: "Chưa đăng nhập." },
    { status: 401 },
  );
  response.cookies.set(adminCookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}

function setAdminCookie(
  response: NextResponse,
  account: { username: string; display_name: string; role?: string; listener_id?: string },
) {
  response.cookies.set(
    adminCookieName,
    createAdminSessionValue({
      user: account.username,
      displayName: account.display_name,
      role: account.role === "listener" ? "listener" : "admin",
      listenerId: account.listener_id ?? "",
    }),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: adminSessionMaxAgeSeconds,
    },
  );
}

export async function GET() {
  const session = await requireAdminSession();
  if (!session) {
    return unauthorized();
  }

  try {
    const account = await getAdminAccount(session.user);
    if (!account?.is_enabled) {
      return unauthorized();
    }

    return NextResponse.json({ admin: await adminPayload(account) });
  } catch (error) {
    return jsonError(error, "Không thể tải thông tin tài khoản.");
  }
}

export async function PATCH(request: Request) {
  const session = await requireAdminSession();
  if (!session) {
    return unauthorized();
  }

  try {
    const account = await getAdminAccount(session.user);
    if (!account?.is_enabled) {
      return unauthorized();
    }

    const body = (await request.json()) as AdminProfileBody;
    const patch: Partial<{
      display_name: string;
      password: string;
      email: string;
      phone: string;
      rank: string;
      position: string;
      unit: string;
    }> = {};

    if (typeof body.displayName === "string") {
      const displayName = body.displayName.trim();
      if (!displayName) {
        return badRequest("Vui lòng nhập tên hiển thị.");
      }
      patch.display_name = displayName;
    }
    if (typeof body.email === "string") {
      patch.email = body.email.trim();
    }
    if (typeof body.phone === "string") {
      patch.phone = body.phone.trim();
    }
    if (typeof body.rank === "string") {
      patch.rank = body.rank.trim();
    }
    if (typeof body.position === "string") {
      patch.position = body.position.trim();
    }
    if (typeof body.unit === "string") {
      patch.unit = body.unit.trim();
    }

    const currentPassword =
      typeof body.currentPassword === "string"
        ? body.currentPassword.trim()
        : "";
    const newPassword =
      typeof body.newPassword === "string" ? body.newPassword.trim() : "";
    const confirmPassword =
      typeof body.confirmPassword === "string"
        ? body.confirmPassword.trim()
        : "";
    const wantsPasswordChange =
      Boolean(currentPassword) ||
      Boolean(newPassword) ||
      Boolean(confirmPassword);

    if (wantsPasswordChange) {
      if (!currentPassword) {
        return badRequest("Vui lòng nhập mật khẩu hiện tại.");
      }
      if (account.password !== currentPassword) {
        return badRequest("Mật khẩu hiện tại không đúng.");
      }
      if (!newPassword) {
        return badRequest("Vui lòng nhập mật khẩu mới.");
      }
      if (newPassword.length < 6) {
        return badRequest("Mật khẩu mới cần ít nhất 6 ký tự.");
      }
      if (confirmPassword && newPassword !== confirmPassword) {
        return badRequest("Mật khẩu nhập lại không khớp.");
      }
      patch.password = newPassword;
    }

    if (
      !patch.display_name &&
      !patch.password &&
      patch.email === undefined &&
      patch.phone === undefined &&
      patch.rank === undefined &&
      patch.position === undefined &&
      patch.unit === undefined
    ) {
      return badRequest("Không có thông tin cần cập nhật.");
    }

    if (account.role === "listener" && account.listener_id) {
      await patchManagedListener(account.listener_id, {
        fullname: patch.display_name ?? account.display_name,
        phone: patch.phone ?? account.phone ?? "",
        rank: patch.rank ?? account.rank ?? "",
        position: patch.position ?? account.position ?? "",
      });
    }

    const updatedAccount = await patchAdminAccount(account.username, patch);
    if (!updatedAccount) {
      return NextResponse.json(
        { message: "Không tìm thấy tài khoản." },
        { status: 404 },
      );
    }

    const response = NextResponse.json({ admin: await adminPayload(updatedAccount) });
    setAdminCookie(response, updatedAccount);
    return response;
  } catch (error) {
    return jsonError(error, "Không thể cập nhật tài khoản.");
  }
}
