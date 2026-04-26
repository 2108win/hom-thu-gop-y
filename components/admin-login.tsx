"use client";

import { FormEvent, useMemo, useState, useSyncExternalStore } from "react";

import { AdminTabs } from "@/components/admin/admin-tabs";
import { DashboardHeader } from "@/components/admin/dashboard-header";
import { DeleteDialog } from "@/components/admin/delete-dialog";
import {
  exportListeners,
  exportSurveys,
  exportTickets,
} from "@/components/admin/exporters";
import { ListenersTab } from "@/components/admin/listeners-tab";
import { LoginForm } from "@/components/admin/login-form";
import { SurveysTab } from "@/components/admin/surveys-tab";
import { TicketsTab } from "@/components/admin/tickets-tab";
import type {
  AdminTab,
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

function subscribeToOrigin() {
  return () => undefined;
}

function getBrowserOrigin() {
  return typeof window === "undefined" ? "" : window.location.origin;
}

function getServerOrigin() {
  return "";
}

export function AdminLogin() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
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
  const [loginError, setLoginError] = useState("");
  const [adminError, setAdminError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingActions, setPendingActions] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState("");
  const [copiedQrId, setCopiedQrId] = useState("");
  const [copyingQrId, setCopyingQrId] = useState("");
  const [qrCopyErrorId, setQrCopyErrorId] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirm | null>(
    null,
  );
  const origin = useSyncExternalStore(
    subscribeToOrigin,
    getBrowserOrigin,
    getServerOrigin,
  );

  const readErrorMessage = async (response: Response) => {
    try {
      const data = (await response.json()) as { message?: string };
      return data.message || "Có lỗi xảy ra.";
    } catch {
      return "Có lỗi xảy ra.";
    }
  };

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

  const loadData = async () => {
    setLoading(true);
    setAdminError("");

    try {
      const [ticketsResponse, surveysResponse, listenersResponse] =
        await Promise.all([
          fetch("/api/admin/tickets", { cache: "no-store" }),
          fetch("/api/admin/surveys", { cache: "no-store" }),
          fetch("/api/admin/listeners", { cache: "no-store" }),
        ]);

      if (
        ticketsResponse.status === 401 ||
        surveysResponse.status === 401 ||
        listenersResponse.status === 401
      ) {
        setIsLoggedIn(false);
        throw new Error("Phiên quản trị đã hết hạn.");
      }
      if (!ticketsResponse.ok) {
        throw new Error(await readErrorMessage(ticketsResponse));
      }
      if (!surveysResponse.ok) {
        throw new Error(await readErrorMessage(surveysResponse));
      }
      if (!listenersResponse.ok) {
        throw new Error(await readErrorMessage(listenersResponse));
      }

      const ticketsData = (await ticketsResponse.json()) as {
        tickets: StoredTicket[];
      };
      const surveysData = (await surveysResponse.json()) as {
        surveys: ManagedSurvey[];
      };
      const listenersData = (await listenersResponse.json()) as {
        listeners: ManagedListener[];
      };

      setTickets(ticketsData.tickets);
      setManagedSurveys(surveysData.surveys);
      setManagedListeners(listenersData.listeners);
    } catch (error) {
      setAdminError(
        error instanceof Error ? error.message : "Không thể tải dữ liệu.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const user = String(formData.get("user") ?? "").trim();
    const pass = String(formData.get("pass") ?? "").trim();

    setLoginError("");
    setLoading(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user, password: pass }),
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }

      setIsLoggedIn(true);
      await loadData();
    } catch (error) {
      setLoginError(
        error instanceof Error
          ? error.message
          : "Sai tài khoản hoặc mật khẩu quản trị.",
      );
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
      } catch (error) {
        setAdminError(
          error instanceof Error ? error.message : "Không thể cập nhật phiếu.",
        );
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
    } catch (error) {
      setAdminError(
        error instanceof Error ? error.message : "Không thể xóa phiếu.",
      );
    }
  };

  const createSurvey = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await runWithActionLoading("survey:create", async () => {
      setAdminError("");

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
      } catch (error) {
        setAdminError(
          error instanceof Error ? error.message : "Không thể tạo khảo sát.",
        );
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
      } catch (error) {
        setAdminError(
          error instanceof Error ? error.message : "Không thể lưu khảo sát.",
        );
      }
    });
  };

  const deleteSurvey = async (surveyId: string) => {
    setAdminError("");
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
    } catch (error) {
      setAdminError(
        error instanceof Error ? error.message : "Không thể xóa khảo sát.",
      );
    }
  };

  const createListener = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await runWithActionLoading("listener:create", async () => {
      setAdminError("");

      try {
        const response = await fetch("/api/admin/listeners", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(listenerDraft),
        });

        if (!response.ok) {
          throw new Error(await readErrorMessage(response));
        }

        const data = (await response.json()) as { listener: ManagedListener };
        setManagedListeners((current) =>
          [data.listener, ...current].sort((a, b) => a.order - b.order),
        );
        setListenerDraft(defaultListenerDraft());
      } catch (error) {
        setAdminError(
          error instanceof Error
            ? error.message
            : "Không thể tạo người phụ trách.",
        );
      }
    });
  };

  const patchListenerDraft = (
    listenerId: string,
    patch: Partial<ManagedListener>,
  ) => {
    setManagedListeners((current) =>
      current.map((listener) =>
        listener.id === listenerId ? { ...listener, ...patch } : listener,
      ),
    );
  };

  const saveListener = async (
    listener: ManagedListener,
    actionKey = `listener:${listener.id}:save`,
  ) => {
    await runWithActionLoading(actionKey, async () => {
      setAdminError("");

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
          current
            .map((item) => (item.id === listener.id ? data.listener : item))
            .sort((a, b) => a.order - b.order),
        );
      } catch (error) {
        setAdminError(
          error instanceof Error
            ? error.message
            : "Không thể lưu người phụ trách.",
        );
      }
    });
  };

  const deleteListener = async (listenerId: string) => {
    setAdminError("");
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
    } catch (error) {
      setAdminError(
        error instanceof Error
          ? error.message
          : "Không thể xóa người phụ trách.",
      );
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

  const toggleListenerCategory = (listenerId: string, categoryId: string) => {
    setManagedListeners((current) =>
      current.map((listener) => {
        if (listener.id !== listenerId) {
          return listener;
        }

        const assigned = listener.assigned_categories.includes(categoryId)
          ? listener.assigned_categories.filter((item) => item !== categoryId)
          : [...listener.assigned_categories, categoryId];

        return { ...listener, assigned_categories: assigned };
      }),
    );
  };

  const toggleDraftCategory = (categoryId: string) => {
    setListenerDraft((current) => {
      const assigned = current.assigned_categories.includes(categoryId)
        ? current.assigned_categories.filter((item) => item !== categoryId)
        : [...current.assigned_categories, categoryId];

      return { ...current, assigned_categories: assigned };
    });
  };

  const handleLogout = async () => {
    await runWithActionLoading("logout", async () => {
      await fetch("/api/admin/login", { method: "DELETE" }).catch(
        () => undefined,
      );
      setIsLoggedIn(false);
      setTickets([]);
      setManagedSurveys([]);
      setManagedListeners([]);
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

  const filteredTickets = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return tickets.filter((ticket) => {
      const matchedStatus =
        statusFilter === "all" || ticket.status === statusFilter;
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

      return matchedStatus && matchedQuery;
    });
  }, [query, statusFilter, tickets]);

  const pendingCount = tickets.filter(
    (ticket) => ticket.status === "pending",
  ).length;
  const doneCount = tickets.filter((ticket) => ticket.status === "done").length;
  const openSurveyCount = managedSurveys.filter((survey) =>
    isSurveyOpen(survey),
  ).length;

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
          ticketCount={tickets.length}
          pendingCount={pendingCount}
          doneCount={doneCount}
          openSurveyCount={openSurveyCount}
          surveyCount={managedSurveys.length}
          loading={loading}
          isActionPending={isActionPending}
          onLogout={() => void handleLogout()}
          onRefresh={() => void loadData()}
        />

        <AdminTabs activeTab={activeTab} onChange={setActiveTab} />

        {adminError && (
          <div className="rounded-field mb-4 border border-red-100 bg-red-50 p-3 text-sm font-bold text-red-700">
            {adminError}
          </div>
        )}

        {activeTab === "tickets" ? (
          <TicketsTab
            tickets={filteredTickets}
            query={query}
            statusFilter={statusFilter}
            isActionPending={isActionPending}
            onQueryChange={setQuery}
            onStatusFilterChange={setStatusFilter}
            onExport={() => exportTickets(tickets)}
            onPatchDraft={patchTicketDraft}
            onSaveReply={(ticketCode) => void saveTicketReply(ticketCode)}
            onSavePatch={(ticketCode, patch, actionKey) =>
              void saveTicketPatch(ticketCode, patch, actionKey)
            }
            onDeleteRequest={setDeleteConfirm}
          />
        ) : activeTab === "surveys" ? (
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
            onExport={() => exportSurveys(managedSurveys)}
            surveyShareUrl={surveyShareUrl}
            onPatchDraft={patchSurveyDraft}
            onSave={(survey, actionKey) => void saveSurvey(survey, actionKey)}
            onCopyLink={(surveyId) => void copySurveyLink(surveyId)}
            onCopyQr={(surveyId) => void copySurveyQr(surveyId)}
            onDeleteRequest={setDeleteConfirm}
          />
        ) : (
          <ListenersTab
            listenerDraft={listenerDraft}
            listeners={managedListeners}
            isActionPending={isActionPending}
            setListenerDraft={setListenerDraft}
            onCreateListener={(event) => void createListener(event)}
            onExport={() => exportListeners(managedListeners)}
            onPatchDraft={patchListenerDraft}
            onSave={(listener, actionKey) =>
              void saveListener(listener, actionKey)
            }
            onToggleCategory={toggleListenerCategory}
            onToggleDraftCategory={toggleDraftCategory}
            onDeleteRequest={setDeleteConfirm}
          />
        )}
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
