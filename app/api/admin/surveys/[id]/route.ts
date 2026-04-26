import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { adminCookieName, isValidAdminSession } from "@/lib/admin-auth";
import { badRequest, jsonError } from "@/lib/api-utils";
import {
  isValidSurveyDateTimeRange,
  isValidSurveyUrl,
  type ManagedSurvey,
} from "@/lib/data-models";
import {
  patchManagedSurvey,
  removeManagedSurvey,
} from "@/lib/data-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AdminSurveyRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

async function requireAdmin() {
  const cookieStore = await cookies();
  return isValidAdminSession(cookieStore.get(adminCookieName)?.value);
}

export async function PATCH(
  request: Request,
  { params }: AdminSurveyRouteProps,
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ message: "Chưa đăng nhập." }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = (await request.json()) as Partial<ManagedSurvey>;
    const patch: Partial<ManagedSurvey> = {};

    if (typeof body.title === "string") {
      if (!body.title.trim()) {
        return badRequest("Vui lòng nhập tên khảo sát.");
      }
      patch.title = body.title.trim();
    }
    if (typeof body.description === "string") {
      patch.description = body.description;
    }
    if (typeof body.target_url === "string") {
      if (!isValidSurveyUrl(body.target_url)) {
        return badRequest("Link khảo sát phải là URL http/https hợp lệ.");
      }
      patch.target_url = body.target_url.trim();
    }
    if (typeof body.start_date === "string") {
      patch.start_date = body.start_date;
    }
    if (typeof body.end_date === "string") {
      patch.end_date = body.end_date;
    }
    if (
      patch.start_date &&
      patch.end_date &&
      !isValidSurveyDateTimeRange(patch.start_date, patch.end_date)
    ) {
      return badRequest("Thời gian bắt đầu và kết thúc không hợp lệ.");
    }
    if (typeof body.is_enabled === "boolean") {
      patch.is_enabled = body.is_enabled;
    }

    patch.updated_at = new Intl.DateTimeFormat("vi-VN", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date());

    const survey = await patchManagedSurvey(id, patch);
    if (!survey) {
      return NextResponse.json(
        { message: "Không tìm thấy khảo sát." },
        { status: 404 },
      );
    }

    return NextResponse.json({ survey });
  } catch (error) {
    return jsonError(error, "Không thể cập nhật khảo sát.");
  }
}

export async function DELETE(
  _request: Request,
  { params }: AdminSurveyRouteProps,
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ message: "Chưa đăng nhập." }, { status: 401 });
  }

  try {
    const { id } = await params;
    const deleted = await removeManagedSurvey(id);

    if (!deleted) {
      return NextResponse.json(
        { message: "Không tìm thấy khảo sát." },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error, "Không thể xóa khảo sát.");
  }
}
