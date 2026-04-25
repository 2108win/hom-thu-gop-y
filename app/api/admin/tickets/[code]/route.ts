import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  adminCookieName,
  getAdminSession,
  type AdminSession,
} from "@/lib/admin-auth";
import { jsonError } from "@/lib/api-utils";
import type { StoredTicket } from "@/lib/data-models";
import { patchTicket, removeTicket } from "@/lib/google-sheets-store";

export const runtime = "nodejs";

type AdminTicketRouteProps = {
  params: Promise<{
    code: string;
  }>;
};

async function requireAdmin() {
  const cookieStore = await cookies();
  return getAdminSession(cookieStore.get(adminCookieName)?.value);
}

export async function PATCH(
  request: Request,
  { params }: AdminTicketRouteProps,
) {
  const adminSession = await requireAdmin();
  if (!adminSession) {
    return NextResponse.json({ message: "Chưa đăng nhập." }, { status: 401 });
  }

  try {
    const { code } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    const patch: Partial<StoredTicket> = {};

    if (body.status === "done" || body.status === "pending") {
      patch.status = body.status;
    }
    if (typeof body.admin_reply === "string") {
      patch.admin_reply = body.admin_reply;
      applyReplyMetadata(patch, adminSession);
    }
    if (patch.status === "done") {
      applyReplyMetadata(patch, adminSession);
    }
    if (typeof body.replied_at === "string") {
      patch.replied_at = body.replied_at;
    }

    const ticket = await patchTicket(code, patch);

    if (!ticket) {
      return NextResponse.json(
        { message: "Không tìm thấy phiếu." },
        { status: 404 },
      );
    }

    return NextResponse.json({ ticket });
  } catch (error) {
    return jsonError(error, "Không thể cập nhật phiếu.");
  }
}

export async function DELETE(
  _request: Request,
  { params }: AdminTicketRouteProps,
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ message: "Chưa đăng nhập." }, { status: 401 });
  }

  try {
    const { code } = await params;
    const deleted = await removeTicket(code);

    if (!deleted) {
      return NextResponse.json(
        { message: "Không tìm thấy phiếu." },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error, "Không thể xóa phiếu.");
  }
}

function applyReplyMetadata(
  patch: Partial<StoredTicket>,
  adminSession: AdminSession,
) {
  patch.replied_by = adminSession.displayName;
}
