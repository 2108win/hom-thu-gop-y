"use client";

import { LoaderCircle, Trash2 } from "lucide-react";

import type { DeleteConfirm, IsActionPending } from "@/components/admin/types";

type DeleteDialogProps = {
  target: DeleteConfirm;
  isActionPending: IsActionPending;
  onCancel: () => void;
  onConfirm: () => void;
};

export function DeleteDialog({
  target,
  isActionPending,
  onCancel,
  onConfirm,
}: DeleteDialogProps) {
  const actionKey = `delete:${target.kind}:${target.id}`;
  const pending = isActionPending(actionKey);

  return (
    <div className="modal modal-open" role="alertdialog" aria-modal="true">
      <div className="modal-box">
        <div className="mb-3 flex size-12 items-center justify-center bg-red-50 text-red-700">
          <Trash2 className="size-7" />
        </div>
        <h3 className="text-lg font-semibold uppercase">Xác nhận xóa</h3>
        <p className="text-base-content/70 mt-2 text-sm">
          {`Thao tác này sẽ xóa "${target.title}" khỏi hệ thống quản trị.`}
        </p>
        <div className="modal-action">
          <button
            type="button"
            className="btn btn-outline focus-lift"
            disabled={pending}
            onClick={onCancel}
          >
            Hủy
          </button>
          <button
            type="button"
            className="btn btn-error focus-lift"
            disabled={pending}
            onClick={onConfirm}
          >
            {pending ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Trash2 className="size-4" />
            )}
            {pending ? "Đang xóa" : "Xóa"}
          </button>
        </div>
      </div>
      <button
        type="button"
        className="modal-backdrop"
        aria-label="Đóng"
        onClick={() => {
          if (!pending) {
            onCancel();
          }
        }}
      />
    </div>
  );
}
