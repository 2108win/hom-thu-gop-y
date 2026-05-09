import "server-only";

import {
  isSurveyOpen,
  normalizeTicketCode,
  type ManagedAdminAccount,
  type ManagedListener,
  type ManagedPushSubscription,
  type ManagedSurvey,
  type StoredSurveyResponse,
  type StoredTicket,
  type SurveyAnswer,
} from "@/lib/data-models";
import { createLookupCode } from "@/lib/server-codes";

export const adminAccountTableName = "admin_accounts";

type SupabaseErrorBody = {
  message?: string;
  error?: string;
  details?: string;
  hint?: string;
};

type TicketRow = StoredTicket & {
  created_order?: number;
};

type ManagedSurveyRow = ManagedSurvey & {
  created_order?: number;
};

type SurveyResponseRow = Omit<StoredSurveyResponse, "answers"> & {
  answers: SurveyAnswer[] | string | null;
  created_order?: number;
};

type ListenerRow = ManagedListener & {
  created_order?: number;
};

type AdminAccountRow = ManagedAdminAccount & { created_order?: number };

type PushSubscriptionRow = ManagedPushSubscription & { created_order?: number };

export class SupabaseConfigError extends Error {
  constructor(message = "Chưa cấu hình Supabase.") {
    super(message);
    this.name = "SupabaseConfigError";
  }
}

export function isSupabaseConfigured() {
  return Boolean(
    process.env.SUPABASE_URL?.trim() &&
    (process.env.SUPABASE_SECRET_KEY?.trim() ||
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
      process.env.SUPABASE_SERVICE_ROLE?.trim()),
  );
}

export function isSupabaseConfigError(error: unknown) {
  return error instanceof SupabaseConfigError;
}

function getSupabaseConfig() {
  const url = normalizeSupabaseUrl(process.env.SUPABASE_URL);
  const serverKey =
    process.env.SUPABASE_SECRET_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE?.trim();

  if (!url || !serverKey) {
    throw new SupabaseConfigError("Thiếu SUPABASE_URL và SUPABASE_SECRET_KEY.");
  }

  if (serverKey.startsWith("sb_publishable_")) {
    throw new SupabaseConfigError(
      "SUPABASE_SECRET_KEY phải là Secret key hoặc service_role key, không dùng Publishable key.",
    );
  }

  return { url, serverKey };
}

function normalizeSupabaseUrl(value?: string) {
  const trimmed = value?.trim().replace(/\/+$/, "") ?? "";
  return trimmed.replace(/\/rest\/v1$/i, "");
}

function isJwtKey(value: string) {
  return value.startsWith("eyJ");
}

async function supabaseFetch<T>(
  path: string,
  init: RequestInit & { allowEmpty?: boolean } = {},
) {
  const { url, serverKey } = getSupabaseConfig();
  const headers = new Headers(init.headers);
  headers.set("apikey", serverKey);
  if (isJwtKey(serverKey)) {
    headers.set("Authorization", `Bearer ${serverKey}`);
  }
  headers.set("Content-Type", "application/json");

  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    let body: SupabaseErrorBody | null = null;
    try {
      body = (await response.json()) as SupabaseErrorBody;
    } catch {
      body = null;
    }

    const detail = [body?.message, body?.details, body?.hint]
      .filter(Boolean)
      .join(" ");

    if (
      response.status === 404 ||
      detail.toLowerCase().includes("could not find the table")
    ) {
      throw new SupabaseConfigError(
        "Supabase chưa có bảng dữ liệu. Hãy chạy file supabase/schema.sql trong SQL Editor.",
      );
    }

    throw new Error(detail || `Supabase API lỗi ${response.status}.`);
  }

  if (response.status === 204 || init.allowEmpty) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

function eqFilter(column: string, value: string) {
  return `${column}=eq.${encodeURIComponent(value)}`;
}

function databaseTimestamp() {
  return new Date().toISOString();
}

function normalizeAnswers(value: SurveyResponseRow["answers"]) {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string") {
    try {
      return JSON.parse(value) as SurveyAnswer[];
    } catch {
      return [];
    }
  }

  return [];
}

function toSurveyResponse(row: SurveyResponseRow) {
  return {
    response_code: row.response_code,
    survey_id: row.survey_id,
    survey_title: row.survey_title,
    created_at: row.created_at,
    answers: normalizeAnswers(row.answers),
  } satisfies StoredSurveyResponse;
}

export async function getAdminAccounts() {
  return supabaseFetch<AdminAccountRow[]>(
    "admin_accounts?select=*&order=created_order.asc",
  );
}

export async function appendAdminAccount(account: ManagedAdminAccount) {
  await supabaseFetch("admin_accounts", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(account),
    allowEmpty: true,
  });
}

export async function getAdminAccount(username: string) {
  const normalizedUsername = username.trim().toLowerCase();
  if (!normalizedUsername) {
    return null;
  }

  const accounts = await getAdminAccounts();
  return (
    accounts.find(
      (account) => account.username.toLowerCase() === normalizedUsername,
    ) ?? null
  );
}

