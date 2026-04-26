"use client";

import {
  Download,
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
  onExport: () => void;
  onPatchDraft: (listenerId: string, patch: ListenerPatch) => void;
  onSave: (listener: ManagedListener, actionKey?: string) => void;
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
  onExport,
  onPatchDraft,
  onSave,
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
            className="input input-bordered border-border bg-muted focus:border-primary h-10 w-full text-sm"
          />
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
            className="input input-bordered border-border bg-muted focus:border-primary h-10 w-full text-sm"
          />
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
            className="input input-bordered border-border bg-muted focus:border-primary h-10 w-full text-sm"
          />
          <input
            type="number"
            value={listenerDraft.order}
            onChange={(event) =>
              setListenerDraft((current) => ({
                ...current,
                order: Number(event.target.value) || 0,
              }))
            }
            placeholder="Thứ tự hiển thị"
            className="input input-bordered border-border bg-muted focus:border-primary h-10 w-full text-sm"
          />
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
            className="textarea textarea-bordered border-border bg-muted focus:border-primary min-h-24 w-full text-sm sm:col-span-2"
          />
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
                  className="checkbox checkbox-primary size-4 border border-gray-300"
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
            className="checkbox checkbox-primary checkbox-xs border border-gray-300"
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
          {isActionPending("listener:create") ? "Đang tạo" : "Tạo người phụ trách"}
        </button>
      </form>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onExport}
          className="btn btn-primary focus-lift px-4 text-sm font-semibold uppercase"
        >
          <Download className="size-4" />
          Xuất danh sách
        </button>
      </div>

      {listeners.length === 0 ? (
        <p className="shine-card text-muted-foreground/70 p-6 text-center text-sm font-bold">
          Chưa có người phụ trách nào.
        </p>
      ) : (
        listeners.map((listener) => (
          <article
            key={listener.id}
            className="shine-card focus-lift border-border border bg-white p-4 shadow-sm"
          >
            <div className="border-border/60 mb-3 flex flex-col gap-2 border-b pb-3 sm:flex-row sm:items-start sm:justify-between">
              <span
                className={`rounded-field w-fit border px-3 py-1 text-xs font-semibold uppercase ${
                  listener.is_enabled
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-border bg-muted text-muted-foreground"
                }`}
              >
                {listener.is_enabled ? "Đang hiển thị" : "Đã tắt"}
              </span>
              <div>
                <strong className="text-foreground block text-base font-semibold">
                  {listener.rank} {listener.fullname}
                </strong>
                <span className="text-muted-foreground/70 sr-only font-mono text-[11px] font-bold uppercase">
                  {listener.id}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input
                value={listener.fullname}
                onChange={(event) =>
                  onPatchDraft(listener.id, {
                    fullname: event.target.value,
                  })
                }
                className="input input-bordered border-border bg-muted focus:border-primary h-10 w-full text-sm font-bold"
              />
              <input
                value={listener.rank}
                onChange={(event) =>
                  onPatchDraft(listener.id, {
                    rank: event.target.value,
                  })
                }
                className="input input-bordered border-border bg-muted focus:border-primary h-10 w-full text-sm"
              />
              <input
                value={listener.phone}
                onChange={(event) =>
                  onPatchDraft(listener.id, {
                    phone: event.target.value,
                  })
                }
                className="input input-bordered border-border bg-muted focus:border-primary h-10 w-full text-sm"
              />
              <input
                type="number"
                value={listener.order}
                onChange={(event) =>
                  onPatchDraft(listener.id, {
                    order: Number(event.target.value) || 0,
                  })
                }
                className="input input-bordered border-border bg-muted focus:border-primary h-10 w-full text-sm"
              />
              <textarea
                value={listener.position}
                onChange={(event) =>
                  onPatchDraft(listener.id, {
                    position: event.target.value,
                  })
                }
                rows={3}
                className="textarea textarea-bordered border-border bg-muted focus:border-primary min-h-24 w-full text-sm sm:col-span-2"
              />
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
                      className="checkbox checkbox-primary size-4"
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
                className="checkbox checkbox-primary checkbox-xs border border-gray-300"
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
                className="btn btn-outline btn-sm focus-lift min-h-11 border-emerald-100 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 uppercase hover:bg-emerald-100"
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
                className="btn btn-error btn-sm focus-lift min-h-11 border-red-100 bg-red-50 px-3 text-xs font-semibold text-red-700 uppercase"
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
