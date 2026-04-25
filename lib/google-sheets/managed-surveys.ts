import "server-only";

import {
  formatDateTime,
  isSurveyOpen,
  type ManagedSurvey,
} from "@/lib/data-models";
import { appendRow, cell, deleteRow, readRows, updateRow } from "./client";
import { managedSurveyHeaders, surveyListSheetName } from "./schemas";

function managedSurveyToRow(survey: ManagedSurvey) {
  return [
    survey.id,
    survey.title,
    survey.description,
    survey.target_url,
    survey.start_date,
    survey.end_date,
    survey.is_enabled ? "TRUE" : "FALSE",
    survey.created_at,
    survey.updated_at,
  ];
}

function rowToManagedSurvey(row: string[]) {
  return {
    id: cell(row, 0),
    title: cell(row, 1),
    description: cell(row, 2),
    target_url: cell(row, 3),
    start_date: cell(row, 4),
    end_date: cell(row, 5),
    is_enabled: cell(row, 6).toUpperCase() !== "FALSE",
    created_at: cell(row, 7),
    updated_at: cell(row, 8),
  } satisfies ManagedSurvey;
}

export async function getManagedSurveys() {
  const rows = await readRows(surveyListSheetName, managedSurveyHeaders);
  return rows
    .slice(1)
    .filter((row) => cell(row, 0))
    .map(rowToManagedSurvey)
    .reverse();
}

export async function getOpenManagedSurveys() {
  const surveys = await getManagedSurveys();
  return surveys.filter((survey) => isSurveyOpen(survey));
}

export async function appendManagedSurvey(survey: ManagedSurvey) {
  await appendRow(
    surveyListSheetName,
    managedSurveyHeaders,
    managedSurveyToRow(survey),
  );
}

export async function findManagedSurvey(id: string) {
  const rows = await readRows(surveyListSheetName, managedSurveyHeaders);
  const row = rows.slice(1).find((item) => cell(item, 0) === id);
  return row ? rowToManagedSurvey(row) : null;
}

export async function patchManagedSurvey(
  id: string,
  patch: Partial<ManagedSurvey>,
) {
  const rows = await readRows(surveyListSheetName, managedSurveyHeaders);
  const rowIndex = rows.slice(1).findIndex((row) => cell(row, 0) === id);

  if (rowIndex === -1) {
    return null;
  }

  const rowNumber = rowIndex + 2;
  const updated = {
    ...rowToManagedSurvey(rows[rowNumber - 1]),
    updated_at: formatDateTime(),
    ...patch,
  };

  await updateRow(
    surveyListSheetName,
    managedSurveyHeaders,
    rowNumber,
    managedSurveyToRow(updated),
  );

  return updated;
}

export async function removeManagedSurvey(id: string) {
  const rows = await readRows(surveyListSheetName, managedSurveyHeaders);
  const rowIndex = rows.slice(1).findIndex((row) => cell(row, 0) === id);

  if (rowIndex === -1) {
    return false;
  }

  await deleteRow(surveyListSheetName, rowIndex + 2);
  return true;
}