export async function patchAdminAccount(
  username: string,
  patch: Partial<ManagedAdminAccount>,
) {
  const exactUsername = username.trim();
  if (!exactUsername) {
    return null;
  }

  const rows = await supabaseFetch<AdminAccountRow[]>(
    `admin_accounts?${eqFilter("username", exactUsername)}`,
    {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ ...patch, updated_at: databaseTimestamp() }),
    },
  );

  return rows[0] ?? null;
}

export async function authenticateAdminAccount(
  username: string,
  password: string,
) {
  const normalizedUsername = username.trim().toLowerCase();
  const normalizedPassword = password.trim();

  if (!normalizedUsername || !normalizedPassword) {
    return { status: "invalid" as const };
  }

  const accounts = await getAdminAccounts();

  if (!accounts.some((account) => account.is_enabled)) {
    return { status: "empty" as const };
  }

  const account = accounts.find(
    (item) =>
      item.is_enabled &&
      item.username.toLowerCase() === normalizedUsername &&
      item.password === normalizedPassword,
  );

  if (!account) {
    return { status: "invalid" as const };
  }

  return {
    status: "ok" as const,
    username: account.username,
    displayName: account.display_name,
    role: (account.role === "listener" ? "listener" : "admin") as
      | "admin"
      | "listener",
    listenerId: account.listener_id ?? "",
    email: account.email ?? "",
    phone: account.phone ?? "",
    rank: account.rank ?? "",
    position: account.position ?? "",
    unit: account.unit ?? "",
  };
}

export async function getTickets() {
  const rows = await supabaseFetch<TicketRow[]>(
    "feedback_tickets?select=*&order=created_order.desc",
  );
  return rows.map((row) => ({
    ticket_code: row.ticket_code,
    created_at: row.created_at,
    status: row.status === "done" ? "done" : "pending",
    message: row.message,
    category_id: row.category_id,
    category: row.category,
    is_anonymous: row.is_anonymous,
    name: row.name ?? "",
    unit: row.unit ?? "",
    admin_reply: row.admin_reply ?? "",
    replied_by: row.replied_by ?? "",
    replied_at: row.replied_at ?? "",
    bot_reply: row.bot_reply,
  }));
}

export async function getTicketsForCategories(categoryIds: string[]) {
  const validIds = categoryIds.map((item) => item.trim()).filter(Boolean);
  if (!validIds.length) {
    return [];
  }

  const rows = await supabaseFetch<TicketRow[]>(
    `feedback_tickets?select=*&category_id=in.(${validIds.map(encodeURIComponent).join(",")})&order=created_order.desc`,
  );
  return rows.map((row) => ({
    ticket_code: row.ticket_code,
    created_at: row.created_at,
    status: row.status === "done" ? "done" : "pending",
    message: row.message,
    category_id: row.category_id,
    category: row.category,
    is_anonymous: row.is_anonymous,
    name: row.name ?? "",
    unit: row.unit ?? "",
    admin_reply: row.admin_reply ?? "",
    replied_by: row.replied_by ?? "",
    replied_at: row.replied_at ?? "",
    bot_reply: row.bot_reply,
  }));
}

export async function appendTicket(ticket: StoredTicket) {
  await supabaseFetch("feedback_tickets", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(ticket),
    allowEmpty: true,
  });
}

export async function findTicket(ticketCode: string) {
  const normalized = normalizeTicketCode(ticketCode);
  const rows = await supabaseFetch<TicketRow[]>(
    `feedback_tickets?select=*&${eqFilter("ticket_code", normalized)}&limit=1`,
  );
  return rows[0] ? (rows[0] satisfies StoredTicket) : null;
}

export async function createUniqueTicketCode() {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const code = createLookupCode("GP");
    if (!(await findTicket(code))) {
      return code;
    }
  }

  throw new Error("Không thể tạo mã phiếu duy nhất. Vui lòng thử lại.");
}

export async function patchTicket(
  ticketCode: string,
  patch: Partial<StoredTicket>,
) {
  const normalized = normalizeTicketCode(ticketCode);
  const rows = await supabaseFetch<TicketRow[]>(
    `feedback_tickets?${eqFilter("ticket_code", normalized)}`,
    {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(patch),
    },
  );

  return rows[0] ? (rows[0] satisfies StoredTicket) : null;
}

export async function removeTicket(ticketCode: string) {
  const normalized = normalizeTicketCode(ticketCode);
  const rows = await supabaseFetch<TicketRow[]>(
    `feedback_tickets?select=ticket_code&${eqFilter("ticket_code", normalized)}&limit=1`,
  );
  if (!rows.length) {
    return false;
  }

  await supabaseFetch(
    `feedback_tickets?${eqFilter("ticket_code", normalized)}`,
    {
      method: "DELETE",
      headers: { Prefer: "return=minimal" },
      allowEmpty: true,
    },
  );
  return true;
}

export async function getManagedSurveys() {
  return supabaseFetch<ManagedSurveyRow[]>(
    "managed_surveys?select=*&order=created_order.desc",
  );
}

