import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  adminCookieName,
  getAdminSession,
  type AdminSession,
} from "@/lib/admin-auth";
import { jsonError } from "@/lib/api-utils";
import type { ManagedAdminAccount, StoredTicket } from "@/lib/data-models";
import {
  findTicket,
  getAdminAccount,
  getManagedListeners,
  patchTicket,
  removeTicket,
} from "@/lib/data-store";

export const runtime = "nodejs";

type AdminTicketRouteProps = {
  params: Promise<{
    code: string;
  }>;
};

type AuthorizedAccount = ManagedAdminAccount & {
  session: AdminSession;
};

async function requireAccount() {
  const cookieStore = await cookies();
  const session = getAdminSession(cookieStore.get(adminCookieName)?.value);
  if (!session) {
    return null;
  }

  const account = await getAdminAccount(session.user);
  if (!account?.is_enabled) {
    return null;
  }

  return { ...account, session } satisfies AuthorizedAccount;
}

async function canAccessTicket(
  account: AuthorizedAccount,
  ticket: StoredTicket | null,
) {
  if (!ticket) {
    return false;
  }
  if (account.role !== "listener") {
    return true;
  }

  const listeners = await getManagedListeners();
  const listener = listeners.find((item) => item.id === account.listener_id);
  return Boolean(listener?.assigned_categories.includes(ticket.category_id));
}

export async function PATCH(
  request: Request,
  { params }: AdminTicketRouteProps,
) {
  const account = await requireAccount();
  if (!account) {
    return NextResponse.json({ message: "Chưa đăng nhập." }, { status: 401 });
  }

  try {
    const { code } = await params;
    const existingTicket = await findTicket(code);
    if (!(await canAccessTicket(account, existingTicket))) {
      return NextResponse.json(
        { message: "Không có quyền cập nhật phiếu này." },
        { status: 403 },
      );
    }

    const body = (await request.json()) as Record<string, unknown>;
    const patch: Partial<StoredTicket> = {};

    if (body.status === "done" || body.status === "pending") {
      patch.status = body.status;
    }
    if (typeof body.admin_reply === "string") {
      patch.admin_reply = body.admin_reply;
      applyReplyMetadata(patch, account.session);
    }
    if (patch.status === "done") {
      applyReplyMetadata(patch, account.session);
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
  const account = await requireAccount();
  if (!account) {
    return NextResponse.json({ message: "Chưa đăng nhập." }, { status: 401 });
  }
  if (account.role === "listener") {
    return NextResponse.json(
      { message: "Người phụ trách không có quyền xóa phiếu." },
      { status: 403 },
    );
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
