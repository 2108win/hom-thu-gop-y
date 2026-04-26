"use client";

import {
  ArrowDown,
  ArrowUp,
  Headphones,
  LoaderCircle,
  Phone,
  Plus,
  RefreshCcw,
  Save,
  Trash2,
} from "lucide-react";
import type { Dispatch, FormEvent, SetStateAction } from "react";

import type {
  DeleteConfirm,
  IsActionPending,
  ListenerDraft,
  ListenerPatch,
} from "@/components/admin/types";
import type { ManagedListener } from "@/lib/data-models";
import { categories } from "@/lib/site-data";

type ListenersTabProps = {
  listenerDraft: ListenerDraft;
  listeners: ManagedListener[];
  isActionPending: IsActionPending;
  setListenerDraft: Dispatch<SetStateAction<ListenerDraft>>;
  onCreateListener: (event: FormEvent<HTMLFormElement>) => void;
  onPatchDraft: (listenerId: string, patch: ListenerPatch) => void;
  onSave: (listener: ManagedListener, actionKey?: string) => void;
  onMove: (listenerId: string, direction: "up" | "down") => void;
  onToggleCategory: (listenerId: string, categoryId: string) => void;
  onToggleDraftCategory: (categoryId: string) => void;
  onDeleteRequest: (target: DeleteConfirm) => void;
};

