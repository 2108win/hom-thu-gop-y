import type { ListenerDraft, SurveyDraft } from "@/components/admin/types";
import { categories } from "@/lib/site-data";

export function formatNow() {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date());
}

export function toDateTimeInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function toSurveyDateTimeInput(
  value: string,
  boundary: "start" | "end",
) {
  const trimmed = value.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return `${trimmed}T${boundary === "start" ? "00:00" : "23:59"}`;
  }

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(trimmed)) {
    return trimmed.slice(0, 16);
  }

  return trimmed;
}

export function defaultSurveyDraft(): SurveyDraft {
  const start = new Date();
  const end = new Date();
  end.setDate(end.getDate() + 7);

  return {
    title: "",
    description: "",
    target_url: "",
    start_date: toDateTimeInput(start),
    end_date: toDateTimeInput(end),
    is_enabled: true,
  };
}

export function defaultListenerDraft(): ListenerDraft {
  return {
    fullname: "",
    rank: "Trực ban",
    position: "",
    phone: "",
    order: 1,
    assigned_categories: categories.map((category) => category.id),
    is_enabled: true,
  };
}

function csvCell(value: string | number | boolean | undefined) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

export function downloadCsv(
  filename: string,
  rows: Array<Array<string | number | boolean | undefined>>,
) {
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
  const blob = new Blob(["\uFEFF", csv], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
