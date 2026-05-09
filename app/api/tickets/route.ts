import { NextResponse } from "next/server";

import { badRequest, jsonError } from "@/lib/api-utils";
import { createTicket } from "@/lib/data-models";
import { appendTicket, createUniqueTicketCode } from "@/lib/data-store";
import { notifyTicketCreated } from "@/lib/push-notifications";
import { checkRateLimit, getClientRateLimitKey } from "@/lib/rate-limit";
import { categories } from "@/lib/site-data";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const rateLimit = checkRateLimit({
      key: getClientRateLimitKey(request, "ticket:create"),
      limit: 8,
      windowMs: 60_000,
    });

    if (!rateLimit.ok) {
      return NextResponse.json(
        { message: "Gửi quá nhanh. Vui lòng thử lại sau ít phút." },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfter),
          },
        },
      );
    }

    const body = (await request.json()) as {
      categoryId?: string;
      message?: string;
      isAnonymous?: boolean;
      name?: string;
      unit?: string;
    };
    const message = String(body.message ?? "").trim();
    const categoryId = String(body.categoryId ?? "");

    if (
      !categoryId ||
      !categories.some((category) => category.id === categoryId)
    ) {
      return badRequest("Vui lòng chọn ngành phụ trách hợp lệ.");
    }

    if (!message) {
      return badRequest("Vui lòng nhập nội dung góp ý.");
    }

    const ticket = createTicket({
      ticketCode: await createUniqueTicketCode(),
      categoryId,
      message,
      isAnonymous: Boolean(body.isAnonymous),
      name: String(body.name ?? "").trim(),
      unit: String(body.unit ?? "").trim(),
    });

    await appendTicket(ticket);
    void notifyTicketCreated(ticket).catch((error) => {
      console.error("Không thể gửi thông báo góp ý mới", error);
    });
    return NextResponse.json({ ticket });
  } catch (error) {
    return jsonError(error, "Không thể gửi góp ý.");
  }
}