export async function getOpenManagedSurveys() {
  const surveys = await getManagedSurveys();
  return surveys.filter((survey) => isSurveyOpen(survey));
}

export async function appendManagedSurvey(survey: ManagedSurvey) {
  await supabaseFetch("managed_surveys", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(survey),
    allowEmpty: true,
  });
}

export async function findManagedSurvey(id: string) {
  const rows = await supabaseFetch<ManagedSurveyRow[]>(
    `managed_surveys?select=*&${eqFilter("id", id)}&limit=1`,
  );
  return rows[0] ?? null;
}

export async function patchManagedSurvey(
  id: string,
  patch: Partial<ManagedSurvey>,
) {
  const rows = await supabaseFetch<ManagedSurveyRow[]>(
    `managed_surveys?${eqFilter("id", id)}`,
    {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ ...patch, updated_at: databaseTimestamp() }),
    },
  );
  return rows[0] ?? null;
}

export async function removeManagedSurvey(id: string) {
  const rows = await supabaseFetch<ManagedSurveyRow[]>(
    `managed_surveys?select=id&${eqFilter("id", id)}&limit=1`,
  );
  if (!rows.length) {
    return false;
  }

  await supabaseFetch(`managed_surveys?${eqFilter("id", id)}`, {
    method: "DELETE",
    headers: { Prefer: "return=minimal" },
    allowEmpty: true,
  });
  return true;
}

export async function getSurveyResponses() {
  const rows = await supabaseFetch<SurveyResponseRow[]>(
    "survey_responses?select=*&order=created_order.desc",
  );
  return rows.map(toSurveyResponse);
}

export async function appendSurveyResponse(response: StoredSurveyResponse) {
  await supabaseFetch("survey_responses", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(response),
    allowEmpty: true,
  });
}

export async function createUniqueSurveyResponseCode() {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const code = createLookupCode("KS");
    const normalized = normalizeTicketCode(code);
    const rows = await supabaseFetch<SurveyResponseRow[]>(
      `survey_responses?select=response_code&${eqFilter("response_code", normalized)}&limit=1`,
    );

    if (!rows.length) {
      return code;
    }
  }

  throw new Error("Không thể tạo mã phản hồi duy nhất. Vui lòng thử lại.");
}

export async function removeSurveyResponse(responseCode: string) {
  const normalized = normalizeTicketCode(responseCode);
  const rows = await supabaseFetch<SurveyResponseRow[]>(
    `survey_responses?select=response_code&${eqFilter("response_code", normalized)}&limit=1`,
  );
  if (!rows.length) {
    return false;
  }

  await supabaseFetch(
    `survey_responses?${eqFilter("response_code", normalized)}`,
    {
      method: "DELETE",
      headers: { Prefer: "return=minimal" },
      allowEmpty: true,
    },
  );
  return true;
}

export async function getManagedListeners() {
  const rows = await supabaseFetch<ListenerRow[]>(
    "managed_listeners?select=*&order=created_order.asc",
  );
  return rows.sort((a, b) => a.order - b.order);
}

export async function appendManagedListener(listener: ManagedListener) {
  await supabaseFetch("managed_listeners", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(listener),
    allowEmpty: true,
  });
}

export async function patchManagedListener(
  id: string,
  patch: Partial<ManagedListener>,
) {
  const rows = await supabaseFetch<ListenerRow[]>(
    `managed_listeners?${eqFilter("id", id)}`,
    {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ ...patch, updated_at: databaseTimestamp() }),
    },
  );
  return rows[0] ?? null;
}

export async function removeManagedListener(id: string) {
  const rows = await supabaseFetch<ListenerRow[]>(
    `managed_listeners?select=id&${eqFilter("id", id)}&limit=1`,
  );
  if (!rows.length) {
    return false;
  }

  await supabaseFetch(`managed_listeners?${eqFilter("id", id)}`, {
    method: "DELETE",
    headers: { Prefer: "return=minimal" },
    allowEmpty: true,
  });
  return true;
}

export async function upsertPushSubscription(
  subscription: ManagedPushSubscription,
) {
  const rows = await supabaseFetch<PushSubscriptionRow[]>(
    `push_subscriptions?on_conflict=endpoint`,
    {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify(subscription),
    },
  );
  return rows[0] ?? null;
}

export async function removePushSubscription(endpoint: string) {
  await supabaseFetch(
    `push_subscriptions?${eqFilter("endpoint", endpoint)}`,
    {
      method: "DELETE",
      headers: { Prefer: "return=minimal" },
      allowEmpty: true,
    },
  );
}

export async function getPushSubscriptionsForCategory(categoryId: string) {
  const rows = await supabaseFetch<PushSubscriptionRow[]>(
    `push_subscriptions?select=*,managed_listeners!inner(assigned_categories,is_enabled)&managed_listeners.is_enabled=eq.true&managed_listeners.assigned_categories=cs.{${encodeURIComponent(categoryId)}}`,
  );
  return rows satisfies ManagedPushSubscription[];
}
