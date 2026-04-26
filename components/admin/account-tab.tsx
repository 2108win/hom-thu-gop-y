"use client";

import { KeyRound, LoaderCircle, Save, UserRound } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";
import { toast } from "sonner";

import type { AdminProfile } from "@/components/admin/types";

type AccountTabProps = {
  profile: AdminProfile;
  onProfileChange: (profile: AdminProfile) => void;
  onUnauthorized: () => void;
};

type AdminProfileResponse = {
  admin?: AdminProfile;
  message?: string;
};

export function AccountTab({
  profile,
  onProfileChange,
  onUnauthorized,
}: AccountTabProps) {
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const readErrorMessage = async (response: Response) => {
    try {
      const data = (await response.json()) as AdminProfileResponse;
      return data.message || "Có lỗi xảy ra.";
    } catch {
      return "Có lỗi xảy ra.";
    }
  };

  const resetPasswordFields = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedDisplayName = displayName.trim();
    const trimmedCurrentPassword = currentPassword.trim();
    const trimmedNewPassword = newPassword.trim();
    const trimmedConfirmPassword = confirmPassword.trim();
    const wantsPasswordChange =
      Boolean(trimmedCurrentPassword) ||
      Boolean(trimmedNewPassword) ||
      Boolean(trimmedConfirmPassword);

    setMessage("");
    setError("");

    if (!trimmedDisplayName) {
      const validationMessage = "Vui lòng nhập tên hiển thị.";
      setError(validationMessage);
      toast.error(validationMessage);
      return;
    }

    if (wantsPasswordChange) {
      if (!trimmedCurrentPassword) {
        const validationMessage = "Vui lòng nhập mật khẩu hiện tại.";
        setError(validationMessage);
        toast.error(validationMessage);
        return;
      }
      if (trimmedNewPassword.length < 6) {
        const validationMessage = "Mật khẩu mới cần ít nhất 6 ký tự.";
        setError(validationMessage);
        toast.error(validationMessage);
        return;
      }
      if (trimmedNewPassword !== trimmedConfirmPassword) {
        const validationMessage = "Mật khẩu nhập lại không khớp.";
        setError(validationMessage);
        toast.error(validationMessage);
        return;
      }
    }

    setSaving(true);
    const toastId = toast.loading("Đang cập nhật tài khoản...");

    try {
      const response = await fetch("/api/admin/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: trimmedDisplayName,
          currentPassword: trimmedCurrentPassword,
          newPassword: trimmedNewPassword,
          confirmPassword: trimmedConfirmPassword,
        }),
      });

      if (response.status === 401) {
        onUnauthorized();
        toast.error("Phiên quản trị đã hết hạn.", { id: toastId });
        throw new Error("Phiên quản trị đã hết hạn.");
      }

      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }

      const data = (await response.json()) as AdminProfileResponse;
      if (data.admin) {
        onProfileChange(data.admin);
        setDisplayName(data.admin.displayName);
      }
      resetPasswordFields();
      setMessage("Đã cập nhật tài khoản.");
      toast.success("Đã cập nhật tài khoản.", { id: toastId });
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : "Không thể cập nhật tài khoản.";
      setError(message);
      toast.error(message, { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="shine-card border-border border bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="bg-primary text-primary-foreground rounded-field flex size-10 items-center justify-center">
          <UserRound className="size-5" />
        </div>
        <div>
          <h2 className="text-primary text-base font-semibold uppercase">
            Tài khoản quản trị
          </h2>
          <p className="text-muted-foreground text-xs font-semibold">
            {profile.username}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
        <label className="floating-label">
          <span>Tên đăng nhập</span>
          <input
            value={profile.username}
            readOnly
            placeholder="Tên đăng nhập"
            className="input bg-muted h-10 w-full border p-3 text-sm outline-none"
          />
        </label>

        <label className="floating-label">
          <span>Tên hiển thị</span>
          <input
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="Tên hiển thị"
            className="input bg-muted focus:border-primary h-10 w-full border p-3 text-sm outline-none focus:bg-white"
          />
        </label>

        <div className="md:col-span-2">
          <div className="gold-divider my-1" />
        </div>

        <label className="floating-label">
          <span>Mật khẩu hiện tại</span>
          <input
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            type="password"
            autoComplete="current-password"
            placeholder="Mật khẩu hiện tại"
            className="input bg-muted focus:border-primary h-10 w-full border p-3 text-sm outline-none focus:bg-white"
          />
        </label>

        <label className="floating-label">
          <span>Mật khẩu mới</span>
          <input
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            type="password"
            autoComplete="new-password"
            placeholder="Mật khẩu mới"
            className="input bg-muted focus:border-primary h-10 w-full border p-3 text-sm outline-none focus:bg-white"
          />
        </label>

        <label className="floating-label md:col-span-2">
          <span>Nhập lại mật khẩu mới</span>
          <input
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            type="password"
            autoComplete="new-password"
            placeholder="Nhập lại mật khẩu mới"
            className="input bg-muted focus:border-primary h-10 w-full border p-3 text-sm outline-none focus:bg-white"
          />
        </label>

        {(message || error) && (
          <p
            className={`rounded-field border p-3 text-sm font-bold md:col-span-2 ${
              error
                ? "border-red-100 bg-red-50 text-red-700"
                : "border-green-100 bg-green-50 text-green-700"
            }`}
          >
            {error || message}
          </p>
        )}

        <div className="flex justify-end md:col-span-2">
          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary focus-lift gap-2 px-5 font-semibold uppercase disabled:opacity-70"
          >
            {saving ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : newPassword || confirmPassword || currentPassword ? (
              <KeyRound className="size-4" />
            ) : (
              <Save className="size-4" />
            )}
            {saving ? "Đang lưu" : "Lưu tài khoản"}
          </button>
        </div>
      </form>
    </section>
  );
}
