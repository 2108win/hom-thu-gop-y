import "server-only";

export const feedbackSheetName =
  process.env.GOOGLE_SHEETS_FEEDBACK_SHEET || "GopY";
export const surveySheetName =
  process.env.GOOGLE_SHEETS_SURVEY_SHEET || "KhaoSat";
export const surveyListSheetName =
  process.env.GOOGLE_SHEETS_SURVEY_LIST_SHEET || "DanhSachKhaoSat";
export const listenerSheetName =
  process.env.GOOGLE_SHEETS_LISTENER_SHEET || "BoPhanTiepNhan";
export const adminAccountSheetName =
  process.env.GOOGLE_SHEETS_ADMIN_SHEET || "TaiKhoanAdmin";

export const ticketHeaders = [
  "ticket_code",
  "created_at",
  "status",
  "category_id",
  "category",
  "is_anonymous",
  "name",
  "unit",
  "message",
  "admin_reply",
  "replied_by",
  "replied_at",
  "bot_reply",
];

export const surveyHeaders = [
  "response_code",
  "survey_id",
  "survey_title",
  "created_at",
  "answers_json",
];

export const managedSurveyHeaders = [
  "id",
  "title",
  "description",
  "target_url",
  "start_date",
  "end_date",
  "is_enabled",
  "created_at",
  "updated_at",
];

export const listenerHeaders = [
  "id",
  "fullname",
  "rank",
  "position",
  "phone",
  "order",
  "assigned_categories",
  "is_enabled",
  "created_at",
  "updated_at",
];

export const adminAccountHeaders = [
  "username",
  "password",
  "display_name",
  "is_enabled",
  "updated_at",
];
