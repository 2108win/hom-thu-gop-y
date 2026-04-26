import { SurveyList } from "@/components/survey-list";
import type { ManagedSurvey } from "@/lib/data-models";
import { getOpenManagedSurveys } from "@/lib/data-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function SurveyListPage() {
  let surveys: ManagedSurvey[] = [];
  let initialError = "";

  try {
    surveys = await getOpenManagedSurveys();
  } catch (error) {
    initialError =
      error instanceof Error
        ? error.message
        : "Không thể tải danh sách khảo sát.";
  }

  return <SurveyList initialSurveys={surveys} initialError={initialError} />;
}
