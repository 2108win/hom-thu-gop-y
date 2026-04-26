import { NextResponse } from "next/server";

import { badRequest, jsonError } from "@/lib/api-utils";
import { createSurveyResponse, type SurveyAnswer } from "@/lib/data-models";
import {
  appendSurveyResponse,
  createUniqueSurveyResponseCode,
} from "@/lib/data-store";
import { surveys } from "@/lib/site-data";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      surveyId?: string;
      answers?: SurveyAnswer[];
    };
    const survey = surveys.find((item) => item.id === body.surveyId);

    if (!survey) {
      return badRequest("Khảo sát không hợp lệ.");
    }

    const answers = Array.isArray(body.answers) ? body.answers : [];
    if (answers.length !== survey.questions.length) {
      return badRequest("Vui lòng trả lời đầy đủ câu hỏi khảo sát.");
    }

    const response = createSurveyResponse({
      responseCode: await createUniqueSurveyResponseCode(),
      survey,
      answers,
    });
    await appendSurveyResponse(response);

    return NextResponse.json({ response });
  } catch (error) {
    return jsonError(error, "Không thể gửi kết quả khảo sát.");
  }
}
