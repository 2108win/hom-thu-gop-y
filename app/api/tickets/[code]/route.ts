import { NextResponse } from "next/server";

import { jsonError } from "@/lib/api-utils";
import { findTicket } from "@/lib/data-store";
import { checkRateLimit, getClientRateLimitKey } from "@/lib/rate-limit";

export const runtime = "nodejs";

type TicketRouteProps = {
  params: Promise<{
    code: string;
  }>;
};

export async function GET(request: Request, { params }: TicketRouteProps) {
  try {
    const rateLimit = checkRateLimit({
      key: getClientRateLimitKey(request, "ticket:lookup"),
      limit: 24,
      windowMs: 60_000,
    });

    if (!rateLimit.ok) {
      return NextResponse.json(
        { message: "Tra cứu quá nhanh. Vui lòng thử lại sau ít phút." },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfter),
          },
        },
      );
    }

    const { code } = await params;
    const ticket = await findTicket(code);

    if (!ticket) {
      return NextResponse.json(
        { message: "Không tìm thấy mã phiếu." },
        { status: 404 },
      );
    }

    return NextResponse.json({ ticket });
  } catch (error) {
    return jsonError(error, "Không thể tra cứu góp ý.");
  }
}
