"use client";

import {
  CheckCircle2,
  Download,
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
import { formatNow } from "@/components/admin/utils";
import type { StoredTicket } from "@/lib/data-models";

type TicketsTabProps = {
  tickets: StoredTicket[];
  query: string;
  statusFilter: StatusFilter;
  isActionPending: IsActionPending;
  onQueryChange: (value: string) => void;
  onStatusFilterChange: (value: StatusFilter) => void;
  onExport: () => void;
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
  isActionPending,
  onQueryChange,
  onStatusFilterChange,
  onExport,
  onPatchDraft,
  onSaveReply,
  onSavePatch,
  onDeleteRequest,
}: TicketsTabProps) {
  return (
    <>
      <section className="shine-card mb-3 grid grid-cols-1 gap-2 p-3 shadow-sm sm:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <Search className="text-muted-foreground/70 pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Tìm theo mã, nhóm, nội dung, người gửi..."
            className="input input-bordered border-border bg-muted focus:border-primary h-10 w-full pr-3 pl-10 text-sm focus:bg-white"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(event) =>
            onStatusFilterChange(event.target.value as StatusFilter)
          }
          className="select select-bordered bg-base-100 h-10 w-full text-sm font-medium sm:w-48"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="pending">Đang chờ</option>
          <option value="done">Đã xử lý</option>
        </select>
        <button
          type="button"
          onClick={onExport}
          className="btn btn-primary focus-lift gap-2 px-4 text-sm font-semibold uppercase"
        >
          <Download className="size-4" />
          Xuất CSV
        </button>
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
              className="shine-card focus-lift border-border border bg-white p-4 shadow-sm"
            >
              <div className="border-border/60 mb-3 flex flex-col gap-2 border-b pb-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <strong className="text-destructive block font-mono text-xl">
                    {ticket.ticket_code}
                  </strong>
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
                  <p className="text-foreground/85 font-bold">
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

              <label className="mb-3 block">
                <span className="text-muted-foreground/70 mb-1 block text-[10px] font-semibold tracking-[0.12em] uppercase">
                  Phản hồi xử lý
                </span>
                <textarea
                  value={ticket.admin_reply ?? ""}
                  onChange={(event) =>
                    onPatchDraft(ticket.ticket_code, {
                      admin_reply: event.target.value,
                    })
                  }
                  rows={3}
                  placeholder="Nhập nội dung phản hồi để người gửi tra cứu..."
                  className="textarea textarea-bordered border-border focus:border-primary min-h-24 w-full resize-none bg-white text-sm leading-6"
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
