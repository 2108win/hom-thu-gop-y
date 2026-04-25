"use client";

import {
  AlertTriangle,
  ClipboardList,
  Download,
  FileText,
  Headphones,
  ListChecks,
  LoaderCircle,
  LockKeyhole,
  MessageSquareText,
  PenLine,
  Phone,
  Search,
  Send,
  Settings,
  Share,
  ShieldCheck,
  ShieldUser,
  SquarePlus,
  User,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { FixedFooter, MarqueeBar } from "@/components/site-frame";
import {
  normalizeTicketCode,
  type ManagedListener,
  type StoredTicket,
} from "@/lib/data-models";
import {
  categories,
  listenerUsers,
  logoPath,
  quickMessages,
  unitName,
} from "@/lib/site-data";

type Tab = "submit" | "search";
type FeedbackAppProps = {
  initialListeners?: ManagedListener[];
};

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const workflowSteps = [
  { label: "Chọn nhóm", icon: ListChecks },
  { label: "Gửi góp ý", icon: MessageSquareText },
  { label: "Nhận mã", icon: ShieldCheck },
];
const minimumContentLength = 30;

const fallbackListeners = Object.values(listenerUsers).map((listener) => ({
  ...listener,
  assigned_categories: categories
    .filter((category) => category.assigned.includes(listener.id))
    .map((category) => category.id),
  is_enabled: true,
  created_at: "",
  updated_at: "",
})) satisfies ManagedListener[];

function getMeaningfulContent(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => {
      const cleaned = line.replace(/^[-•]\s*/, "").trim();
      if (!cleaned) {
        return "";
      }

      const fieldMatch = cleaned.match(/^[^:]{2,80}:\s*(.*)$/);
      return fieldMatch ? fieldMatch[1].trim() : cleaned;
    })
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

export function FeedbackApp({
  initialListeners = fallbackListeners,
}: FeedbackAppProps) {
  const [tab, setTab] = useState<Tab>("submit");
  const [categoryId, setCategoryId] = useState("");
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [modalTicket, setModalTicket] = useState<StoredTicket | null>(null);
  const [errorModal, setErrorModal] = useState("");
  const [searchCode, setSearchCode] = useState("");
  const [searchResult, setSearchResult] = useState<
    StoredTicket | "not-found" | null
  >(null);
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const assignedListeners = useMemo(() => {
    const selected = categories.find((category) => category.id === categoryId);
    if (!selected) {
      return [];
    }

    return initialListeners
      .filter(
        (listener) =>
          listener.is_enabled &&
          listener.assigned_categories.includes(selected.id),
      )
      .sort((a, b) => a.order - b.order);
  }, [categoryId, initialListeners]);
  const meaningfulContent = useMemo(
    () => getMeaningfulContent(message),
    [message],
  );
  const isContentClear = meaningfulContent.length >= minimumContentLength;

  const readErrorMessage = async (response: Response) => {
    try {
      const data = (await response.json()) as { message?: string };
      return data.message || "Có lỗi xảy ra.";
    } catch {
      return "Có lỗi xảy ra.";
    }
  };

  useEffect(() => {
    const isIos = () =>
      /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
    const isStandalone = () => {
      const nav = window.navigator as Navigator & { standalone?: boolean };
      return (
        Boolean(nav.standalone) ||
        window.matchMedia("(display-mode: standalone)").matches
      );
    };

    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
      if (!isStandalone()) {
        setShowInstall(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleInstallPrompt);
    const iosInstallCheck = window.setTimeout(() => {
      if (isIos() && !isStandalone()) {
        setShowInstall(true);
      }
    }, 0);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
      window.clearTimeout(iosInstallCheck);
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!categoryId || !message.trim()) {
      setErrorModal("Vui lòng chọn nhóm nội dung và nhập nội dung góp ý.");
      return;
    }
    if (!isAnonymous && (!name.trim() || !unit.trim())) {
      setErrorModal(
        "Vui lòng nhập đầy đủ họ tên và đơn vị, hoặc chọn gửi ẩn danh.",
      );
      return;
    }
    if (!isContentClear) {
      setErrorModal(
        "Nội dung cần cụ thể hơn. Vui lòng nêu rõ sự việc, thời gian, địa điểm, người/bộ phận liên quan nếu có và đề xuất xử lý.",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          categoryId,
          message: message.trim(),
          isAnonymous,
          name: isAnonymous ? "" : name.trim(),
          unit: isAnonymous ? "" : unit.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }

      const data = (await response.json()) as { ticket: StoredTicket };
      setModalTicket(data.ticket);
      setCategoryId("");
      setMessage("");
      setName("");
      setUnit("");
      setIsAnonymous(false);
    } catch (error) {
      setErrorModal(
        error instanceof Error ? error.message : "Không thể gửi nội dung.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const applyTemplate = (template: (typeof quickMessages)[number]) => {
    setCategoryId(template.categoryId);
    setMessage(template.body);
    window.requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });
  };

  const handleSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = normalizeTicketCode(searchCode);
    if (!normalized) {
      setSearchResult("not-found");
      return;
    }

    setIsSearching(true);
    setSearchResult(null);
    try {
      const response = await fetch(
        `/api/tickets/${encodeURIComponent(normalized)}`,
      );

      if (response.status === 404) {
        setSearchResult("not-found");
        return;
      }

      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }

      const data = (await response.json()) as { ticket: StoredTicket };
      setSearchResult(data.ticket);
    } catch (error) {
      setErrorModal(
        error instanceof Error ? error.message : "Không thể tra cứu mã phiếu.",
      );
    } finally {
      setIsSearching(false);
    }
  };

  const handleInstallClick = async () => {
    const isIos = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());

    if (isIos) {
      setShowIosModal(true);
      return;
    }

    if (!installEvent) {
      setErrorModal(
        "Trình duyệt đã cài ứng dụng hoặc không hỗ trợ cài đặt tự động.",
      );
      return;
    }

    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === "accepted") {
      setShowInstall(false);
    }
    setInstallEvent(null);
  };

  return (
    <main className="site-canvas bg-background text-foreground flex min-h-dvh flex-col">
      <MarqueeBar />

      <div className="flex-1">
        <section className="mx-auto max-w-5xl px-3 py-15 sm:px-5">
          <div className="command-shell reveal-up overflow-hidden">
            <div className="command-hero p-4 text-white sm:p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <span className="lux-badge flex items-center gap-2 px-3 py-1 text-[10px] font-semibold tracking-[0.14em] text-(--military-cream) uppercase">
                  <ShieldCheck className="size-3" />
                  Tiếp nhận bảo mật
                </span>
                <Link
                  href="/quan-tri"
                  title="Đăng nhập quản trị"
                  className="btn btn-square btn-outline focus-lift border-(--military-medal-soft)/40 bg-white/10 text-(--military-cream) hover:bg-white/20 hover:text-white"
                >
                  <Settings className="size-5" />
                </Link>
              </div>

              <div className="grid items-center gap-5 sm:grid-cols-[6rem_1fr]">
                <Image
                  src={logoPath}
                  alt="Logo Lữ đoàn PPK234"
                  width={96}
                  height={96}
                  priority
                  className="mx-auto size-24 object-contain"
                  sizes="96px"
                />
                <div className="text-center sm:text-left">
                  <p className="text-xs font-semibold tracking-[0.18em] text-(--military-medal-soft) uppercase">
                    {unitName}
                  </p>
                  <h1 className="mt-2 text-4xl leading-10 font-black tracking-tight text-white uppercase sm:text-5xl sm:leading-13">
                    Hòm thư góp ý
                  </h1>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
                {workflowSteps.map((step, index) => {
                  const Icon = step.icon;

                  return (
                    <div
                      key={step.label}
                      className="metric-tile focus-lift flex items-center gap-3 p-3"
                    >
                      <div className="bg-accent text-accent-foreground flex size-10 shrink-0 items-center justify-center rounded-full">
                        <Icon className="size-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold tracking-[0.12em] text-white/55 uppercase">
                          Bước {index + 1}
                        </p>
                        <p className="text-xs font-semibold text-white uppercase">
                          {step.label}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 sm:p-5">
              <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Link
                  href="/khao-sat"
                  className="btn btn-primary focus-lift px-5 text-sm font-semibold uppercase shadow-lg shadow-green-950/15"
                >
                  <ClipboardList className="size-4" />
                  Khảo sát trực tuyến
                </Link>
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className={`btn btn-outline border-border text-primary focus-lift bg-secondary text-sm font-semibold uppercase hover:bg-white ${
                    showInstall ? "inline-flex" : "hidden"
                  }`}
                >
                  <Download className="size-4" />
                  Cài app
                </button>
                {!showInstall && (
                  <div className="shine-card btn text-primary inline-flex items-center justify-center gap-2 px-4 text-sm font-semibold uppercase">
                    <LockKeyhole className="size-4" />
                    Bảo mật
                  </div>
                )}
              </div>

              <div className="tabs tabs-box mb-4 grid w-full grid-cols-2">
                <button
                  type="button"
                  className={`tab gap-2 ${tab === "submit" ? "tab-active bg-primary text-primary-content" : ""}`}
                  onClick={() => setTab("submit")}
                >
                  <Send className="size-4" />
                  Gửi góp ý
                </button>
                <button
                  type="button"
                  className={`tab gap-2 ${tab === "search" ? "tab-active bg-error text-error-content" : ""}`}
                  onClick={() => setTab("search")}
                >
                  <Search className="size-4" />
                  Tra cứu
                </button>
              </div>

              {tab === "submit" && (
                <div className="space-y-4">
                  <div className="shine-card reveal-up reveal-delay-1 bg-accent/45 border-(--military-medal)/45 shadow-none">
                    <div className="p-4 pb-2">
                      <h3 className="text-accent-foreground text-xs font-semibold tracking-[0.14em] uppercase">
                        Mẫu khai báo nhanh
                      </h3>
                      <p className="text-accent-foreground/80 text-xs leading-5">
                        Nội dung là bắt buộc. Mẫu chỉ giúp trình bày rõ hơn,
                        không gửi thay đồng chí.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 gap-2 p-4 pt-2 sm:grid-cols-2">
                      {quickMessages.map((template) => (
                        <button
                          key={template.id}
                          type="button"
                          onClick={() => applyTemplate(template)}
                          className="btn btn-outline text-accent-foreground focus-lift hover:bg-accent/55 border-(--military-medal)/45 bg-white px-3 text-xs font-bold"
                        >
                          <FileText className="size-4" />
                          {template.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {assignedListeners.length > 0 && (
                    <div className="shine-card reveal-up reveal-delay-2 border-primary/10 bg-primary/5 shadow-none">
                      <div className="p-4 pb-2">
                        <h3 className="text-primary flex items-center gap-2 text-xs font-semibold tracking-[0.12em] uppercase">
                          <Headphones className="size-4" />
                          Bộ phận tiếp nhận
                        </h3>
                      </div>
                      <div className="grid gap-2 p-4 pt-2">
                        {assignedListeners.map((user) => (
                          <div
                            key={user.id}
                            className="focus-lift rounded-box flex items-center justify-between gap-3 border border-white bg-white p-3 shadow-sm"
                          >
                            <div className="flex min-w-0 items-center gap-2">
                              <div className="bg-primary flex size-10 shrink-0 items-center justify-center rounded-full text-white">
                                <ShieldUser className="size-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-foreground truncate text-sm font-semibold">
                                  {user.rank} {user.fullname}
                                </p>
                                <p className="text-muted-foreground text-xs leading-4 font-medium">
                                  {user.position}
                                </p>
                              </div>
                            </div>
                            <a
                              href={`tel:${user.phone}`}
                              className="btn btn-outline btn-sm focus-lift shrink-0 border-emerald-100 bg-emerald-50 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                            >
                              <Phone className="size-3" />
                              Gọi
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <form
                    className="shine-card reveal-up reveal-delay-2 flex flex-col gap-4"
                    onSubmit={handleSubmit}
                  >
                    <div className="relative flex items-center gap-4 px-4 pt-4">
                      <ListChecks className="text-primary pointer-events-none z-10 size-5" />
                      <select
                        value={categoryId}
                        onChange={(event) => setCategoryId(event.target.value)}
                        required
                        className="select select-bordered bg-base-100 h-10 w-full text-sm font-medium"
                      >
                        <option value="" disabled>
                          Chọn nhóm nội dung cần góp ý
                        </option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="px-4">
                      <label className="border-border rounded-field text-foreground/85 flex cursor-pointer items-center gap-3 border bg-white p-3 text-sm font-semibold">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-primary z-10 size-5 border border-gray-300"
                          checked={isAnonymous}
                          onChange={(event) =>
                            setIsAnonymous(event.target.checked)
                          }
                        />
                        <span className="text-foreground/85 text-sm font-semibold">
                          Gửi ẩn danh
                        </span>
                        <span className="text-muted-foreground/70 ml-auto text-xs font-semibold">
                          Không lưu họ tên
                        </span>
                      </label>
                    </div>

                    {!isAnonymous && (
                      <div className="grid grid-cols-1 gap-3 overflow-hidden px-4 py-2 transition-all sm:grid-cols-2">
                        <div className="relative">
                          <User className="text-muted-foreground/70 pointer-events-none absolute top-1/2 left-4 z-10 size-4 -translate-y-1/2" />
                          <input
                            type="text"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            required={!isAnonymous}
                            placeholder="Họ tên"
                            className="input input-bordered border-border bg-muted focus:border-primary h-10 w-full pl-11 text-sm transition focus:bg-white"
                          />
                        </div>
                        <div className="relative">
                          <Users className="text-muted-foreground/70 pointer-events-none absolute top-1/2 left-4 z-10 size-4 -translate-y-1/2" />
                          <input
                            type="text"
                            value={unit}
                            onChange={(event) => setUnit(event.target.value)}
                            required={!isAnonymous}
                            placeholder="Đơn vị"
                            className="input input-bordered border-border bg-muted focus:border-primary h-10 w-full pl-11 text-sm transition focus:bg-white"
                          />
                        </div>
                      </div>
                    )}
                    <div className="relative px-4">
                      <PenLine className="text-muted-foreground/70 pointer-events-none absolute top-4 left-8 z-10 size-5" />
                      <textarea
                        ref={textareaRef}
                        value={message}
                        onChange={(event) => setMessage(event.target.value)}
                        rows={8}
                        required
                        placeholder="Nêu rõ: sự việc/vấn đề gì, xảy ra khi nào, ở đâu, ai/bộ phận nào liên quan nếu có, ảnh hưởng ra sao và đề xuất xử lý..."
                        className="textarea textarea-bordered border-border bg-muted text-foreground placeholder:text-muted-foreground/70 focus:border-primary min-h-40 w-full resize-none pl-12 text-sm leading-6 transition focus:bg-white"
                      />
                    </div>
                    <div className="px-4">
                      <div className="alert border-border/60 bg-muted flex w-full flex-wrap items-center justify-between gap-1 text-xs">
                        <span className="text-muted-foreground font-semibold">
                          Cần đủ ý để người xử lý nắm đúng sự việc.
                        </span>
                        <span
                          className={`font-semibold ${
                            isContentClear ? "text-emerald-700" : "text-red-700"
                          }`}
                        >
                          {meaningfulContent.length}/{minimumContentLength} ký
                          tự nội dung
                        </span>
                      </div>
                    </div>
                    <div className="px-4 pb-4">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn btn-error focus-lift w-full border border-red-300/20 px-5 text-base font-semibold uppercase shadow-[0_18px_32px_-18px_rgba(165,20,34,0.55)]"
                      >
                        {isSubmitting ? (
                          <LoaderCircle className="size-5 animate-spin" />
                        ) : (
                          <Send className="size-5" />
                        )}
                        {isSubmitting ? "Đang gửi" : "Gửi nội dung góp ý"}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {tab === "search" && (
                <div className="flex flex-col gap-4">
                  <div className="alert border-primary/10 bg-primary/5">
                    <div>
                      <span className="text-primary mb-1 block text-sm font-semibold">
                        Tra cứu kết quả xử lý
                      </span>
                      Nhập mã phiếu đã nhận sau khi gửi. Ví dụ: GP-AB1234.
                    </div>
                  </div>

                  <form className="space-y-3" onSubmit={handleSearch}>
                    <div className="relative">
                      <Search className="text-primary pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchCode}
                        onChange={(event) => setSearchCode(event.target.value)}
                        disabled={isSearching}
                        placeholder="GP-...."
                        className="input input-bordered border-border bg-muted text-destructive focus:border-primary h-12 w-full pl-12 text-center font-mono text-2xl font-semibold tracking-widest uppercase focus:bg-white"
                      />
                    </div>
                    <button
                      disabled={isSearching}
                      className="btn btn-primary focus-lift w-full text-base font-semibold uppercase shadow-lg shadow-green-950/20"
                    >
                      {isSearching ? (
                        <LoaderCircle className="size-5 animate-spin" />
                      ) : (
                        <Search className="size-5" />
                      )}
                      {isSearching ? "Đang tra cứu" : "Tra cứu"}
                    </button>
                  </form>

                  {searchResult === "not-found" && (
                    <div className="alert alert-error">
                      <div className="flex gap-3 font-bold">
                        <AlertTriangle className="size-5 shrink-0" />
                        Không tìm thấy mã phiếu. Đồng chí kiểm tra lại mã đã
                        lưu.
                      </div>
                    </div>
                  )}

                  {searchResult && searchResult !== "not-found" && (
                    <div className="shine-card animate-fade-in bg-white shadow-sm">
                      <div className="border-border/60 border-b p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-destructive font-mono text-xl">
                              {searchResult.ticket_code}
                            </h3>
                            <p className="mt-1 text-[11px] font-bold uppercase">
                              {searchResult.created_at}
                            </p>
                          </div>
                          <span
                            className={`badge border px-2 ${
                              searchResult.status === "done"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "bg-accent/70 text-accent-foreground border-(--military-medal)/45"
                            }`}
                          >
                            {searchResult.status === "done"
                              ? "Đã xử lý"
                              : "Đang chờ"}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-4 p-4">
                        <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                          <div className="border-border/60 bg-muted rounded-box border p-3">
                            <p className="text-muted-foreground/70 mb-1 font-semibold tracking-[0.12em] uppercase">
                              Nhóm nội dung
                            </p>
                            <p className="text-foreground/85 font-bold">
                              {searchResult.category || "Chưa phân loại"}
                            </p>
                          </div>
                          <div className="border-border/60 bg-muted rounded-box border p-3">
                            <p className="text-muted-foreground/70 mb-1 font-semibold tracking-[0.12em] uppercase">
                              Người gửi
                            </p>
                            <p className="text-foreground/85 font-bold">
                              {searchResult.is_anonymous
                                ? "Ẩn danh"
                                : searchResult.name || "Chưa ghi tên"}
                            </p>
                          </div>
                        </div>
                        <div>
                          <p className="text-muted-foreground/70 mb-1 text-[11px] font-semibold tracking-[0.12em] uppercase">
                            Nội dung gửi
                          </p>
                          <p className="border-border/60 rounded-box bg-muted text-foreground/85 border p-3 text-sm leading-6 break-words whitespace-pre-wrap">
                            {searchResult.message}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground/70 mb-1 text-[11px] font-semibold tracking-[0.12em] uppercase">
                            Kết quả giải quyết
                          </p>
                          {searchResult.admin_reply ? (
                            <div className="border-primary/10 rounded-box bg-primary/5 text-foreground border p-3 text-sm leading-6">
                              <p>{searchResult.admin_reply}</p>
                              <p className="text-primary mt-2 text-right text-[11px] font-semibold uppercase">
                                {searchResult.replied_by || "Bộ phận xử lý"}
                                {searchResult.replied_at
                                  ? ` - ${searchResult.replied_at}`
                                  : ""}
                              </p>
                            </div>
                          ) : (
                            <p className="border-border/60 text-muted-foreground/70 rounded-box border bg-white p-3 text-sm italic">
                              Chưa có phản hồi từ bộ phận xử lý.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      <FixedFooter />

      {showIosModal ? (
        <div className="modal modal-open" role="dialog" aria-modal="true">
          <div className="modal-box max-w-sm text-center">
            <div className="bg-primary mx-auto mb-4 flex size-14 items-center justify-center text-white">
              <Download className="size-7" />
            </div>
            <h2 className="text-foreground text-lg font-semibold">
              Cài đặt trên iPhone
            </h2>
            <p className="text-muted-foreground mt-3 text-left leading-6">
              1. Nhấn nút <b>Chia sẻ</b> ở thanh menu dưới của Safari.
              <br />
              2. Chọn <b>Thêm vào màn hình chính</b>.
              <br />
              3. Nhấn <b>Thêm</b> để hoàn tất.
            </p>
            <div className="text-muted-foreground mt-5 flex justify-center gap-3">
              <Share className="size-5" />
              <SquarePlus className="size-5" />
            </div>
            <div className="modal-action">
              <button
                type="button"
                onClick={() => setShowIosModal(false)}
                className="btn btn-primary w-full font-semibold uppercase"
              >
                Đã hiểu
              </button>
            </div>
          </div>
          <button
            type="button"
            className="modal-backdrop"
            aria-label="Đóng"
            onClick={() => setShowIosModal(false)}
          />
        </div>
      ) : null}

      {modalTicket || errorModal ? (
        <div className="modal modal-open" role="dialog" aria-modal="true">
          <div className="modal-box max-w-sm text-center">
            {modalTicket ? (
              <>
                <div className="bg-primary mx-auto mb-4 flex size-16 items-center justify-center rounded-full text-white">
                  <ShieldCheck className="size-8" />
                </div>
                <h2 className="text-foreground text-xl font-semibold">
                  Đã tiếp nhận nội dung
                </h2>
                <p className="text-muted-foreground mt-2">
                  Đồng chí lưu lại mã tra cứu để theo dõi kết quả xử lý.
                </p>
                <div className="alert bg-accent/55 text-muted-foreground mt-5 border-(--military-medal)/35 text-left">
                  <span>{modalTicket.bot_reply}</span>
                </div>
                <div className="border-border bg-muted rounded-box mt-4 border p-4">
                  <span className="text-muted-foreground/70 mb-1 block text-[11px] font-semibold tracking-[0.14em] uppercase">
                    Mã tra cứu
                  </span>
                  <strong className="text-destructive font-mono text-3xl select-all">
                    {modalTicket.ticket_code}
                  </strong>
                </div>
                <p className="text-muted-foreground mt-3 text-xs font-semibold">
                  Đồng chí lưu lại mã này để tra cứu kết quả xử lý.
                </p>
              </>
            ) : (
              <>
                <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-red-50 text-red-700">
                  <AlertTriangle className="size-7" />
                </div>
                <h2 className="text-foreground text-lg font-semibold">
                  Cần kiểm tra lại
                </h2>
                <p className="text-muted-foreground mt-2">{errorModal}</p>
              </>
            )}
            <div className="modal-action">
              <button
                type="button"
                onClick={() => {
                  setModalTicket(null);
                  setErrorModal("");
                }}
                className="btn btn-secondary w-full font-semibold uppercase"
              >
                Đóng lại
              </button>
            </div>
          </div>
          <button
            type="button"
            className="modal-backdrop"
            aria-label="Đóng"
            onClick={() => {
              setModalTicket(null);
              setErrorModal("");
            }}
          />
        </div>
      ) : null}
    </main>
  );
}
