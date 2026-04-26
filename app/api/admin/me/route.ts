import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  adminCookieName,
  adminSessionMaxAgeSeconds,
  createAdminSessionValue,
  getAdminSession,
} from "@/lib/admin-auth";
import { badRequest, jsonError } from "@/lib/api-utils";
import { getAdminAccount, patchAdminAccount } from "@/lib/data-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AdminProfileBody = {
  displayName?: unknown;
  currentPassword?: unknown;
  newPassword?: unknown;
  confirmPassword?: unknown;
};

async function requireAdminSession() {
  const cookieStore = await cookies();
  return getAdminSession(cookieStore.get(adminCookieName)?.value);
}

function adminPayload(account: { username: string; display_name: string }) {
  return {
    username: account.username,
    displayName: account.display_name,
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
  username: string,
  displayName: string,
) {
  response.cookies.set(
    adminCookieName,
    createAdminSessionValue(username, displayName),
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

    return NextResponse.json({ admin: adminPayload(account) });
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
    const patch: Partial<{ display_name: string; password: string }> = {};

    if (typeof body.displayName === "string") {
      const displayName = body.displayName.trim();
      if (!displayName) {
        return badRequest("Vui lòng nhập tên hiển thị.");
      }
      patch.display_name = displayName;
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

    if (!patch.display_name && !patch.password) {
      return badRequest("Không có thông tin cần cập nhật.");
    }

    const updatedAccount = await patchAdminAccount(account.username, patch);
    if (!updatedAccount) {
      return NextResponse.json(
        { message: "Không tìm thấy tài khoản." },
        { status: 404 },
      );
    }

    const response = NextResponse.json({ admin: adminPayload(updatedAccount) });
    setAdminCookie(
      response,
      updatedAccount.username,
      updatedAccount.display_name,
    );
    return response;
  } catch (error) {
    return jsonError(error, "Không thể cập nhật tài khoản.");
  }
}
