"use client";

import { useEffect } from "react";

import {
  CheckCircle2,
  Copy,
  Check,
  LoaderCircle,
  MessageSquareReply,
  Search,
  Trash2,
  Undo2,
} from "lucide-react";

import type {
  DeleteConfirm,
  IsActionPending,
  StatusFilter,
  TicketPatch,
} from "@/components/admin/types";
import { categoryTone, formatNow } from "@/components/admin/utils";
import type { StoredTicket } from "@/lib/data-models";
import { categories } from "@/lib/site-data";

type TicketsTabProps = {
  tickets: StoredTicket[];
  query: string;
  statusFilter: StatusFilter;
  categoryFilter: string;
  allowedCategoryIds?: string[];
  copiedTicketCode: string;
  highlightedTicketCode: string;
  isActionPending: IsActionPending;
  onQueryChange: (value: string) => void;
  onStatusFilterChange: (value: StatusFilter) => void;
  onCategoryFilterChange: (value: string) => void;
  onCopyTicketCode: (ticketCode: string) => void;
  onPatchDraft: (ticketCode: string, patch: TicketPatch) => void;
  onSaveReply: (ticketCode: string) => void;
  onSavePatch: (
    ticketCode: string,
    patch: TicketPatch,
    actionKey?: string,
  ) => void;
  onDeleteRequest: (target: DeleteConfirm) => void;
};