export function ListenersTab({
  listenerDraft,
  listeners,
  isActionPending,
  setListenerDraft,
  onCreateListener,
  onPatchDraft,
  onSave,
  onMove,
  onToggleCategory,
  onToggleDraftCategory,
  onDeleteRequest,
}: ListenersTabProps) {
  return (
    <section className="space-y-4">
      <form
        onSubmit={onCreateListener}
        className="shine-card border-border border bg-white p-4 shadow-sm"
      >
        <div className="mb-3 flex items-center gap-2">
          <Headphones className="text-primary size-5" />
          <h2 className="text-foreground text-base font-semibold uppercase">
            Thêm người phụ trách
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="floating-label">
            <span>Họ tên người phụ trách</span>
            <input
              value={listenerDraft.fullname}
              onChange={(event) =>
                setListenerDraft((current) => ({
                  ...current,
                  fullname: event.target.value,
                }))
              }
              required
              placeholder="Họ tên người phụ trách"
              className="input bg-muted focus:border-primary h-10 w-full border text-sm outline-none"
            />
          </label>
          <label className="floating-label">
            <span>Số điện thoại</span>
            <input
              value={listenerDraft.phone}
              onChange={(event) =>
                setListenerDraft((current) => ({
                  ...current,
                  phone: event.target.value,
                }))
              }
              required
              placeholder="Số điện thoại"
              className="input bg-muted focus:border-primary h-10 w-full border text-sm outline-none"
            />
          </label>
          <label className="floating-label sm:col-span-2">
            <span>Chức danh/cấp bậc</span>
            <input
              value={listenerDraft.rank}
              onChange={(event) =>
                setListenerDraft((current) => ({
                  ...current,
                  rank: event.target.value,
                }))
              }
              required
              placeholder="Chức danh/cấp bậc"
              className="input bg-muted focus:border-primary h-10 w-full border text-sm outline-none"
            />
          </label>
          <label className="floating-label sm:col-span-2">
            <span>Chức vụ/nhiệm vụ phụ trách</span>
            <textarea
              value={listenerDraft.position}
              onChange={(event) =>
                setListenerDraft((current) => ({
                  ...current,
                  position: event.target.value,
                }))
              }
              required
              rows={3}
              placeholder="Chức vụ/nhiệm vụ phụ trách"
              className="textarea bg-muted focus:border-primary min-h-24 w-full border text-sm outline-none"
            />
          </label>
        </div>

        <div className="border-border/60 rounded-box bg-muted mt-3 border p-3">
          <p className="text-muted-foreground/70 mb-2 text-xs font-semibold tracking-[0.12em] uppercase">
            Nhóm nội dung phụ trách
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {categories.map((category) => (
              <label
                key={category.id}
                className="text-foreground/85 rounded-field flex items-center gap-2 bg-white p-3 text-xs font-bold"
              >
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary size-4 border border-gray-300 outline-none"
                  checked={listenerDraft.assigned_categories.includes(
                    category.id,
                  )}
                  onChange={() => onToggleDraftCategory(category.id)}
                />
                {category.name}
              </label>
            ))}
          </div>
        </div>

        <label className="text-foreground/85 mt-3 flex items-center gap-2 text-sm font-bold">
          <input
            type="checkbox"
            className="checkbox checkbox-primary checkbox-xs border border-gray-300 outline-none"
            checked={listenerDraft.is_enabled}
            onChange={(event) =>
              setListenerDraft((current) => ({
                ...current,
                is_enabled: event.target.checked,
              }))
            }
          />
          Bật hiển thị trên trang góp ý
        </label>

        <button
          disabled={isActionPending("listener:create")}
          className="btn btn-primary focus-lift mt-3 w-full px-4 text-sm font-semibold uppercase sm:w-auto"
        >
          {isActionPending("listener:create") ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <Plus className="size-4" />
          )}
          {isActionPending("listener:create")
            ? "Đang tạo"
            : "Tạo người phụ trách"}
        </button>
      </form>

      {listeners.length === 0 ? (
        <p className="shine-card text-muted-foreground/70 p-6 text-center text-sm font-bold">
          Chưa có người phụ trách nào.
        </p>
      ) : (
        listeners.map((listener, index) => (
          <article
            key={listener.id}
            className="shine-card focus-lift border-border border bg-white p-4 shadow-sm"
          >
            <div className="border-border/60 mb-3 flex flex-col gap-2 border-b pb-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex justify-end gap-1">
                  <button
                    type="button"
                    title="Đưa lên"
                    aria-label="Đưa người phụ trách lên một vị trí"
                    onClick={() => onMove(listener.id, "up")}
                    disabled={
                      index === 0 ||
                      isActionPending(`listener:${listener.id}:move`)
                    }
                    className="btn btn-square btn-outline btn-sm focus-lift border-border bg-white"
                  >
                    {isActionPending(`listener:${listener.id}:move`) ? (
                      <LoaderCircle className="size-4 animate-spin" />
                    ) : (
                      <ArrowUp className="size-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    title="Đưa xuống"
                    aria-label="Đưa người phụ trách xuống một vị trí"
                    onClick={() => onMove(listener.id, "down")}
                    disabled={
                      index === listeners.length - 1 ||
                      isActionPending(`listener:${listener.id}:move`)
                    }
                    className="btn btn-square btn-outline btn-sm focus-lift border-border bg-white"
                  >
                    {isActionPending(`listener:${listener.id}:move`) ? (
                      <LoaderCircle className="size-4 animate-spin" />
                    ) : (
                      <ArrowDown className="size-4" />
                    )}
                  </button>
                </div>
                <span
                  className={`rounded-field w-fit border px-3 py-1 text-xs font-semibold uppercase ${
                    listener.is_enabled
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-border bg-muted text-muted-foreground"
                  }`}
                >
                  {listener.is_enabled ? "Đang hiển thị" : "Đã tắt"}
                </span>
                <span className="rounded-field border-border bg-muted text-muted-foreground w-fit border px-3 py-1 text-xs font-semibold uppercase">
                  Vị trí {index + 1}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <strong className="text-foreground block text-base font-semibold">
                  {listener.rank} {listener.fullname}
                </strong>
                <span className="text-muted-foreground/70 sr-only font-mono text-[11px] font-bold uppercase">
                  {listener.id}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="floating-label">
                <span>Họ tên người phụ trách</span>
                <input
                  value={listener.fullname}
                  onChange={(event) =>
                    onPatchDraft(listener.id, {
                      fullname: event.target.value,
                    })
                  }
                  placeholder="Họ tên người phụ trách"
                  className="input bg-muted focus:border-primary h-10 w-full border text-sm font-bold outline-none"
                />
              </label>
              <label className="floating-label">
                <span>Số điện thoại</span>
                <input
                  value={listener.phone}
                  onChange={(event) =>
                    onPatchDraft(listener.id, {
                      phone: event.target.value,
                    })
                  }
                  placeholder="Số điện thoại"
                  className="input bg-muted focus:border-primary h-10 w-full border text-sm outline-none"
                />
              </label>
              <label className="floating-label sm:col-span-2">
                <span>Chức danh/cấp bậc</span>
                <input
                  value={listener.rank}
                  onChange={(event) =>
                    onPatchDraft(listener.id, {
                      rank: event.target.value,
                    })
                  }
                  placeholder="Chức danh/cấp bậc"
                  className="input bg-muted focus:border-primary h-10 w-full border text-sm outline-none"
                />
              </label>

              <label className="floating-label sm:col-span-2">
                <span>Chức vụ/nhiệm vụ phụ trách</span>
                <textarea
                  value={listener.position}
                  onChange={(event) =>
                    onPatchDraft(listener.id, {
                      position: event.target.value,
                    })
                  }
                  rows={3}
                  placeholder="Chức vụ/nhiệm vụ phụ trách"
                  className="textarea bg-muted focus:border-primary min-h-24 w-full border text-sm outline-none"
                />
              </label>
            </div>

            <div className="border-border/60 rounded-box bg-muted mt-3 border p-3">
              <p className="text-muted-foreground/70 mb-2 text-xs font-semibold tracking-[0.12em] uppercase">
                Nhóm nội dung phụ trách
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {categories.map((category) => (
                  <label
                    key={category.id}
                    className="text-foreground/85 rounded-field flex items-center gap-2 bg-white p-3 text-xs font-bold"
                  >
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary size-4 outline-none"
                      checked={listener.assigned_categories.includes(
                        category.id,
                      )}
                      onChange={() =>
                        onToggleCategory(listener.id, category.id)
                      }
                    />
                    {category.name}
                  </label>
                ))}
              </div>
            </div>

            <label className="text-foreground/85 mt-3 flex items-center gap-2 text-sm font-bold">
              <input
                type="checkbox"
                className="checkbox checkbox-primary checkbox-xs border border-gray-300 outline-none"
                checked={listener.is_enabled}
                onChange={(event) =>
                  onPatchDraft(listener.id, {
                    is_enabled: event.target.checked,
                  })
                }
              />
              Bật hiển thị trên trang góp ý
            </label>

            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <button
                type="button"
                onClick={() => onSave(listener)}
                disabled={isActionPending(`listener:${listener.id}:save`)}
                className="btn btn-primary btn-sm focus-lift px-3 text-xs font-semibold uppercase"
              >
                {isActionPending(`listener:${listener.id}:save`) ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                {isActionPending(`listener:${listener.id}:save`)
                  ? "Đang lưu"
                  : "Lưu"}
              </button>
              <button
                type="button"
                onClick={() =>
                  onSave(
                    {
                      ...listener,
                      is_enabled: !listener.is_enabled,
                    },
                    `listener:${listener.id}:toggle`,
                  )
                }
                disabled={isActionPending(`listener:${listener.id}:toggle`)}
                className="btn btn-accent btn-sm focus-lift border-(--military-medal)/45 px-3 text-xs font-semibold uppercase"
              >
                {isActionPending(`listener:${listener.id}:toggle`) ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <RefreshCcw className="size-4" />
                )}
                {isActionPending(`listener:${listener.id}:toggle`)
                  ? "Đang đổi"
                  : listener.is_enabled
                    ? "Tắt"
                    : "Bật"}
              </button>
              <a
                href={`tel:${listener.phone}`}
                className="btn btn-outline btn-sm focus-lift border-emerald-100 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 uppercase hover:bg-emerald-100"
              >
                <Phone className="size-4" />
                Gọi thử
              </a>
              <button
                type="button"
                onClick={() =>
                  onDeleteRequest({
                    kind: "listener",
                    id: listener.id,
                    title: `${listener.rank} ${listener.fullname}`.trim(),
                  })
                }
                className="btn btn-error btn-sm focus-lift border-red-100 bg-red-50 px-3 text-xs font-semibold text-red-700 uppercase"
              >
                <Trash2 className="size-4" />
                Xóa
              </button>
            </div>
          </article>
        ))
      )}
    </section>
  );
}
