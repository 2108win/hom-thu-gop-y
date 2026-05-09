import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { adminCookieName, getAdminSession } from "@/lib/admin-auth";
import { badRequest, jsonError } from "@/lib/api-utils";
import {
  getAdminAccount,
  getManagedListeners,
  removePushSubscription,
  upsertPushSubscription,
} from "@/lib/data-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PushSubscriptionBody = {
  listenerId?: unknown;
  subscription?: {
    endpoint?: unknown;
    keys?: {
      p256dh?: unknown;
      auth?: unknown;
    };
  };
  endpoint?: unknown;
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

  return account;
}

export async function POST(request: Request) {
  const account = await requireAccount();
  if (!account) {
    return NextResponse.json({ message: "Chưa đăng nhập." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as PushSubscriptionBody;
    const requestedListenerId = String(body.listenerId ?? "").trim();
    const listenerId =
      account.role === "listener" ? account.listener_id : requestedListenerId;
    const endpoint = String(body.subscription?.endpoint ?? "").trim();
    const p256dh = String(body.subscription?.keys?.p256dh ?? "").trim();
    const auth = String(body.subscription?.keys?.auth ?? "").trim();

    if (!listenerId) {
      return badRequest("Tài khoản chưa liên kết người phụ trách nhận thông báo.");
    }
    if (!endpoint || !p256dh || !auth) {
      return badRequest("Thiếu thông tin đăng ký thông báo của thiết bị.");
    }

    const listeners = await getManagedListeners();
    const listener = listeners.find((item) => item.id === listenerId);
    if (!listener) {
      return NextResponse.json(
        { message: "Không tìm thấy người phụ trách." },
        { status: 404 },
      );
    }
    if (!listener.is_enabled) {
      return badRequest("Người phụ trách này đang tắt hiển thị.");
    }
    if (!listener.assigned_categories.length) {
      return badRequest("Người phụ trách chưa có nhóm nội dung phụ trách.");
    }

    const now = new Date().toISOString();
    const subscription = await upsertPushSubscription({
      endpoint,
      listener_id: listenerId,
      p256dh,
      auth,
      user_agent: request.headers.get("user-agent") ?? "",
      created_at: now,
      updated_at: now,
    });

    return NextResponse.json({ subscription });
  } catch (error) {
    return jsonError(error, "Không thể bật thông báo cho thiết bị.");
  }
}

export async function DELETE(request: Request) {
  const account = await requireAccount();
  if (!account) {
    return NextResponse.json({ message: "Chưa đăng nhập." }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as PushSubscriptionBody;
    const endpoint = String(body.endpoint ?? body.subscription?.endpoint ?? "").trim();

    if (!endpoint) {
      return badRequest("Thiếu endpoint thông báo cần hủy.");
    }

    await removePushSubscription(endpoint);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error, "Không thể tắt thông báo cho thiết bị.");
  }
}