export function TicketsTab({
  tickets,
  query,
  statusFilter,
  categoryFilter,
  allowedCategoryIds = [],
  copiedTicketCode,
  highlightedTicketCode,
  isActionPending,
  onQueryChange,
  onStatusFilterChange,
  onCategoryFilterChange,
  onCopyTicketCode,
  onPatchDraft,
  onSaveReply,
  onSavePatch,
  onDeleteRequest,
}: TicketsTabProps) {
  const isRestrictedCategories = allowedCategoryIds.length > 0;
  const categoryOptions = categories.filter(
    (category) =>
      !isRestrictedCategories || allowedCategoryIds.includes(category.id),
  );

  useEffect(() => {
    if (!highlightedTicketCode) {
      return;
    }

    document
      .getElementById(`ticket-${highlightedTicketCode}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlightedTicketCode, tickets]);

  return (
    <>
      <section
        className={`shine-card mb-3 grid grid-cols-1 gap-2 p-3 shadow-sm ${
          categoryOptions.length > 1
            ? "sm:grid-cols-[1fr_auto_auto]"
            : "sm:grid-cols-[1fr_auto]"
        }`}
      >
        <label className="floating-label relative">
          <span className="[inset-inline-start:2.5rem]">Tìm kiếm</span>
          <Search className="text-muted-foreground/70 pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2" />
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Tìm theo mã, nhóm, nội dung, người gửi..."
            className="input bg-muted focus:border-primary h-10 w-full border pr-3 pl-10 text-sm outline-none focus:bg-white"
          />
        </label>
        <select
          value={statusFilter}
          onChange={(event) =>
            onStatusFilterChange(event.target.value as StatusFilter)
          }
          className="select bg-base-100 h-10 w-full border text-sm font-medium outline-none sm:w-48"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="pending">Đang chờ</option>
          <option value="done">Đã xử lý</option>
        </select>
        {categoryOptions.length > 1 && (
          <select
            value={categoryFilter}
            onChange={(event) => onCategoryFilterChange(event.target.value)}
            className="select bg-base-100 h-10 w-full border text-sm font-medium outline-none sm:w-56"
          >
            <option value="all">Tất cả nhóm nội dung</option>
            {categoryOptions.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        )}
      </section>

      <section className="space-y-3">
        {tickets.length === 0 ? (
          <p className="shine-card text-muted-foreground/70 p-6 text-center text-sm font-bold">
            Chưa có phiếu góp ý phù hợp.
          </p>
        ) : (
          tickets.map((ticket) => (
            <article
              key={ticket.ticket_code}
              id={`ticket-${ticket.ticket_code}`}
              className={`shine-card focus-lift border bg-white p-4 shadow-sm ${
                highlightedTicketCode === ticket.ticket_code
                  ? "border-primary ring-primary/25 ring-2"
                  : "border-border"
              }`}
            >
              <div className="border-border/60 mb-3 flex flex-col gap-2 border-b pb-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="text-destructive block font-mono text-xl">
                      {ticket.ticket_code}
                    </strong>
                    <button
                      type="button"
                      onClick={() => onCopyTicketCode(ticket.ticket_code)}
                      className="btn btn-ghost btn-xs focus-lift px-2"
                      aria-label={
                        copiedTicketCode === ticket.ticket_code
                          ? `Đã copy mã góp ý ${ticket.ticket_code}`
                          : `Copy mã góp ý ${ticket.ticket_code}`
                      }
                      title={
                        copiedTicketCode === ticket.ticket_code
                          ? "Đã copy"
                          : "Copy mã góp ý"
                      }
                    >
                      {copiedTicketCode === ticket.ticket_code ? (
                        <Check className="size-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="size-3.5" />
                      )}
                    </button>
                  </div>
                  <span className="text-muted-foreground/70 text-[11px] font-bold uppercase">
                    {ticket.created_at}
                  </span>
                </div>
                <span
                  className={`rounded-field w-fit border px-3 py-1 text-xs font-semibold uppercase ${
                    ticket.status === "done"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "bg-accent/70 text-accent-foreground border-(--military-medal)/45"
                  }`}
                >
                  {ticket.status === "done" ? "Đã xử lý" : "Đang chờ"}
                </span>
              </div>

              <div className="mb-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
                <div className="bg-muted rounded-box p-3">
                  <p className="text-muted-foreground/70 mb-1 text-[10px] font-semibold tracking-[0.12em] uppercase">
                    Nhóm
                  </p>
                  <p
                    className={`rounded-field inline-flex border px-2 py-1 text-xs font-bold ${categoryTone(ticket.category_id)}`}
                  >
                    {ticket.category || "Chưa phân loại"}
                  </p>
                </div>
                <div className="bg-muted rounded-box p-3">
                  <p className="text-muted-foreground/70 mb-1 text-[10px] font-semibold tracking-[0.12em] uppercase">
                    Người gửi
                  </p>
                  <p className="text-foreground/85 font-bold">
                    {ticket.is_anonymous
                      ? "Ẩn danh"
                      : ticket.name || "Chưa ghi tên"}
                  </p>
                </div>
                <div className="bg-muted rounded-box p-3">
                  <p className="text-muted-foreground/70 mb-1 text-[10px] font-semibold tracking-[0.12em] uppercase">
                    Đơn vị
                  </p>
                  <p className="text-foreground/85 font-bold">
                    {ticket.is_anonymous
                      ? "Ẩn danh"
                      : ticket.unit || "Chưa ghi"}
                  </p>
                </div>
              </div>

              <div className="border-border/60 bg-muted rounded-box mb-3 border p-3">
                <p className="text-muted-foreground/70 mb-1 text-[10px] font-semibold tracking-[0.12em] uppercase">
                  Nội dung gửi
                </p>
                <p className="text-foreground/85 text-sm leading-6 break-words whitespace-pre-wrap">
                  {ticket.message}
                </p>
              </div>

              <label className="floating-label mb-3 block">
                <span>Phản hồi xử lý</span>
                <textarea
                  value={ticket.admin_reply ?? ""}
                  onChange={(event) =>
                    onPatchDraft(ticket.ticket_code, {
                      admin_reply: event.target.value,
                    })
                  }
                  rows={3}
                  placeholder="Nhập nội dung phản hồi để người gửi tra cứu..."
                  className="textarea focus:border-primary min-h-24 w-full resize-none border bg-white text-sm leading-6 outline-none"
                />
              </label>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <button
                  type="button"
                  onClick={() => onSaveReply(ticket.ticket_code)}
                  disabled={isActionPending(
                    `ticket:${ticket.ticket_code}:reply`,
                  )}
                  className="btn btn-primary btn-sm focus-lift gap-2 px-3 text-xs font-semibold uppercase"
                >
                  {isActionPending(`ticket:${ticket.ticket_code}:reply`) ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <MessageSquareReply className="size-4" />
                  )}
                  {isActionPending(`ticket:${ticket.ticket_code}:reply`)
                    ? "Đang lưu"
                    : "Lưu phản hồi"}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onSavePatch(
                      ticket.ticket_code,
                      {
                        status: "done",
                        replied_at: ticket.replied_at || formatNow(),
                      },
                      `ticket:${ticket.ticket_code}:done`,
                    )
                  }
                  disabled={isActionPending(
                    `ticket:${ticket.ticket_code}:done`,
                  )}
                  className="btn btn-success btn-sm focus-lift gap-2 border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 uppercase"
                >
                  {isActionPending(`ticket:${ticket.ticket_code}:done`) ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="size-4" />
                  )}
                  {isActionPending(`ticket:${ticket.ticket_code}:done`)
                    ? "Đang lưu"
                    : "Đã xong"}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onSavePatch(
                      ticket.ticket_code,
                      {
                        status: "pending",
                      },
                      `ticket:${ticket.ticket_code}:pending`,
                    )
                  }
                  disabled={isActionPending(
                    `ticket:${ticket.ticket_code}:pending`,
                  )}
                  className="btn btn-accent btn-sm focus-lift gap-2 border-(--military-medal)/45 px-3 text-xs font-semibold uppercase"
                >
                  {isActionPending(`ticket:${ticket.ticket_code}:pending`) ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <Undo2 className="size-4" />
                  )}
                  {isActionPending(`ticket:${ticket.ticket_code}:pending`)
                    ? "Đang mở"
                    : "Mở lại"}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onDeleteRequest({
                      kind: "ticket",
                      id: ticket.ticket_code,
                      title: ticket.ticket_code,
                    })
                  }
                  className="btn btn-error btn-sm focus-lift gap-2 border-red-100 bg-red-50 px-3 text-xs font-semibold text-red-700 uppercase"
                >
                  <Trash2 className="size-4" />
                  Xóa
                </button>
              </div>
            </article>
          ))
        )}
      </section>
    </>
  );
}
