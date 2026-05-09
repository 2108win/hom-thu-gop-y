"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

import { AccountTab } from "@/components/admin/account-tab";
import { AdminTabs } from "@/components/admin/admin-tabs";
import { DashboardHeader } from "@/components/admin/dashboard-header";
import { DeleteDialog } from "@/components/admin/delete-dialog";
import { ListenersTab } from "@/components/admin/listeners-tab";
import { LoginForm } from "@/components/admin/login-form";
import { SurveysTab } from "@/components/admin/surveys-tab";
import { TicketsTab } from "@/components/admin/tickets-tab";
import type {
  AdminTab,
  AdminProfile,
  DeleteConfirm,
  ListenerDraft,
  StatusFilter,
  SurveyDraft,
} from "@/components/admin/types";
import {
  defaultListenerDraft,
  defaultSurveyDraft,
  formatNow,
} from "@/components/admin/utils";
import {
  isSurveyOpen,
  type ManagedListener,
  type ManagedSurvey,
  type StoredTicket,
} from "@/lib/data-models";
import { copyQrImageToClipboard } from "@/lib/qr-clipboard";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";

function subscribeToOrigin() {
  return () => undefined;
}

function getBrowserOrigin() {
  return typeof window === "undefined" ? "" : window.location.origin;
}

function getServerOrigin() {
  return "";
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
}

