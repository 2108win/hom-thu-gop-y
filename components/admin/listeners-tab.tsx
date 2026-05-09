"use client";

import {
  ArrowDown,
  ArrowUp,
  Bell,
  BadgeCheck,
  Headphones,
  LoaderCircle,
  Pencil,
  Phone,
  Plus,
  RefreshCcw,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { useState, type Dispatch, type FormEvent, type SetStateAction } from "react";

import type {
  DeleteConfirm,
  IsActionPending,
  ListenerDraft,
} from "@/components/admin/types";
import { categoryTone } from "@/components/admin/utils";
import type { ManagedListener } from "@/lib/data-models";
import { categories } from "@/lib/site-data";

type ListenersTabProps = {
  listenerDraft: ListenerDraft;
  listeners: ManagedListener[];
  isActionPending: IsActionPending;
  setListenerDraft: Dispatch<SetStateAction<ListenerDraft>>;
  onCreateListener: (event: FormEvent<HTMLFormElement>) => void;
  onSave: (listener: ManagedListener, actionKey?: string) => Promise<boolean>;
  onMove: (listenerId: string, direction: "up" | "down") => void;
  onToggleDraftCategory: (categoryId: string) => void;
  onEnablePush: (listener: ManagedListener) => void;
  onDeleteRequest: (target: DeleteConfirm) => void;
};

export function ListenersTab({
  listenerDraft,
  listeners,
  isActionPending,
  setListenerDraft,
  onCreateListener,
  onSave,
  onMove,
  onToggleDraftCategory,
  onEnablePush,
  onDeleteRequest,
}: ListenersTabProps) {
  const [editingListenerDraft, setEditingListenerDraft] =
    useState<ManagedListener | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const editingListener = editingListenerDraft;
  const filteredListeners =
    categoryFilter === "all"
      ? listeners
      : listeners.filter((listener) =>
          listener.assigned_categories.includes(categoryFilter),
        );

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
                  className="checkbox checkbox-primary size-4 outline-none"
                  checked={listenerDraft.assigned_categories.includes(category.id)}
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
          type="submit"
          disabled={isActionPending("listener:create")}
          className="btn btn-primary mt-3 focus-lift gap-2 px-4 text-sm font-semibold uppercase"
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

      <div className="shine-card border-border border bg-white p-3 shadow-sm">
        <p className="text-muted-foreground/70 mb-2 text-xs font-semibold tracking-[0.12em] uppercase">
          Lọc theo nhóm nội dung phụ trách
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategoryFilter("all")}
            className={`btn btn-sm px-3 text-xs font-semibold uppercase ${
              categoryFilter === "all" ? "btn-primary" : "btn-outline"
            }`}
          >
            Tất cả ({listeners.length})
          </button>
          {categories.map((category) => {
            const count = listeners.filter((listener) =>
              listener.assigned_categories.includes(category.id),
            ).length;

            return (
              <button
                key={category.id}
                type="button"
                onClick={() => setCategoryFilter(category.id)}
                className={`btn btn-sm border px-3 text-xs font-semibold uppercase ${
                  categoryFilter === category.id
                    ? categoryTone(category.id)
                    : "btn-outline"
                }`}
              >
                {category.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {filteredListeners.length === 0 ? (
        <p className="shine-card text-muted-foreground/70 p-6 text-center text-sm font-bold">
          Chưa có người phụ trách phù hợp.
        </p>
      ) : (
        filteredListeners.map((listener, index) => (
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
                      index === filteredListeners.length - 1 ||
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
                  {listener.has_linked_account ? (
                    <BadgeCheck className="ml-1 inline size-4 align-[-2px] text-blue-600" />
                  ) : null}
                </strong>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              <div className="rounded-box bg-muted p-3">
                <p className="text-muted-foreground/70 text-[10px] font-semibold uppercase">Số điện thoại</p>
                <p className="font-bold">{listener.phone || "-"}</p>
              </div>
              <div className="rounded-box bg-muted p-3">
                <p className="text-muted-foreground/70 text-[10px] font-semibold uppercase">Chức vụ/nhiệm vụ</p>
                <p className="line-clamp-3 font-bold whitespace-pre-wrap">{listener.position || "-"}</p>
              </div>
            </div>

            <div className="border-border/60 rounded-box bg-muted mt-3 border p-3">
              <p className="text-muted-foreground/70 mb-2 text-xs font-semibold tracking-[0.12em] uppercase">
                Nhóm nội dung phụ trách
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {categories.map((category) => {
                  const checked = listener.assigned_categories.includes(category.id);
                  return (
                    <span
                      key={category.id}
                    className={`rounded-field border p-2 text-xs font-bold ${
                      checked
                        ? categoryTone(category.id)
                        : "border-transparent bg-white/50 text-muted-foreground/70"
                    }`}
                    >
                      {category.name}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
              <button
                type="button"
                onClick={() => {
                  setEditingListenerDraft({
                    ...listener,
                    assigned_categories: [...listener.assigned_categories],
                  });
                }}
                className="btn btn-primary btn-sm focus-lift px-3 text-xs font-semibold uppercase"
              >
                <Pencil className="size-4" />
                Chỉnh sửa
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
                onClick={() => onEnablePush(listener)}
                disabled={isActionPending(`listener:${listener.id}:push`)}
                className="btn btn-outline btn-sm focus-lift border-sky-100 bg-sky-50 px-3 text-xs font-semibold text-sky-700 uppercase hover:bg-sky-100"
              >
                {isActionPending(`listener:${listener.id}:push`) ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Bell className="size-4" />
                )}
                Thông báo
              </button>
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

      {editingListener && (
        <dialog open className="modal modal-open">
          <div className="modal-box border-border bg-base-100 max-h-[90vh] max-w-3xl overflow-y-auto border p-0 shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-base-300 bg-base-100 px-4 py-3">
              <h3 className="text-sm font-semibold uppercase">Chỉnh sửa người phụ trách</h3>
              <button
                type="button"
                onClick={() => {
                  setEditingListenerDraft(null);
                }}
                className="btn btn-sm btn-circle btn-ghost"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-3 p-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="floating-label">
                  <span>Họ tên</span>
                  <input
                    value={editingListener.fullname}
                    onChange={(event) =>
                      setEditingListenerDraft((current) =>
                        current
                          ? { ...current, fullname: event.target.value }
                          : current,
                      )
                    }
                    className="input bg-muted focus:border-primary h-10 w-full border text-sm outline-none"
                  />
                </label>
                <label className="floating-label">
                  <span>Số điện thoại</span>
                  <input
                    value={editingListener.phone}
                    onChange={(event) =>
                      setEditingListenerDraft((current) =>
                        current ? { ...current, phone: event.target.value } : current,
                      )
                    }
                    className="input bg-muted focus:border-primary h-10 w-full border text-sm outline-none"
                  />
                </label>
                <label className="floating-label sm:col-span-2">
                  <span>Cấp bậc/chức danh</span>
                  <input
                    value={editingListener.rank}
                    onChange={(event) =>
                      setEditingListenerDraft((current) =>
                        current ? { ...current, rank: event.target.value } : current,
                      )
                    }
                    className="input bg-muted focus:border-primary h-10 w-full border text-sm outline-none"
                  />
                </label>
                <label className="floating-label sm:col-span-2">
                  <span>Chức vụ/nhiệm vụ</span>
                  <textarea
                    value={editingListener.position}
                    onChange={(event) =>
                      setEditingListenerDraft((current) =>
                        current
                          ? { ...current, position: event.target.value }
                          : current,
                      )
                    }
                    rows={3}
                    className="textarea bg-muted focus:border-primary min-h-24 w-full border text-sm outline-none"
                  />
                </label>
              </div>

              <div className="border-border/60 rounded-box bg-muted border p-3">
                <p className="text-muted-foreground/70 mb-2 text-xs font-semibold tracking-[0.12em] uppercase">
                  Nhóm nội dung phụ trách (chỉ Admin chỉnh sửa)
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {categories.map((category) => (
                    <label
                      key={category.id}
                          className={`rounded-field flex items-center gap-2 border p-3 text-xs font-bold ${categoryTone(category.id)}`}
                    >
                      <input
                        type="checkbox"
                        className="checkbox checkbox-primary size-4 outline-none"
                        checked={editingListener.assigned_categories.includes(category.id)}
                        onChange={() =>
                          setEditingListenerDraft((current) => {
                            if (!current) {
                              return current;
                            }

                            const assigned = current.assigned_categories.includes(
                              category.id,
                            )
                              ? current.assigned_categories.filter(
                                  (item) => item !== category.id,
                                )
                              : [...current.assigned_categories, category.id];

                            return { ...current, assigned_categories: assigned };
                          })
                        }
                      />
                      {category.name}
                    </label>
                  ))}
                </div>
              </div>

              <label className="text-foreground/85 flex items-center gap-2 text-sm font-bold">
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary checkbox-xs border border-gray-300 outline-none"
                  checked={editingListener.is_enabled}
                  onChange={(event) =>
                    setEditingListenerDraft((current) =>
                      current
                        ? { ...current, is_enabled: event.target.checked }
                        : current,
                    )
                  }
                />
                Bật hiển thị trên trang góp ý
              </label>
            </div>

            <div className="sticky bottom-0 flex justify-end gap-2 border-t border-base-300 bg-base-100 px-4 py-3">
              <button
                type="button"
                onClick={() => {
                  setEditingListenerDraft(null);
                }}
                className="btn btn-outline btn-sm px-4 text-xs font-semibold uppercase"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => {
                  void onSave(
                    editingListener,
                    `listener:${editingListener.id}:save`,
                  ).then((saved) => {
                    if (saved) {
                      setEditingListenerDraft(null);
                    }
                  });
                }}
                disabled={isActionPending(`listener:${editingListener.id}:save`)}
                className="btn btn-primary btn-sm px-4 text-xs font-semibold uppercase"
              >
                {isActionPending(`listener:${editingListener.id}:save`) ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                Lưu thay đổi
              </button>
            </div>
          </div>
        </dialog>
      )}
    </section>
  );
}
