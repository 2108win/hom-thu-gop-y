import { NextResponse } from "next/server";

import { badRequest, jsonError } from "@/lib/api-utils";
import { createTicket } from "@/lib/data-models";
import {
  appendTicket,
  createUniqueTicketCode,
} from "@/lib/google-sheets-store";
import { checkRateLimit, getClientRateLimitKey } from "@/lib/rate-limit";
import { categories } from "@/lib/site-data";

export const runtime = "nodejs";

function getMeaningfulContent(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => {
      const cleaned = line.replace(/^[-•]\s*/, "").trim();
      const fieldMatch = cleaned.match(/^[^:]{2,80}:\s*(.*)$/);
      return fieldMatch ? fieldMatch[1].trim() : cleaned;
    })
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

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
      return badRequest("Vui lòng chọn nhóm nội dung hợp lệ.");
    }

    if (getMeaningfulContent(message).length < 30) {
      return badRequest("Nội dung cần cụ thể hơn trước khi gửi.");
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
    return NextResponse.json({ ticket });
  } catch (error) {
    return jsonError(error, "Không thể gửi góp ý.");
  }
}
