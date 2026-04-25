import { categories, type Survey } from "@/lib/site-data";

export type TicketStatus = "pending" | "done";

export type StoredTicket = {
  ticket_code: string;
  created_at: string;
  status: TicketStatus;
  message: string;
  category_id: string;
  category: string;
  is_anonymous: boolean;
  name?: string;
  unit?: string;
  admin_reply?: string;
  replied_by?: string;
  replied_at?: string;
  bot_reply: string;
};

export type SurveyAnswer = {
  question: string;
  answer: string;
};

export type StoredSurveyResponse = {
  response_code: string;
  survey_id: string;
  survey_title: string;
  created_at: string;
  answers: SurveyAnswer[];
};

export type ManagedSurvey = {
  id: string;
  title: string;
  description: string;
  target_url: string;
  start_date: string;
  end_date: string;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
};

export type ManagedListener = {
  id: string;
  fullname: string;
  rank: string;
  position: string;
  phone: string;
  order: number;
  assigned_categories: string[];
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
};

export type ManagedAdminAccount = {
  username: string;
  password: string;
  display_name: string;
  is_enabled: boolean;
  updated_at: string;
};

export function formatDateTime() {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date());
}

export function normalizeTicketCode(value: string) {
  return value.trim().replace(/^#/, "").toUpperCase();
}

export function createTicket(input: {
  ticketCode: string;
  categoryId: string;
  message: string;
  isAnonymous: boolean;
  name?: string;
  unit?: string;
}) {
  const category = categories.find((item) => item.id === input.categoryId);

  return {
    ticket_code: input.ticketCode,
    created_at: formatDateTime(),
    status: "pending",
    message: input.message,
    category_id: input.categoryId,
    category: category?.name ?? "",
    is_anonymous: input.isAnonymous,
    name: input.isAnonymous ? "" : input.name,
    unit: input.isAnonymous ? "" : input.unit,
    admin_reply: "",
    replied_by: "",
    replied_at: "",
    bot_reply:
      "Nội dung đã được tiếp nhận. Đồng chí lưu lại mã tra cứu để theo dõi kết quả xử lý.",
  } satisfies StoredTicket;
}

export function createSurveyResponse(input: {
  responseCode: string;
  survey: Survey;
  answers: SurveyAnswer[];
}) {
  return {
    response_code: input.responseCode,
    survey_id: input.survey.id,
    survey_title: input.survey.title,
    created_at: formatDateTime(),
    answers: input.answers,
  } satisfies StoredSurveyResponse;
}

export function createManagedSurvey(input: {
  id: string;
  title: string;
  description: string;
  targetUrl: string;
  startDate: string;
  endDate: string;
  isEnabled?: boolean;
}) {
  const now = formatDateTime();

  return {
    id: input.id,
    title: input.title.trim(),
    description: input.description.trim(),
    target_url: input.targetUrl.trim(),
    start_date: input.startDate,
    end_date: input.endDate,
    is_enabled: input.isEnabled ?? true,
    created_at: now,
    updated_at: now,
  } satisfies ManagedSurvey;
}

export function createManagedListener(input: {
  id: string;
  fullname: string;
  rank: string;
  position: string;
  phone: string;
  order: number;
  assignedCategories: string[];
  isEnabled?: boolean;
}) {
  const now = formatDateTime();

  return {
    id: input.id,
    fullname: input.fullname.trim(),
    rank: input.rank.trim(),
    position: input.position.trim(),
    phone: input.phone.trim(),
    order: input.order,
    assigned_categories: input.assignedCategories,
    is_enabled: input.isEnabled ?? true,
    created_at: now,
    updated_at: now,
  } satisfies ManagedListener;
}

export function createManagedAdminAccount(input: {
  username: string;
  password: string;
  displayName: string;
  isEnabled?: boolean;
}) {
  return {
    username: input.username.trim(),
    password: input.password.trim(),
    display_name: input.displayName.trim(),
    is_enabled: input.isEnabled ?? true,
    updated_at: formatDateTime(),
  } satisfies ManagedAdminAccount;
}

export function isValidSurveyUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

type SurveyDateBoundary = "start" | "end";

export function parseSurveyDateTime(
  value: string,
  boundary: SurveyDateBoundary,
) {
  const trimmed = value.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const time = boundary === "start" ? "00:00:00" : "23:59:59";
    return new Date(`${trimmed}T${time}+07:00`);
  }

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(trimmed)) {
    return new Date(`${trimmed}:00+07:00`);
  }

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(trimmed)) {
    return new Date(`${trimmed}+07:00`);
  }

  return new Date(Number.NaN);
}

export function isValidSurveyDateTimeRange(startDate: string, endDate: string) {
  const start = parseSurveyDateTime(startDate, "start");
  const end = parseSurveyDateTime(endDate, "end");

  return (
    !Number.isNaN(start.getTime()) &&
    !Number.isNaN(end.getTime()) &&
    start <= end
  );
}

export function isSurveyOpen(survey: ManagedSurvey, now = new Date()) {
  if (!survey.is_enabled) {
    return false;
  }

  const start = parseSurveyDateTime(survey.start_date, "start");
  const end = parseSurveyDateTime(survey.end_date, "end");

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return false;
  }

  return now >= start && now <= end;
}
