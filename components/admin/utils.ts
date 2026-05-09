import type { ListenerDraft, SurveyDraft } from "@/components/admin/types";
import { categories } from "@/lib/site-data";

const categoryToneClasses = [
  "border-blue-200 bg-blue-50 text-blue-700",
  "border-emerald-200 bg-emerald-50 text-emerald-700",
  "border-rose-200 bg-rose-50 text-rose-700",
  "border-amber-200 bg-amber-50 text-amber-700",
];

export function categoryTone(categoryId: string) {
  const index = categories.findIndex((category) => category.id === categoryId);
  return categoryToneClasses[index >= 0 ? index % categoryToneClasses.length : 0];
}

export function formatNow() {
  return new Date().toISOString();
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
