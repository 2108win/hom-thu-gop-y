import "server-only";

import {
  normalizeTicketCode,
  type StoredSurveyResponse,
  type SurveyAnswer,
} from "@/lib/data-models";
import { createLookupCode } from "@/lib/server-codes";
import { appendRow, cell, deleteRow, readRows } from "./client";
import { surveyHeaders, surveySheetName } from "./schemas";

function surveyResponseToRow(response: StoredSurveyResponse) {
  return [
    response.response_code,
    response.survey_id,
    response.survey_title,
    response.created_at,
    JSON.stringify(response.answers),
  ];
}

function rowToSurveyResponse(row: string[]) {
  let answers: SurveyAnswer[] = [];

  try {
    answers = JSON.parse(cell(row, 4)) as SurveyAnswer[];
  } catch {
    answers = [];
  }

  return {
    response_code: cell(row, 0),
    survey_id: cell(row, 1),
    survey_title: cell(row, 2),
    created_at: cell(row, 3),
    answers,
  } satisfies StoredSurveyResponse;
}

export async function getSurveyResponses() {
  const rows = await readRows(surveySheetName, surveyHeaders);
  return rows
    .slice(1)
    .filter((row) => cell(row, 0))
    .map(rowToSurveyResponse)
    .reverse();
}

export async function appendSurveyResponse(response: StoredSurveyResponse) {
  await appendRow(
    surveySheetName,
    surveyHeaders,
    surveyResponseToRow(response),
  );
}

export async function createUniqueSurveyResponseCode() {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const code = createLookupCode("KS");
    const normalized = normalizeTicketCode(code);
    const rows = await readRows(surveySheetName, surveyHeaders);
    const exists = rows
      .slice(1)
      .some((row) => normalizeTicketCode(cell(row, 0)) === normalized);

    if (!exists) {
      return code;
    }
  }

  throw new Error("Không thể tạo mã phản hồi duy nhất. Vui lòng thử lại.");
}

export async function removeSurveyResponse(responseCode: string) {
  const normalized = normalizeTicketCode(responseCode);
  const rows = await readRows(surveySheetName, surveyHeaders);
  const rowIndex = rows
    .slice(1)
    .findIndex((row) => normalizeTicketCode(cell(row, 0)) === normalized);

  if (rowIndex === -1) {
    return false;
  }

  await deleteRow(surveySheetName, rowIndex + 2);
  return true;
}
