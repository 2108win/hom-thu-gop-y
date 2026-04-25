import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { adminCookieName, isValidAdminSession } from "@/lib/admin-auth";
import { jsonError } from "@/lib/api-utils";
import { getSurveyResponses } from "@/lib/google-sheets-store";

export const runtime = "nodejs";

export async function GET() {
  const cookieStore = await cookies();
  if (!isValidAdminSession(cookieStore.get(adminCookieName)?.value)) {
    return NextResponse.json({ message: "Chưa đăng nhập." }, { status: 401 });
  }

  try {
    const responses = await getSurveyResponses();
    return NextResponse.json({ responses });
  } catch (error) {
    return jsonError(error, "Không thể tải phản hồi khảo sát.");
  }
}