function arrayBufferToUrlBase64(buffer: ArrayBuffer | null) {
  if (!buffer) {
    return "";
  }

  const bytes = new Uint8Array(buffer);
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return window
    .btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function subscriptionUsesVapidKey(
  subscription: PushSubscription,
  publicKey: string,
) {
  return arrayBufferToUrlBase64(subscription.options.applicationServerKey) === publicKey;
}

function sortListeners(listeners: ManagedListener[]) {
  return [...listeners].sort((a, b) => a.order - b.order);
}

export function AdminLogin() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>("tickets");
  const [tickets, setTickets] = useState<StoredTicket[]>([]);
  const [managedSurveys, setManagedSurveys] = useState<ManagedSurvey[]>([]);
  const [managedListeners, setManagedListeners] = useState<ManagedListener[]>(
    [],
  );
  const [surveyDraft, setSurveyDraft] =
    useState<SurveyDraft>(defaultSurveyDraft);
  const [listenerDraft, setListenerDraft] =
    useState<ListenerDraft>(defaultListenerDraft);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [loginError, setLoginError] = useState("");
  const [adminError, setAdminError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingActions, setPendingActions] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState("");
  const [copiedQrId, setCopiedQrId] = useState("");
  const [copyingQrId, setCopyingQrId] = useState("");
  const [qrCopyErrorId, setQrCopyErrorId] = useState("");
  const [currentDevicePushEnabled, setCurrentDevicePushEnabled] =
    useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirm | null>(
    null,
  );
  const origin = useSyncExternalStore(
    subscribeToOrigin,
    getBrowserOrigin,
    getServerOrigin,
  );

  const readErrorMessage = useCallback(async (response: Response) => {
    try {
      const data = (await response.json()) as { message?: string };
      return data.message || "Có lỗi xảy ra.";
    } catch {
      return "Có lỗi xảy ra.";
    }
  }, []);

  const clearAdminState = useCallback(() => {
    setIsLoggedIn(false);
    setAdminProfile(null);
    setTickets([]);
    setManagedSurveys([]);
    setManagedListeners([]);
    setCurrentDevicePushEnabled(false);
  }, []);

  useEffect(() => {
    if (!isLoggedIn || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      return;
    }

    void navigator.serviceWorker.ready
      .then((registration) => registration.pushManager.getSubscription())
      .then((subscription) => setCurrentDevicePushEnabled(Boolean(subscription)))
      .catch(() => setCurrentDevicePushEnabled(false));
  }, [isLoggedIn]);

  const isActionPending = (key: string) => pendingActions.includes(key);

  const runWithActionLoading = async (
    key: string,
    action: () => Promise<void>,
  ) => {
    if (pendingActions.includes(key)) {
      return;
    }

    setPendingActions((current) =>
      current.includes(key) ? current : [...current, key],
    );
    try {
      await action();
    } finally {
      setPendingActions((current) => current.filter((item) => item !== key));
    }
  };

  const loadData = useCallback(
    async (successToast?: string, role: AdminProfile["role"] = "admin") => {
      setLoading(true);
      setAdminError("");

      try {
        const ticketsResponse = await fetch("/api/admin/tickets", {
          cache: "no-store",
        });

        if (ticketsResponse.status === 401) {
          clearAdminState();
          throw new Error("Phiên quản trị đã hết hạn.");
        }
        if (!ticketsResponse.ok) {
          throw new Error(await readErrorMessage(ticketsResponse));
        }

        const ticketsData = (await ticketsResponse.json()) as {
          tickets: StoredTicket[];
        };

        setTickets(ticketsData.tickets);

        if (role === "listener") {
          setManagedSurveys([]);
          setManagedListeners([]);
        } else {
          const [surveysResponse, listenersResponse] = await Promise.all([
            fetch("/api/admin/surveys", { cache: "no-store" }),
            fetch("/api/admin/listeners", { cache: "no-store" }),
          ]);

          if (surveysResponse.status === 401 || listenersResponse.status === 401) {
            clearAdminState();
            throw new Error("Phiên quản trị đã hết hạn.");
          }
          if (!surveysResponse.ok) {
            throw new Error(await readErrorMessage(surveysResponse));
          }
          if (!listenersResponse.ok) {
            throw new Error(await readErrorMessage(listenersResponse));
          }

          const surveysData = (await surveysResponse.json()) as {
            surveys: ManagedSurvey[];
          };
          const listenersData = (await listenersResponse.json()) as {
            listeners: ManagedListener[];
          };

          setManagedSurveys(surveysData.surveys);
          setManagedListeners(sortListeners(listenersData.listeners));
        }

        if (successToast) {
          toast.success(successToast);
        }
      } catch (error) {
        const message = errorMessage(error, "Không thể tải dữ liệu.");
        setAdminError(message);
        if (successToast) {
          toast.error(message);
        }
      } finally {
        setLoading(false);
      }
    },
    [clearAdminState, readErrorMessage],
  );

  useEffect(() => {
    let ignore = false;

    const restoreSession = async () => {
      try {
        const response = await fetch("/api/admin/me", { cache: "no-store" });
        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as { admin?: AdminProfile };
        if (ignore || !data.admin) {
          return;
        }

        setAdminProfile(data.admin);
        setIsLoggedIn(true);
        await loadData(undefined, data.admin.role);
      } catch {
        if (!ignore) {
          clearAdminState();
        }
      } finally {
        if (!ignore) {
          setCheckingSession(false);
        }
      }
    };

    void restoreSession();

    return () => {
      ignore = true;
    };
  }, [clearAdminState, loadData]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const user = String(formData.get("user") ?? "").trim();
    const pass = String(formData.get("pass") ?? "").trim();

    setLoginError("");
    setLoading(true);
    const toastId = toast.loading("Đang đăng nhập...");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user, password: pass }),
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }

      const data = (await response.json()) as { admin?: AdminProfile };
      if (data.admin) {
        setAdminProfile(data.admin);
        await loadData(undefined, data.admin.role);
      }
      setIsLoggedIn(true);
      toast.success("Đăng nhập thành công.", { id: toastId });
    } catch (error) {
      const message = errorMessage(
        error,
        "Sai tài khoản hoặc mật khẩu quản trị.",
      );
      setLoginError(message);
      toast.error(message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const patchTicketDraft = (
    ticketCode: string,
    patch: Partial<StoredTicket>,
  ) => {
    setTickets((current) =>
      current.map((ticket) =>
        ticket.ticket_code === ticketCode ? { ...ticket, ...patch } : ticket,
      ),
    );
  };

  const saveTicketPatch = async (
    ticketCode: string,
    patch: Partial<StoredTicket>,
    actionKey = `ticket:${ticketCode}:save`,
  ) => {
    await runWithActionLoading(actionKey, async () => {
      setAdminError("");
      const toastId = toast.loading("Đang cập nhật phiếu...");
      try {
        const response = await fetch(
          `/api/admin/tickets/${encodeURIComponent(ticketCode)}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(patch),
          },
        );

        if (!response.ok) {
          throw new Error(await readErrorMessage(response));
        }

        const data = (await response.json()) as { ticket: StoredTicket };
        setTickets((current) =>
          current.map((ticket) =>
            ticket.ticket_code === ticketCode ? data.ticket : ticket,
          ),
        );
        toast.success(
          actionKey.endsWith(":reply")
            ? "Đã lưu phản hồi phiếu."
            : "Đã cập nhật phiếu.",
          { id: toastId },
        );
      } catch (error) {
        const message = errorMessage(error, "Không thể cập nhật phiếu.");
        setAdminError(message);
        toast.error(message, { id: toastId });
      }
    });
  };

  const saveTicketReply = async (ticketCode: string) => {
    const ticket = tickets.find((item) => item.ticket_code === ticketCode);
    await saveTicketPatch(
      ticketCode,
      {
        admin_reply: ticket?.admin_reply ?? "",
        status: "done",
        replied_at: formatNow(),
      },
      `ticket:${ticketCode}:reply`,
    );
  };

  const handleDeleteTicket = async (ticketCode: string) => {
    setAdminError("");
    const toastId = toast.loading("Đang xóa phiếu...");
    try {
      const response = await fetch(
        `/api/admin/tickets/${encodeURIComponent(ticketCode)}`,
        { method: "DELETE" },
      );

      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }

      setTickets((current) =>
        current.filter((ticket) => ticket.ticket_code !== ticketCode),
      );
      toast.success("Đã xóa phiếu.", { id: toastId });
    } catch (error) {
      const message = errorMessage(error, "Không thể xóa phiếu.");
      setAdminError(message);
      toast.error(message, { id: toastId });
    }
  };

  const createSurvey = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await runWithActionLoading("survey:create", async () => {
      setAdminError("");
      const toastId = toast.loading("Đang tạo khảo sát...");

      try {
        const response = await fetch("/api/admin/surveys", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(surveyDraft),
        });

        if (!response.ok) {
          throw new Error(await readErrorMessage(response));
        }

        const data = (await response.json()) as { survey: ManagedSurvey };
        setManagedSurveys((current) => [data.survey, ...current]);
        setSurveyDraft(defaultSurveyDraft());
        toast.success("Đã tạo khảo sát.", { id: toastId });
      } catch (error) {
        const message = errorMessage(error, "Không thể tạo khảo sát.");
        setAdminError(message);
        toast.error(message, { id: toastId });
      }
    });
  };

  const patchSurveyDraft = (
    surveyId: string,
    patch: Partial<ManagedSurvey>,
  ) => {
    setManagedSurveys((current) =>
      current.map((survey) =>
        survey.id === surveyId ? { ...survey, ...patch } : survey,
      ),
    );
  };

  const saveSurvey = async (
    survey: ManagedSurvey,
    actionKey = `survey:${survey.id}:save`,
  ) => {
    await runWithActionLoading(actionKey, async () => {
      setAdminError("");
      const toastId = toast.loading("Đang lưu khảo sát...");

      try {
        const response = await fetch(
          `/api/admin/surveys/${encodeURIComponent(survey.id)}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(survey),
          },
        );

        if (!response.ok) {
          throw new Error(await readErrorMessage(response));
        }

        const data = (await response.json()) as { survey: ManagedSurvey };
        setManagedSurveys((current) =>
          current.map((item) => (item.id === survey.id ? data.survey : item)),
        );
        toast.success("Đã lưu khảo sát.", { id: toastId });
      } catch (error) {
        const message = errorMessage(error, "Không thể lưu khảo sát.");
        setAdminError(message);
        toast.error(message, { id: toastId });
      }
    });
  };

  const deleteSurvey = async (surveyId: string) => {
    setAdminError("");
    const toastId = toast.loading("Đang xóa khảo sát...");
    try {
      const response = await fetch(
        `/api/admin/surveys/${encodeURIComponent(surveyId)}`,
        { method: "DELETE" },
      );

      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }

      setManagedSurveys((current) =>
        current.filter((survey) => survey.id !== surveyId),
      );
      toast.success("Đã xóa khảo sát.", { id: toastId });
    } catch (error) {
      const message = errorMessage(error, "Không thể xóa khảo sát.");
      setAdminError(message);
      toast.error(message, { id: toastId });
    }
  };

  const createListener = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await runWithActionLoading("listener:create", async () => {
      setAdminError("");
      const toastId = toast.loading("Đang tạo người phụ trách...");

      try {
        const nextOrder =
          managedListeners.reduce(
            (highestOrder, listener) =>
              Math.max(highestOrder, Number(listener.order) || 0),
            0,
          ) + 1;
        const response = await fetch("/api/admin/listeners", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...listenerDraft, order: nextOrder }),
        });

        if (!response.ok) {
          throw new Error(await readErrorMessage(response));
        }

        const data = (await response.json()) as { listener: ManagedListener };
        setManagedListeners((current) =>
          sortListeners([...current, data.listener]),
        );
        setListenerDraft(defaultListenerDraft());
        toast.success("Đã tạo người phụ trách.", { id: toastId });
      } catch (error) {
        const message = errorMessage(error, "Không thể tạo người phụ trách.");
        setAdminError(message);
        toast.error(message, { id: toastId });
      }
    });
  };

  const saveListener = async (
    listener: ManagedListener,
    actionKey = `listener:${listener.id}:save`,
  ) => {
    let saved = false;

    await runWithActionLoading(actionKey, async () => {
      setAdminError("");
      const toastId = toast.loading("Đang lưu người phụ trách...");

      try {
        const response = await fetch(
          `/api/admin/listeners/${encodeURIComponent(listener.id)}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(listener),
          },
        );

        if (!response.ok) {
          throw new Error(await readErrorMessage(response));
        }

        const data = (await response.json()) as { listener: ManagedListener };
        setManagedListeners((current) =>
          sortListeners(
            current.map((item) =>
              item.id === listener.id ? data.listener : item,
            ),
          ),
        );
        toast.success("Đã lưu người phụ trách.", { id: toastId });
        saved = true;
      } catch (error) {
        const message = errorMessage(error, "Không thể lưu người phụ trách.");
        setAdminError(message);
        toast.error(message, { id: toastId });
      }
    });

    return saved;
  };

  const moveListener = async (listenerId: string, direction: "up" | "down") => {
    const orderedListeners = sortListeners(managedListeners);
    const currentIndex = orderedListeners.findIndex(
      (listener) => listener.id === listenerId,
    );
    const targetIndex =
      direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (
      currentIndex < 0 ||
      targetIndex < 0 ||
      targetIndex >= orderedListeners.length
    ) {
      return;
    }

    await runWithActionLoading(`listener:${listenerId}:move`, async () => {
      setAdminError("");
      const previousListeners = managedListeners;
      const toastId = toast.loading("Đang cập nhật thứ tự hiển thị...");
      const reordered = [...orderedListeners];
      const currentListener = reordered[currentIndex];
      const targetListener = reordered[targetIndex];

      reordered[currentIndex] = targetListener;
      reordered[targetIndex] = currentListener;

      const renumbered = reordered.map((listener, index) => ({
        ...listener,
        order: index + 1,
      }));
      const changedListeners = renumbered.filter((listener) => {
        const previous = previousListeners.find(
          (item) => item.id === listener.id,
        );
        return previous?.order !== listener.order;
      });

      setManagedListeners(renumbered);

      try {
        await Promise.all(
          changedListeners.map(async (listener) => {
            const response = await fetch(
              `/api/admin/listeners/${encodeURIComponent(listener.id)}`,
              {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ order: listener.order }),
              },
            );

            if (!response.ok) {
              throw new Error(await readErrorMessage(response));
            }
          }),
        );

        toast.success("Đã cập nhật thứ tự hiển thị.", { id: toastId });
      } catch (error) {
        const message = errorMessage(
          error,
          "Không thể cập nhật thứ tự hiển thị.",
        );
        setManagedListeners(previousListeners);
        setAdminError(message);
        toast.error(message, { id: toastId });
      }
    });
  };

  const deleteListener = async (listenerId: string) => {
    setAdminError("");
    const toastId = toast.loading("Đang xóa người phụ trách...");
    try {
      const response = await fetch(
        `/api/admin/listeners/${encodeURIComponent(listenerId)}`,
        { method: "DELETE" },
      );

      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }

      setManagedListeners((current) =>
        current.filter((listener) => listener.id !== listenerId),
      );
      toast.success("Đã xóa người phụ trách.", { id: toastId });
    } catch (error) {
      const message = errorMessage(error, "Không thể xóa người phụ trách.");
      setAdminError(message);
      toast.error(message, { id: toastId });
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) {
      return;
    }

    const target = deleteConfirm;
    await runWithActionLoading(
      `delete:${target.kind}:${target.id}`,
      async () => {
        if (target.kind === "ticket") {
          await handleDeleteTicket(target.id);
          return;
        }

        if (target.kind === "survey") {
          await deleteSurvey(target.id);
          return;
        }

        await deleteListener(target.id);
      },
    );
    setDeleteConfirm(null);
  };

  const toggleDraftCategory = (categoryId: string) => {
    setListenerDraft((current) => {
      const assigned = current.assigned_categories.includes(categoryId)
        ? current.assigned_categories.filter((item) => item !== categoryId)
        : [...current.assigned_categories, categoryId];

      return { ...current, assigned_categories: assigned };
    });
  };

  const enablePushForListener = async (listener?: ManagedListener) => {
    const listenerId = listener?.id ?? adminProfile?.listenerId ?? "";
    let enabled = false;

    await runWithActionLoading(`listener:${listenerId || "self"}:push`, async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        toast.error("Trình duyệt này chưa hỗ trợ thông báo web.");
        return;
      }

      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) {
        toast.error("Chưa cấu hình VAPID public key cho thông báo.");
        return;
      }

      if (listener && !listener.assigned_categories.length) {
        toast.error("Người phụ trách chưa có nhóm nội dung phụ trách.");
        return;
      }

      const toastId = toast.loading("Đang bật thông báo trên thiết bị...");

      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });
        const permission = await Notification.requestPermission();

        if (permission !== "granted") {
          toast.error("Thiết bị chưa cho phép nhận thông báo.", { id: toastId });
          return;
        }

        let subscription = await registration.pushManager.getSubscription();
        if (subscription && !subscriptionUsesVapidKey(subscription, publicKey)) {
          await subscription.unsubscribe();
          subscription = null;
        }

        subscription =
          subscription ??
          (await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicKey),
          }));

        const response = await fetch("/api/admin/push-subscriptions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            listenerId,
            subscription: JSON.parse(JSON.stringify(subscription)),
          }),
        });

        if (!response.ok) {
          throw new Error(await readErrorMessage(response));
        }

        toast.success(
          listener
            ? `Thiết bị này sẽ nhận thông báo cho ${listener.fullname}.`
            : "Thiết bị này sẽ nhận thông báo cho tài khoản của bạn.",
          { id: toastId },
        );
        enabled = true;
        setCurrentDevicePushEnabled(true);
      } catch (error) {
        toast.error(errorMessage(error, "Không thể bật thông báo."), {
          id: toastId,
        });
      }
    });

    return enabled;
  };

  const disablePushForCurrentDevice = async () => {
    const listenerId = adminProfile?.listenerId ?? "";
    let disabled = false;

    await runWithActionLoading(`listener:${listenerId || "self"}:push`, async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        toast.error("Trình duyệt này chưa hỗ trợ thông báo web.");
        return;
      }

      const toastId = toast.loading("Đang tắt thông báo trên thiết bị...");

      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
          const response = await fetch("/api/admin/push-subscriptions", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              endpoint: subscription.endpoint,
            }),
          });

          if (!response.ok) {
            throw new Error(await readErrorMessage(response));
          }

          await subscription.unsubscribe();
        }

        toast.success("Đã tắt thông báo trên thiết bị này.", { id: toastId });
        disabled = true;
        setCurrentDevicePushEnabled(false);
      } catch (error) {
        toast.error(errorMessage(error, "Không thể tắt thông báo."), {
          id: toastId,
        });
      }
    });

    return disabled;
  };

  const handleLogout = async () => {
    await runWithActionLoading("logout", async () => {
      const toastId = toast.loading("Đang đăng xuất...");
      await fetch("/api/admin/login", { method: "DELETE" }).catch(
        () => undefined,
      );
      clearAdminState();
      toast.success("Đã đăng xuất.", { id: toastId });
    });
  };

  const surveyShareUrl = (surveyId: string) =>
    `${origin || ""}/khao-sat/${encodeURIComponent(surveyId)}`;

  const copySurveyLink = async (surveyId: string) => {
    await navigator.clipboard
      ?.writeText(surveyShareUrl(surveyId))
      .catch(() => undefined);
    setCopiedId(surveyId);
    window.setTimeout(() => setCopiedId(""), 1400);
  };

  const copySurveyQr = async (surveyId: string) => {
    setCopyingQrId(surveyId);
    setQrCopyErrorId("");

    try {
      await copyQrImageToClipboard(surveyShareUrl(surveyId));
      setCopiedQrId(surveyId);
      window.setTimeout(() => setCopiedQrId(""), 1600);
    } catch {
      setQrCopyErrorId(surveyId);
      window.setTimeout(() => setQrCopyErrorId(""), 2200);
    } finally {
      setCopyingQrId("");
    }
  };

  const isListenerRole = adminProfile?.role === "listener";
  const listenerAllowedCategoryIds = useMemo(
    () => (isListenerRole ? adminProfile?.assignedCategoryIds ?? [] : []),
    [adminProfile?.assignedCategoryIds, isListenerRole],
  );
  const effectiveCategoryFilter =
    isListenerRole &&
    categoryFilter !== "all" &&
    !listenerAllowedCategoryIds.includes(categoryFilter)
      ? "all"
      : categoryFilter;

  const filteredTickets = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return tickets.filter((ticket) => {
      const matchedStatus =
        statusFilter === "all" || ticket.status === statusFilter;
      const matchedCategory =
        effectiveCategoryFilter === "all" ||
        ticket.category_id === effectiveCategoryFilter;
      const hasPermission =
        !isListenerRole ||
        listenerAllowedCategoryIds.includes(ticket.category_id);
      const matchedQuery =
        !normalized ||
        [
          ticket.ticket_code,
          ticket.category,
          ticket.message,
          ticket.name,
          ticket.unit,
          ticket.admin_reply,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(normalized);

      return hasPermission && matchedStatus && matchedCategory && matchedQuery;
    });
  }, [
    effectiveCategoryFilter,
    isListenerRole,
    listenerAllowedCategoryIds,
    query,
    statusFilter,
    tickets,
  ]);

  const pendingCount = tickets.filter(
    (ticket) => ticket.status === "pending",
  ).length;
  const doneCount = tickets.filter((ticket) => ticket.status === "done").length;
  const openSurveyCount = managedSurveys.filter((survey) =>
    isSurveyOpen(survey),
  ).length;
  const effectiveActiveTab =
    adminProfile?.role === "listener" &&
    activeTab !== "tickets" &&
    activeTab !== "account"
      ? "tickets"
      : activeTab;

  if (checkingSession) {
    return (
      <main className="site-canvas flex items-center justify-center p-4">
        <div className="shine-card border-border flex items-center gap-3 border bg-white p-5 text-sm font-semibold shadow-xl">
          <LoaderCircle className="text-primary size-5 animate-spin" />
          Đang kiểm tra phiên đăng nhập
        </div>
      </main>
    );
  }

  if (!isLoggedIn) {
    return (
      <LoginForm
        loading={loading}
        loginError={loginError}
        onSubmit={handleSubmit}
      />
    );
  }

  return (
    <main className="site-canvas text-foreground pb-6">
      <div className="mx-auto max-w-5xl px-3 py-4 sm:px-5">
        <DashboardHeader
          adminDisplayName={adminProfile?.displayName ?? "Quản trị viên"}
          ticketCount={tickets.length}
          pendingCount={pendingCount}
          doneCount={doneCount}
          openSurveyCount={openSurveyCount}
          surveyCount={managedSurveys.length}
          showSurveyStats={adminProfile?.role !== "listener"}
          loading={loading}
          isActionPending={isActionPending}
          onLogout={() => void handleLogout()}
          onRefresh={() =>
            void loadData("Dữ liệu đã được làm mới.", adminProfile?.role ?? "admin")
          }
        />

        <AdminTabs
          activeTab={effectiveActiveTab}
          role={adminProfile?.role}
          onChange={setActiveTab}
        />

        {adminProfile?.role === "listener" && !currentDevicePushEnabled && (
          <div className="rounded-box border-border mb-4 flex flex-col gap-3 border bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-foreground text-sm font-bold uppercase">
                Tài khoản người phụ trách
              </p>
              <p className="text-muted-foreground text-xs font-semibold">
                Bạn chỉ thấy phiếu thuộc nhóm nội dung được phân công.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void enablePushForListener()}
              disabled={isActionPending(
                `listener:${adminProfile.listenerId || "self"}:push`,
              )}
              className="btn btn-primary btn-sm focus-lift px-3 text-xs font-semibold uppercase"
            >
              Bật thông báo trên thiết bị này
            </button>
          </div>
        )}

        {adminError && (
          <div className="rounded-field mb-4 border border-red-100 bg-red-50 p-3 text-sm font-bold text-red-700">
            {adminError}
          </div>
        )}

        {effectiveActiveTab === "tickets" ? (
          <TicketsTab
            tickets={filteredTickets}
            query={query}
            statusFilter={statusFilter}
            categoryFilter={effectiveCategoryFilter}
            allowedCategoryIds={listenerAllowedCategoryIds}
            isActionPending={isActionPending}
            onQueryChange={setQuery}
            onStatusFilterChange={setStatusFilter}
            onCategoryFilterChange={setCategoryFilter}
            onPatchDraft={patchTicketDraft}
            onSaveReply={(ticketCode) => void saveTicketReply(ticketCode)}
            onSavePatch={(ticketCode, patch, actionKey) =>
              void saveTicketPatch(ticketCode, patch, actionKey)
            }
            onDeleteRequest={setDeleteConfirm}
          />
        ) : effectiveActiveTab === "surveys" && adminProfile?.role !== "listener" ? (
          <SurveysTab
            surveyDraft={surveyDraft}
            surveys={managedSurveys}
            copiedId={copiedId}
            copiedQrId={copiedQrId}
            copyingQrId={copyingQrId}
            qrCopyErrorId={qrCopyErrorId}
            isActionPending={isActionPending}
            setSurveyDraft={setSurveyDraft}
            onCreateSurvey={(event) => void createSurvey(event)}
            surveyShareUrl={surveyShareUrl}
            onPatchDraft={patchSurveyDraft}
            onSave={(survey, actionKey) => void saveSurvey(survey, actionKey)}
            onCopyLink={(surveyId) => void copySurveyLink(surveyId)}
            onCopyQr={(surveyId) => void copySurveyQr(surveyId)}
            onDeleteRequest={setDeleteConfirm}
          />
        ) : effectiveActiveTab === "listeners" && adminProfile?.role !== "listener" ? (
          <ListenersTab
            listenerDraft={listenerDraft}
            listeners={managedListeners}
            isActionPending={isActionPending}
            setListenerDraft={setListenerDraft}
            onCreateListener={(event) => void createListener(event)}
            onSave={saveListener}
            onMove={(listenerId, direction) =>
              void moveListener(listenerId, direction)
            }
            onToggleDraftCategory={toggleDraftCategory}
            onEnablePush={(listener) => void enablePushForListener(listener)}
            onDeleteRequest={setDeleteConfirm}
          />
        ) : adminProfile ? (
          <AccountTab
            profile={adminProfile}
            listeners={managedListeners}
            onProfileChange={setAdminProfile}
            onEnablePush={() => enablePushForListener()}
            onDisablePush={disablePushForCurrentDevice}
            pushActionPending={isActionPending(
              `listener:${adminProfile.listenerId || "self"}:push`,
            )}
            onLinkedDataChange={() =>
              loadData(undefined, adminProfile.role)
            }
            onUnauthorized={clearAdminState}
          />
        ) : null}
      </div>
      {deleteConfirm && (
        <DeleteDialog
          target={deleteConfirm}
          isActionPending={isActionPending}
          onCancel={() => setDeleteConfirm(null)}
          onConfirm={() => void confirmDelete()}
        />
      )}
    </main>
  );
}
