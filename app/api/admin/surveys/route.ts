import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { adminCookieName, isValidAdminSession } from "@/lib/admin-auth";
import { badRequest, jsonError } from "@/lib/api-utils";
import {
  createManagedSurvey,
  isValidSurveyDateTimeRange,
  isValidSurveyUrl,
} from "@/lib/data-models";
import {
  appendManagedSurvey,
  getManagedSurveys,
} from "@/lib/data-store";
import { createEntityId } from "@/lib/server-codes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireAdmin() {
  const cookieStore = await cookies();
  return isValidAdminSession(cookieStore.get(adminCookieName)?.value);
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ message: "Chưa đăng nhập." }, { status: 401 });
  }

  try {
    const surveys = await getManagedSurveys();
    return NextResponse.json({ surveys });
  } catch (error) {
    return jsonError(error, "Không thể tải danh sách khảo sát.");
  }
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ message: "Chưa đăng nhập." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      title?: string;
      description?: string;
      target_url?: string;
      start_date?: string;
      end_date?: string;
      is_enabled?: boolean;
    };
    const title = String(body.title ?? "").trim();
    const targetUrl = String(body.target_url ?? "").trim();
    const startDate = String(body.start_date ?? "").trim();
    const endDate = String(body.end_date ?? "").trim();

    if (!title) {
      return badRequest("Vui lòng nhập tên khảo sát.");
    }
    if (!isValidSurveyUrl(targetUrl)) {
      return badRequest("Link khảo sát phải là URL http/https hợp lệ.");
    }
    if (!isValidSurveyDateTimeRange(startDate, endDate)) {
      return badRequest("Thời gian bắt đầu và kết thúc không hợp lệ.");
    }

    const survey = createManagedSurvey({
      id: createEntityId("survey"),
      title,
      description: String(body.description ?? ""),
      targetUrl,
      startDate,
      endDate,
      isEnabled: body.is_enabled ?? true,
    });

    await appendManagedSurvey(survey);
    return NextResponse.json({ survey });
  } catch (error) {
    return jsonError(error, "Không thể tạo khảo sát.");
  }
}
