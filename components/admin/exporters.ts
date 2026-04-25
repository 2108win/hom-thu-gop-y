import type {
  ManagedListener,
  ManagedSurvey,
  StoredTicket,
} from "@/lib/data-models";
import { isSurveyOpen } from "@/lib/data-models";
import { categories } from "@/lib/site-data";
import { downloadCsv } from "./utils";

export function exportTickets(tickets: StoredTicket[]) {
  downloadCsv("hom-thu-gop-y.csv", [
    [
      "Ma phieu",
      "Thoi gian",
      "Trang thai",
      "Nhom noi dung",
      "An danh",
      "Ho ten",
      "Don vi",
      "Noi dung",
      "Phan hoi",
      "Nguoi xu ly",
      "Thoi gian xu ly",
    ],
    ...tickets.map((ticket) => [
      ticket.ticket_code,
      ticket.created_at,
      ticket.status === "done" ? "Da xu ly" : "Dang cho",
      ticket.category,
      ticket.is_anonymous ? "Co" : "Khong",
      ticket.name ?? "",
      ticket.unit ?? "",
      ticket.message,
      ticket.admin_reply ?? "",
      ticket.replied_by ?? "",
      ticket.replied_at ?? "",
    ]),
  ]);
}

export function exportSurveys(surveys: ManagedSurvey[]) {
  downloadCsv("danh-sach-khao-sat.csv", [
    [
      "Ma khao sat",
      "Ten khao sat",
      "Mo ta",
      "Link dich",
      "Thoi gian bat dau",
      "Thoi gian ket thuc",
      "Trang thai",
      "Dang mo",
    ],
    ...surveys.map((survey) => [
      survey.id,
      survey.title,
      survey.description,
      survey.target_url,
      survey.start_date,
      survey.end_date,
      survey.is_enabled ? "Bat" : "Tat",
      isSurveyOpen(survey) ? "Dang mo" : "Khong hien thi",
    ]),
  ]);
}

export function exportListeners(listeners: ManagedListener[]) {
  downloadCsv("bo-phan-tiep-nhan.csv", [
    [
      "Ma",
      "Ten hien thi",
      "Cap bac/chuc danh",
      "Nhiem vu",
      "So dien thoai",
      "Thu tu",
      "Nhom phu trach",
      "Trang thai",
    ],
    ...listeners.map((listener) => [
      listener.id,
      listener.fullname,
      listener.rank,
      listener.position,
      listener.phone,
      listener.order,
      listener.assigned_categories
        .map(
          (categoryId) =>
            categories.find((category) => category.id === categoryId)?.name ??
            categoryId,
        )
        .join("; "),
      listener.is_enabled ? "Bat" : "Tat",
    ]),
  ]);
}
