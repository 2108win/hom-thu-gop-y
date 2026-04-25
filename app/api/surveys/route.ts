import { NextResponse } from "next/server";

import { jsonError } from "@/lib/api-utils";
import { getOpenManagedSurveys } from "@/lib/google-sheets-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const surveys = await getOpenManagedSurveys();
    return NextResponse.json({ surveys });
  } catch (error) {
    return jsonError(error, "Không thể tải danh sách khảo sát.");
  }
}
