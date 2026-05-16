"use client";

import {
  Bell,
  BellOff,
  KeyRound,
  LoaderCircle,
  Pencil,
  Save,
  Unlink,
  UserRound,
  X,
} from "lucide-react";
import type { FormEvent } from "react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import type { AdminProfile } from "@/components/admin/types";
import { categoryTone } from "@/components/admin/utils";
import type { ManagedListener } from "@/lib/data-models";
import { categories } from "@/lib/site-data";

type AccountTabProps = {
  profile: AdminProfile;
  listeners?: ManagedListener[];
  onProfileChange: (profile: AdminProfile) => void;
  onEnablePush: () => Promise<boolean>;
  onDisablePush: () => Promise<boolean>;
  pushActionPending: boolean;
  onLinkedDataChange?: () => Promise<void>;
  onUnauthorized: () => void;
};

type ManagedAccount = {
  username: string;
  display_name: string;
  role: "admin" | "listener";
  listener_id: string;
  email: string;
  phone: string;
  rank: string;
  position: string;
  unit: string;
  assigned_categories: string[];
  is_enabled: boolean;
};

type AdminProfileResponse = {
  admin?: AdminProfile;
  message?: string;
};

const emptyEditDraft = {
  username: "",
  displayName: "",
  password: "",
  role: "listener" as "admin" | "listener",
  listenerId: "",
  email: "",
  phone: "",
  rank: "",
  position: "",
  unit: "",
  assignedCategories: [] as string[],
  isEnabled: true,
};

