import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  adminCookieName,
  adminSessionMaxAgeSeconds,
  createAdminSessionValue,
} from "@/lib/admin-auth";
import { jsonError } from "@/lib/api-utils";
import {
  adminAccountStoreName,
  authenticateAdminAccount,
  storageProvider,
} from "@/lib/data-store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      user?: string;
      password?: string;
    };

    const auth = await authenticateAdminAccount(
      String(body.user ?? ""),
      String(body.password ?? ""),
    );

    if (auth.status === "empty") {
      return NextResponse.json(
        {
          message: `Chưa có tài khoản quản trị đang bật trong "${adminAccountStoreName}" của ${storageProvider}.`,
        },
        { status: 401 },
      );
    }

    if (auth.status !== "ok") {
      return NextResponse.json(
        { message: "Sai tài khoản hoặc mật khẩu quản trị." },
        { status: 401 },
      );
    }

    const cookieStore = await cookies();
    cookieStore.set(
      adminCookieName,
      createAdminSessionValue(auth.username, auth.displayName),
      {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: adminSessionMaxAgeSeconds,
      },
    );

    return NextResponse.json({
      ok: true,
      admin: {
        username: auth.username,
        displayName: auth.displayName,
      },
    });
  } catch (error) {
    return jsonError(error, "Không thể đăng nhập quản trị.");
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.set(adminCookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return NextResponse.json({ ok: true });
}
