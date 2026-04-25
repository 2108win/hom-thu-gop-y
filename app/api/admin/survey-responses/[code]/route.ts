import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { adminCookieName, isValidAdminSession } from "@/lib/admin-auth";
import { jsonError } from "@/lib/api-utils";
import { removeSurveyResponse } from "@/lib/google-sheets-store";

export const runtime = "nodejs";

type AdminSurveyResponseRouteProps = {
  params: Promise<{
    code: string;
  }>;
};

export async function DELETE(
  _request: Request,
  { params }: AdminSurveyResponseRouteProps,
) {
  const cookieStore = await cookies();
  if (!isValidAdminSession(cookieStore.get(adminCookieName)?.value)) {
    return NextResponse.json({ message: "Chưa đăng nhập." }, { status: 401 });
  }

  try {
    const { code } = await params;
    const deleted = await removeSurveyResponse(code);

    if (!deleted) {
      return NextResponse.json(
        { message: "Không tìm thấy phản hồi." },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error, "Không thể xóa phản hồi khảo sát.");
  }
}