function browserSupportsPush() {
  return (
    typeof navigator !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

export function AccountTab({
  profile,
  listeners = [],
  onProfileChange,
  onEnablePush,
  onDisablePush,
  pushActionPending,
  onLinkedDataChange,
  onUnauthorized,
}: AccountTabProps) {
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [email, setEmail] = useState(profile.email ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [rank, setRank] = useState(profile.rank ?? "");
  const [position, setPosition] = useState(profile.position ?? "");
  const [unit, setUnit] = useState(profile.unit ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [accounts, setAccounts] = useState<ManagedAccount[]>([]);
  const [pushSupported] = useState(browserSupportsPush);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [accountDraft, setAccountDraft] = useState({
    username: "",
    password: "",
    displayName: "",
    role: "listener" as "admin" | "listener",
    listenerId: "",
    email: "",
    phone: "",
    rank: "",
    position: "",
    unit: "",
  });
  const [editingAccount, setEditingAccount] = useState(emptyEditDraft);
  const [editingUsername, setEditingUsername] = useState("");
  const [unlinkTarget, setUnlinkTarget] = useState<ManagedAccount | null>(null);
  const [unlinkingUsername, setUnlinkingUsername] = useState("");

  const linkedListenerIds = new Set(
    accounts
      .map((account) => account.listener_id)
      .filter((listenerId) => listenerId && listenerId.trim().length > 0),
  );
  const availableListeners = listeners.filter(
    (listener) => !linkedListenerIds.has(listener.id),
  );
  const editingAvailableListeners = listeners.filter(
    (listener) =>
      listener.id === editingAccount.listenerId ||
      !linkedListenerIds.has(listener.id),
  );

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

  const loadAccounts = useCallback(async () => {
    if (profile.role === "listener") {
      return;
    }

    const response = await fetch("/api/admin/accounts", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(await readErrorMessage(response));
    }
    const data = (await response.json()) as { accounts: ManagedAccount[] };
    setAccounts(data.accounts);
  }, [profile.role]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadAccounts().catch((loadError) =>
        toast.error(
          loadError instanceof Error
            ? loadError.message
            : "Không thể tải danh sách tài khoản.",
        ),
      );
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadAccounts]);

  useEffect(() => {
    if (!pushSupported) {
      return;
    }

    void navigator.serviceWorker.ready
      .then((registration) => registration.pushManager.getSubscription())
      .then((subscription) => setPushEnabled(Boolean(subscription)))
      .catch(() => setPushEnabled(false));
  }, [pushSupported]);

  const enablePush = async () => {
    const enabled = await onEnablePush();
    if (enabled) {
      setPushEnabled(true);
    }
  };

  const disablePush = async () => {
    const disabled = await onDisablePush();
    if (disabled) {
      setPushEnabled(false);
    }
  };

  const createAccount = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const toastId = toast.loading("Đang tạo tài khoản người phụ trách...");
    try {
      const response = await fetch("/api/admin/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...accountDraft,
          username: accountDraft.username.trim().toLowerCase(),
        }),
      });
      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }
      setAccountDraft({
        username: "",
        password: "",
        displayName: "",
        role: "listener",
        listenerId: "",
        email: "",
        phone: "",
        rank: "",
        position: "",
        unit: "",
      });
      await loadAccounts();
      await onLinkedDataChange?.();
      toast.success("Đã tạo tài khoản.", { id: toastId });
    } catch (createError) {
      toast.error(
        createError instanceof Error
          ? createError.message
          : "Không thể tạo tài khoản.",
        { id: toastId },
      );
    }
  };

  const openEditDialog = (account: ManagedAccount) => {
    setEditingUsername(account.username);
    setEditingAccount({
      username: account.username,
      displayName: account.display_name,
      password: "",
      role: account.role,
      listenerId: account.listener_id,
      email: account.email,
      phone: account.phone,
      rank: account.rank,
      position: account.position,
      unit: account.unit,
      assignedCategories: account.assigned_categories,
      isEnabled: account.is_enabled,
    });
  };

  const saveAccountEdit = async () => {
    if (!editingUsername) {
      return;
    }

    const toastId = toast.loading("Đang cập nhật tài khoản...");
    try {
      const response = await fetch("/api/admin/accounts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: editingUsername,
          displayName: editingAccount.displayName,
          password: editingAccount.password,
          role: editingAccount.role,
          listenerId: editingAccount.listenerId,
          email: editingAccount.email,
          phone: editingAccount.phone,
          rank: editingAccount.rank,
          position: editingAccount.position,
          unit: editingAccount.unit,
          assignedCategories: editingAccount.assignedCategories,
          isEnabled: editingAccount.isEnabled,
        }),
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }

      setEditingUsername("");
      setEditingAccount(emptyEditDraft);
      await loadAccounts();
      await onLinkedDataChange?.();
      toast.success("Đã cập nhật tài khoản.", { id: toastId });
    } catch (editError) {
      toast.error(
        editError instanceof Error
          ? editError.message
          : "Không thể cập nhật tài khoản.",
        { id: toastId },
      );
    }
  };

  const confirmUnlinkAccount = (account: ManagedAccount) => {
    if (!account.listener_id) {
      return;
    }

    setUnlinkTarget(account);
  };

  const unlinkAccount = async () => {
    if (!unlinkTarget) {
      return;
    }

    setUnlinkingUsername(unlinkTarget.username);
    const toastId = toast.loading("Đang gỡ liên kết tài khoản...");
    try {
      const response = await fetch("/api/admin/accounts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: unlinkTarget.username,
          unlinkListener: true,
        }),
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }

      await loadAccounts();
      await onLinkedDataChange?.();
      setUnlinkTarget(null);
      toast.success("Đã gỡ liên kết và tắt tài khoản.", { id: toastId });
    } catch (unlinkError) {
      toast.error(
        unlinkError instanceof Error
          ? unlinkError.message
          : "Không thể gỡ liên kết tài khoản.",
        { id: toastId },
      );
    } finally {
      setUnlinkingUsername("");
    }
  };

  const fillFromListener = (listenerId: string) => {
    const listener = listeners.find((item) => item.id === listenerId);
    setAccountDraft((current) => ({
      ...current,
      listenerId,
      displayName: current.displayName || listener?.fullname || "",
      phone: current.phone || listener?.phone || "",
      rank: current.rank || listener?.rank || "",
      position: current.position || listener?.position || "",
    }));
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
          email,
          phone,
          rank,
          position,
          unit,
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
        setEmail(data.admin.email ?? "");
        setPhone(data.admin.phone ?? "");
        setRank(data.admin.rank ?? "");
        setPosition(data.admin.position ?? "");
        setUnit(data.admin.unit ?? "");
      }
      resetPasswordFields();
      setMessage("Đã cập nhật tài khoản.");
      toast.success("Đã cập nhật tài khoản.", { id: toastId });
    } catch (saveError) {
      const messageText =
        saveError instanceof Error
          ? saveError.message
          : "Không thể cập nhật tài khoản.";
      setError(messageText);
      toast.error(messageText, { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-4">
      <div className="shine-card border-border border bg-white p-4 shadow-sm">
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

          <label className="floating-label">
            <span>Email</span>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email"
              className="input bg-muted focus:border-primary h-10 w-full border p-3 text-sm outline-none focus:bg-white"
            />
          </label>

          <label className="floating-label">
            <span>Số điện thoại</span>
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="Số điện thoại"
              className="input bg-muted focus:border-primary h-10 w-full border p-3 text-sm outline-none focus:bg-white"
            />
          </label>

          <label className="floating-label">
            <span>Cấp bậc/chức danh</span>
            <input
              value={rank}
              onChange={(event) => setRank(event.target.value)}
              placeholder="Cấp bậc/chức danh"
              className="input bg-muted focus:border-primary h-10 w-full border p-3 text-sm outline-none focus:bg-white"
            />
          </label>

          <label className="floating-label">
            <span>Đơn vị</span>
            <input
              value={unit}
              onChange={(event) => setUnit(event.target.value)}
              placeholder="Đơn vị"
              className="input bg-muted focus:border-primary h-10 w-full border p-3 text-sm outline-none focus:bg-white"
            />
          </label>

          <label className="floating-label md:col-span-2">
            <span>Chức vụ/nhiệm vụ</span>
            <textarea
              value={position}
              onChange={(event) => setPosition(event.target.value)}
              rows={3}
              placeholder="Chức vụ/nhiệm vụ"
              className="textarea bg-muted focus:border-primary min-h-24 w-full border p-3 text-sm outline-none focus:bg-white"
            />
          </label>

          {profile.role === "listener" && (
            <div className="border-border/60 rounded-box bg-muted border p-3 md:col-span-2">
              <p className="text-muted-foreground/70 mb-2 text-xs font-semibold tracking-[0.12em] uppercase">
                Nhóm nội dung phụ trách
              </p>
              {profile.assignedCategoryIds.length === 0 ? (
                <p className="text-muted-foreground text-sm font-semibold">
                  Chưa được phân công nhóm nội dung.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {categories
                    .filter((category) =>
                      profile.assignedCategoryIds.includes(category.id),
                    )
                    .map((category) => (
                      <div
                        key={category.id}
                        className={`rounded-field border p-3 text-xs font-bold ${categoryTone(category.id)}`}
                      >
                        {category.name}
                      </div>
                    ))}
                </div>
              )}
              <p className="text-muted-foreground mt-2 text-xs font-semibold">
                Nhóm phụ trách do Admin phân công, tài khoản người lắng nghe chỉ
                xem.
              </p>
            </div>
          )}

          <div className="border-border/60 rounded-box bg-muted border p-3 md:col-span-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-muted-foreground/70 mb-1 text-xs font-semibold tracking-[0.12em] uppercase">
                  Thông báo thiết bị
                </p>
                <p className="text-sm font-bold">
                  {pushEnabled
                    ? "Thiết bị này đang nhận thông báo."
                    : "Thiết bị này chưa bật thông báo."}
                </p>
                <p className="text-muted-foreground mt-1 text-xs font-semibold">
                  {profile.role === "admin"
                    ? "Admin nhận tất cả góp ý mới trên thiết bị hiện tại."
                    : "Người lắng nghe chỉ nhận góp ý thuộc nhóm nội dung phụ trách trên thiết bị hiện tại."}
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  void (pushEnabled ? disablePush() : enablePush())
                }
                disabled={!pushSupported || pushActionPending}
                className={`btn btn-sm focus-lift px-4 text-xs font-semibold uppercase ${
                  pushEnabled ? "btn-outline" : "btn-primary"
                }`}
              >
                {pushActionPending ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : pushEnabled ? (
                  <BellOff className="size-4" />
                ) : (
                  <Bell className="size-4" />
                )}
                {pushEnabled ? "Tắt thông báo" : "Bật thông báo"}
              </button>
            </div>
            {!pushSupported && (
              <p className="rounded-field mt-2 border border-amber-100 bg-amber-50 p-2 text-xs font-semibold text-amber-700">
                Trình duyệt này chưa hỗ trợ thông báo web.
              </p>
            )}
          </div>

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

          <label className="floating-label">
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
      </div>

      {profile.role !== "listener" && (
        <div className="shine-card border-border border bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="bg-primary text-primary-foreground rounded-field flex size-10 items-center justify-center">
              <UserRound className="size-5" />
            </div>
            <div>
              <h2 className="text-primary text-base font-semibold uppercase">
                Tài khoản người phụ trách
              </h2>
              <p className="text-muted-foreground text-xs font-semibold">
                Liên kết tài khoản đăng nhập với hồ sơ người phụ trách để phân
                quyền và nhận thông báo.
              </p>
            </div>
          </div>

          <form onSubmit={createAccount} className="grid gap-3 md:grid-cols-2">
            <label className="floating-label">
              <span>Người phụ trách liên kết</span>
              <select
                value={accountDraft.listenerId}
                onChange={(event) => fillFromListener(event.target.value)}
                className="select bg-muted focus:border-primary h-10 w-full border text-sm outline-none"
              >
                <option value="">Chọn người phụ trách</option>
                {availableListeners.map((listener) => (
                  <option key={listener.id} value={listener.id}>
                    {listener.rank} {listener.fullname}
                  </option>
                ))}
              </select>
            </label>
            <label className="floating-label">
              <span>Tên đăng nhập</span>
              <input
                value={accountDraft.username}
                onChange={(event) =>
                  setAccountDraft((current) => ({
                    ...current,
                    username: event.target.value,
                  }))
                }
                className="input bg-muted focus:border-primary h-10 w-full border text-sm outline-none"
                placeholder="vd: nguyenvana"
              />
            </label>
            <label className="floating-label">
              <span>Mật khẩu</span>
              <input
                type="password"
                value={accountDraft.password}
                onChange={(event) =>
                  setAccountDraft((current) => ({
                    ...current,
                    password: event.target.value,
                  }))
                }
                className="input bg-muted focus:border-primary h-10 w-full border text-sm outline-none"
                placeholder="Ít nhất 6 ký tự"
              />
            </label>
            <label className="floating-label">
              <span>Tên hiển thị</span>
              <input
                value={accountDraft.displayName}
                onChange={(event) =>
                  setAccountDraft((current) => ({
                    ...current,
                    displayName: event.target.value,
                  }))
                }
                className="input bg-muted focus:border-primary h-10 w-full border text-sm outline-none"
                placeholder="Họ tên đầy đủ"
              />
            </label>
            <label className="floating-label">
              <span>Email</span>
              <input
                value={accountDraft.email}
                onChange={(event) =>
                  setAccountDraft((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                className="input bg-muted focus:border-primary h-10 w-full border text-sm outline-none"
                placeholder="email nếu có"
              />
            </label>
            <label className="floating-label">
              <span>Số điện thoại</span>
              <input
                value={accountDraft.phone}
                onChange={(event) =>
                  setAccountDraft((current) => ({
                    ...current,
                    phone: event.target.value,
                  }))
                }
                className="input bg-muted focus:border-primary h-10 w-full border text-sm outline-none"
                placeholder="Số điện thoại"
              />
            </label>
            <label className="floating-label">
              <span>Cấp bậc/chức danh</span>
              <input
                value={accountDraft.rank}
                onChange={(event) =>
                  setAccountDraft((current) => ({
                    ...current,
                    rank: event.target.value,
                  }))
                }
                className="input bg-muted focus:border-primary h-10 w-full border text-sm outline-none"
              />
            </label>
            <label className="floating-label">
              <span>Đơn vị</span>
              <input
                value={accountDraft.unit}
                onChange={(event) =>
                  setAccountDraft((current) => ({
                    ...current,
                    unit: event.target.value,
                  }))
                }
                className="input bg-muted focus:border-primary h-10 w-full border text-sm outline-none"
              />
            </label>
            <label className="floating-label md:col-span-2">
              <span>Chức vụ/nhiệm vụ</span>
              <textarea
                value={accountDraft.position}
                onChange={(event) =>
                  setAccountDraft((current) => ({
                    ...current,
                    position: event.target.value,
                  }))
                }
                className="textarea bg-muted focus:border-primary min-h-20 w-full border text-sm outline-none"
              />
            </label>
            <div className="flex justify-end md:col-span-2">
              <button
                type="submit"
                className="btn btn-primary btn-sm px-4 font-semibold uppercase"
              >
                Tạo tài khoản liên kết
              </button>
            </div>
          </form>

          <div className="mt-4 grid gap-2">
            {accounts.map((account) => {
              const listener = listeners.find(
                (item) => item.id === account.listener_id,
              );
              const assignedCategoryIds = account.assigned_categories;
              return (
                <div
                  key={account.username}
                  className="rounded-box border-border bg-muted flex flex-col gap-1 border p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-foreground font-bold">
                      {account.display_name}
                    </p>
                    <p className="text-muted-foreground text-xs font-semibold">
                      {account.username} ·{" "}
                      {account.role === "listener"
                        ? "Người phụ trách"
                        : "Quản trị"}
                      {listener
                        ? ` · ${listener.fullname}`
                        : account.role === "listener"
                          ? " · Chưa liên kết"
                          : ""}
                    </p>
                    {assignedCategoryIds.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {categories
                          .filter((category) =>
                            assignedCategoryIds.includes(category.id),
                          )
                          .map((category) => (
                            <span
                              key={category.id}
                              className={`rounded-field border px-2 py-1 text-[10px] font-bold uppercase ${categoryTone(category.id)}`}
                            >
                              {category.name}
                            </span>
                          ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-field px-3 py-1 text-xs font-bold uppercase ${account.is_enabled ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}
                    >
                      {account.is_enabled ? "Đang bật" : "Đã tắt"}
                    </span>
                    {account.role === "listener" && account.listener_id && (
                      <button
                        type="button"
                        onClick={() => confirmUnlinkAccount(account)}
                        disabled={unlinkingUsername === account.username}
                        className="btn btn-outline btn-error btn-sm px-3 text-xs font-semibold uppercase"
                      >
                        {unlinkingUsername === account.username ? (
                          <LoaderCircle className="size-4 animate-spin" />
                        ) : (
                          <Unlink className="size-4" />
                        )}
                        Gỡ liên kết
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => openEditDialog(account)}
                      className="btn btn-outline btn-sm px-3 text-xs font-semibold uppercase"
                    >
                      <Pencil className="size-4" />
                      Chỉnh sửa
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {editingUsername && (
        <dialog open className="modal modal-open">
          <div className="modal-box border-border bg-base-100 max-h-[90vh] max-w-3xl overflow-y-auto border p-0 shadow-2xl">
            <div className="border-base-300 bg-base-100 sticky top-0 z-10 flex items-center justify-between border-b px-4 py-3">
              <h3 className="text-sm font-semibold uppercase">
                Chỉnh sửa tài khoản liên kết
              </h3>
              <button
                type="button"
                onClick={() => {
                  setEditingUsername("");
                  setEditingAccount(emptyEditDraft);
                }}
                className="btn btn-sm btn-circle btn-ghost"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-3 p-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="floating-label">
                  <span>Tên đăng nhập</span>
                  <input
                    value={editingAccount.username}
                    readOnly
                    className="input bg-muted h-10 w-full border text-sm outline-none"
                  />
                </label>
                <label className="floating-label">
                  <span>Tên hiển thị</span>
                  <input
                    value={editingAccount.displayName}
                    onChange={(event) =>
                      setEditingAccount((current) => ({
                        ...current,
                        displayName: event.target.value,
                      }))
                    }
                    className="input bg-muted focus:border-primary h-10 w-full border text-sm outline-none"
                  />
                </label>
                <label className="floating-label">
                  <span>Mật khẩu mới (bỏ trống nếu giữ nguyên)</span>
                  <input
                    type="password"
                    value={editingAccount.password}
                    onChange={(event) =>
                      setEditingAccount((current) => ({
                        ...current,
                        password: event.target.value,
                      }))
                    }
                    className="input bg-muted focus:border-primary h-10 w-full border text-sm outline-none"
                  />
                </label>
                <label className="floating-label">
                  <span>Loại tài khoản</span>
                  <select
                    value={editingAccount.role}
                    onChange={(event) =>
                      setEditingAccount((current) => ({
                        ...current,
                        role:
                          event.target.value === "admin" ? "admin" : "listener",
                      }))
                    }
                    className="select bg-muted focus:border-primary h-10 w-full border text-sm outline-none"
                  >
                    <option value="listener">Người phụ trách</option>
                    <option value="admin">Quản trị</option>
                  </select>
                </label>
                <label className="floating-label">
                  <span>Người phụ trách liên kết</span>
                  <select
                    value={editingAccount.listenerId}
                    onChange={(event) =>
                      setEditingAccount((current) => ({
                        ...current,
                        listenerId: event.target.value,
                      }))
                    }
                    disabled={editingAccount.role === "admin"}
                    className="select bg-muted focus:border-primary h-10 w-full border text-sm outline-none disabled:opacity-60"
                  >
                    <option value="">Chọn người phụ trách</option>
                    {editingAvailableListeners.map((listener) => (
                      <option key={listener.id} value={listener.id}>
                        {listener.rank} {listener.fullname}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="floating-label">
                  <span>Email</span>
                  <input
                    value={editingAccount.email}
                    onChange={(event) =>
                      setEditingAccount((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    className="input bg-muted focus:border-primary h-10 w-full border text-sm outline-none"
                  />
                </label>
                <label className="floating-label">
                  <span>Số điện thoại</span>
                  <input
                    value={editingAccount.phone}
                    onChange={(event) =>
                      setEditingAccount((current) => ({
                        ...current,
                        phone: event.target.value,
                      }))
                    }
                    className="input bg-muted focus:border-primary h-10 w-full border text-sm outline-none"
                  />
                </label>
                <label className="floating-label">
                  <span>Cấp bậc/chức danh</span>
                  <input
                    value={editingAccount.rank}
                    onChange={(event) =>
                      setEditingAccount((current) => ({
                        ...current,
                        rank: event.target.value,
                      }))
                    }
                    className="input bg-muted focus:border-primary h-10 w-full border text-sm outline-none"
                  />
                </label>
                <label className="floating-label">
                  <span>Đơn vị</span>
                  <input
                    value={editingAccount.unit}
                    onChange={(event) =>
                      setEditingAccount((current) => ({
                        ...current,
                        unit: event.target.value,
                      }))
                    }
                    className="input bg-muted focus:border-primary h-10 w-full border text-sm outline-none"
                  />
                </label>
                <label className="floating-label sm:col-span-2">
                  <span>Chức vụ/nhiệm vụ</span>
                  <textarea
                    value={editingAccount.position}
                    onChange={(event) =>
                      setEditingAccount((current) => ({
                        ...current,
                        position: event.target.value,
                      }))
                    }
                    rows={3}
                    className="textarea bg-muted focus:border-primary min-h-24 w-full border text-sm outline-none"
                  />
                </label>
                {editingAccount.role === "listener" && (
                  <div className="border-border/60 rounded-box bg-muted border p-3 sm:col-span-2">
                    <p className="text-muted-foreground/70 mb-2 text-xs font-semibold tracking-[0.12em] uppercase">
                      Nhóm nội dung phụ trách
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
                            checked={editingAccount.assignedCategories.includes(
                              category.id,
                            )}
                            onChange={() =>
                              setEditingAccount((current) => {
                                const assigned =
                                  current.assignedCategories.includes(
                                    category.id,
                                  )
                                    ? current.assignedCategories.filter(
                                        (item) => item !== category.id,
                                      )
                                    : [
                                        ...current.assignedCategories,
                                        category.id,
                                      ];

                                return {
                                  ...current,
                                  assignedCategories: assigned,
                                };
                              })
                            }
                          />
                          {category.name}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <label className="text-foreground/85 flex items-center gap-2 text-sm font-bold">
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary checkbox-xs border border-gray-300 outline-none"
                  checked={editingAccount.isEnabled}
                  onChange={(event) =>
                    setEditingAccount((current) => ({
                      ...current,
                      isEnabled: event.target.checked,
                    }))
                  }
                />
                Bật tài khoản
              </label>
            </div>

            <div className="border-base-300 bg-base-100 sticky bottom-0 flex justify-end gap-2 border-t px-4 py-3">
              <button
                type="button"
                onClick={() => {
                  setEditingUsername("");
                  setEditingAccount(emptyEditDraft);
                }}
                className="btn btn-outline btn-sm px-4 text-xs font-semibold uppercase"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => void saveAccountEdit()}
                className="btn btn-primary btn-sm px-4 text-xs font-semibold uppercase"
              >
                <Save className="size-4" />
                Lưu thay đổi
              </button>
            </div>
          </div>
        </dialog>
      )}

      {unlinkTarget && (
        <div className="modal modal-open" role="alertdialog" aria-modal="true">
          <div className="modal-box border-border bg-base-100 border shadow-2xl">
            <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-red-50 text-red-700">
              <Unlink className="size-7" />
            </div>
            <h3 className="text-lg font-semibold uppercase">
              Gỡ liên kết tài khoản
            </h3>
            <p className="text-base-content/70 mt-2 text-sm">
              {`Tài khoản "${unlinkTarget.display_name}" sẽ bị tắt và không còn xem được các thư được phân công.`}
            </p>
            <div className="border-border/70 bg-muted rounded-box mt-4 border p-3 text-sm">
              <p className="text-foreground font-bold">
                {unlinkTarget.display_name}
              </p>
              <p className="text-muted-foreground text-xs font-semibold">
                {unlinkTarget.username}
              </p>
            </div>
            <div className="modal-action">
              <button
                type="button"
                className="btn btn-outline focus-lift"
                disabled={Boolean(unlinkingUsername)}
                onClick={() => setUnlinkTarget(null)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="btn btn-error focus-lift"
                disabled={Boolean(unlinkingUsername)}
                onClick={() => void unlinkAccount()}
              >
                {unlinkingUsername ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Unlink className="size-4" />
                )}
                {unlinkingUsername ? "Đang gỡ" : "Gỡ liên kết"}
              </button>
            </div>
          </div>
          <button
            type="button"
            className="modal-backdrop"
            aria-label="Đóng"
            onClick={() => {
              if (!unlinkingUsername) {
                setUnlinkTarget(null);
              }
            }}
          />
        </div>
      )}
    </section>
  );
}
