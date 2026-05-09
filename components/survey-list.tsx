"use client";

import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Check,
  ChevronRight,
  ClipboardList,
  Copy,
  ExternalLink,
  LinkIcon,
  LoaderCircle,
  QrCode,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";

import { RetryableQrImage } from "@/components/retryable-qr-image";
import type { ManagedSurvey } from "@/lib/data-models";
import { copyQrImageToClipboard } from "@/lib/qr-clipboard";
import { appName, logoPath, unitName } from "@/lib/site-data";

type SurveyListProps = {
  initialSurveys: ManagedSurvey[];
  initialError?: string;
};

function subscribeToOrigin() {
  return () => undefined;
}

function getBrowserOrigin() {
  return typeof window === "undefined" ? "" : window.location.origin;
}

function getServerOrigin() {
  return "";
}

function formatSurveyDate(value: string, boundary: "start" | "end") {
  const [date, timeValue] = value.split("T");
  const [year, month, day] = date.split("-");
  if (!year || !month || !day) {
    return value;
  }

  const time =
    timeValue?.slice(0, 5) || (boundary === "start" ? "00:00" : "23:59");

  return `${day}/${month}/${year} ${time}`;
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function SurveyList({
  initialSurveys,
  initialError = "",
}: SurveyListProps) {
  const router = useRouter();
  const [surveys, setSurveys] = useState<ManagedSurvey[]>(initialSurveys);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialError);
  const origin = useSyncExternalStore(
    subscribeToOrigin,
    getBrowserOrigin,
    getServerOrigin,
  );
  const [copiedId, setCopiedId] = useState("");
  const [copiedQrId, setCopiedQrId] = useState("");
  const [copyingQrId, setCopyingQrId] = useState("");
  const [qrCopyErrorId, setQrCopyErrorId] = useState("");

  const empty = useMemo(
    () => !loading && surveys.length === 0,
    [loading, surveys.length],
  );
  const initialLoading = loading && surveys.length === 0;

  async function loadSurveys() {
    setLoading(true);
    setError("");
    const toastId = toast.loading("Đang tải danh sách khảo sát...");

    try {
      const response = await fetch("/api/surveys", { cache: "no-store" });
      if (!response.ok) {
        let message = "Không thể tải dữ liệu.";
        try {
          const data = (await response.json()) as { message?: string };
          message = data.message || message;
        } catch {
          // Keep the fallback message when the server returns a non-JSON error.
        }
        throw new Error(message);
      }

      const data = (await response.json()) as { surveys: ManagedSurvey[] };
      setSurveys(data.surveys);
      toast.success("Đã cập nhật danh sách khảo sát.", { id: toastId });
    } catch (loadError) {
      const message = errorMessage(
        loadError,
        "Không thể tải danh sách khảo sát.",
      );
      setError(message);
      toast.error(message, { id: toastId });
    } finally {
      setLoading(false);
    }
  }

  function surveyPath(id: string) {
    return `/khao-sat/${encodeURIComponent(id)}`;
  }

  function surveyUrl(id: string) {
    return origin ? `${origin}${surveyPath(id)}` : surveyPath(id);
  }

  async function copySurveyLink(survey: ManagedSurvey) {
    const url = surveyUrl(survey.id);
    try {
      if (!navigator.clipboard) {
        throw new Error("Clipboard unavailable");
      }
      await navigator.clipboard?.writeText(url);
    } catch {
      toast.error("Không thể sao chép link.");
      return;
    }
    setCopiedId(survey.id);
    toast.success("Đã sao chép link khảo sát.");
    window.setTimeout(() => setCopiedId(""), 1600);
  }

  async function copySurveyQr(survey: ManagedSurvey) {
    setCopyingQrId(survey.id);
    setQrCopyErrorId("");

    try {
      await copyQrImageToClipboard(surveyUrl(survey.id));
      setCopiedQrId(survey.id);
      toast.success("Đã sao chép mã QR.");
      window.setTimeout(() => setCopiedQrId(""), 1600);
    } catch {
      setQrCopyErrorId(survey.id);
      toast.error("Không thể sao chép mã QR.");
      window.setTimeout(() => setQrCopyErrorId(""), 2200);
    } finally {
      setCopyingQrId("");
    }
  }

  return (
    <main className="site-canvas text-foreground flex flex-col">
      <div className="flex-1">
        <header className="command-hero border-b-4 border-(--military-medal) text-white shadow-sm">
          <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 sm:py-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <Link
                href="/"
                className="btn btn-outline focus-lift border-(--military-medal-soft)/30 bg-white/10 px-3 text-xs font-semibold tracking-[0.08em] text-(--military-cream) uppercase hover:bg-white/20 hover:text-white"
              >
                <ArrowLeft className="size-4" />
                Trang chính
              </Link>
              <button
                type="button"
                onClick={() => void loadSurveys()}
                disabled={loading}
                className="btn btn-outline focus-lift border-white/15 bg-white/10 px-3 text-xs font-semibold tracking-[0.08em] text-white uppercase hover:bg-white/20 hover:text-white"
              >
                <RefreshCcw
                  className={`size-4 ${loading ? "animate-spin" : ""}`}
                />
                Làm mới
              </button>
            </div>

            <div className="flex flex-col items-center gap-4 sm:grid sm:grid-cols-[4.5rem_1fr_auto]">
              <Image
                src={logoPath}
                alt="Logo Lữ đoàn PPK234"
                width={80}
                height={80}
                priority
                className="size-20 object-contain"
                sizes="80px"
              />

              <div className="min-w-0">
                <p className="lux-badge mb-2 inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold tracking-[0.14em] text-(--military-cream) uppercase">
                  <ShieldCheck className="size-3" />
                  {unitName}
                </p>
                <h1 className="text-2xl leading-7 font-semibold text-white uppercase sm:text-3xl sm:leading-9">
                  Hệ thống khảo sát trực tuyến
                </h1>
                <p className="mt-1 max-w-2xl text-sm leading-6 font-semibold text-(--military-cream)">
                  {appName}. Mỗi khảo sát dùng một đường dẫn nội bộ và mã QR
                  riêng, chỉ hiển thị trong thời gian tiếp nhận phản hồi.
                </p>
              </div>
            </div>
          </div>
        </header>

        <section className="mx-auto max-w-5xl px-4 py-5 sm:px-6 sm:py-6">
          <div className="shine-card reveal-up mb-4 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-primary mb-1 flex items-center gap-2 text-xs font-semibold tracking-[0.12em] uppercase">
                <ClipboardList className="size-4" />
                Danh sách hiện hành
              </p>
              <h2 className="text-foreground text-xl font-semibold uppercase">
                Khảo sát đang tiếp nhận
              </h2>
            </div>
            <div className="rounded-field inline-flex w-fit items-center gap-2 border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 uppercase">
              <CheckCircle2 className="size-4" />
              {loading ? "Đang cập nhật" : `${surveys.length} khảo sát`}
            </div>
          </div>

          {error && (
            <div className="mb-4 border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
              {error}
            </div>
          )}

          {initialLoading && (
            <div className="card shine-card border-base-300 bg-base-100 border text-center shadow-sm">
              <div className="card-body p-6">
                <div className="skeleton mx-auto mb-3 size-10" />
                <LoaderCircle className="text-primary mx-auto mb-3 size-6 animate-spin" />
                <p className="text-muted-foreground text-sm font-bold">
                  Đang tải danh sách khảo sát...
                </p>
              </div>
            </div>
          )}

          {empty && (
            <div className="card shine-card border-base-300 bg-base-100 border text-center shadow-sm">
              <div className="card-body p-7">
                <CalendarClock className="text-muted-foreground/35 mx-auto mb-3 size-8" />
                <h3 className="text-foreground mb-1 text-base font-semibold uppercase">
                  Chưa có khảo sát đang mở
                </h3>
              </div>
            </div>
          )}

          {!initialLoading && surveys.length > 0 && (
            <div className="space-y-3">
              {surveys.map((survey) => {
                const url = surveyUrl(survey.id);

                return (
                  <article
                    key={survey.id}
                    className="card shine-card focus-lift border-border overflow-hidden border bg-white shadow-sm"
                  >
                    <div className="grid gap-0 md:grid-cols-[1fr_12rem]">
                      <div className="p-4 sm:p-5">
                        <div className="mb-3 flex flex-wrap gap-2">
                          <span className="badge border border-emerald-200 bg-emerald-50 px-2 text-[10px] font-semibold tracking-[0.08em] text-emerald-700 uppercase">
                            <CheckCircle2 className="size-3" />
                            Đang mở
                          </span>
                          <span className="badge border-border bg-muted text-muted-foreground border px-2 text-[10px] font-semibold tracking-[0.08em] uppercase">
                            <CalendarClock className="size-3" />
                            {formatSurveyDate(
                              survey.start_date,
                              "start",
                            )} - {formatSurveyDate(survey.end_date, "end")}
                          </span>
                        </div>

                        <h3 className="text-foreground text-lg leading-6 font-semibold break-words">
                          {survey.title}
                        </h3>
                        {survey.description && (
                          <p className="text-muted-foreground mt-2 text-sm leading-6">
                            {survey.description}
                          </p>
                        )}

                        <div className="border-border/60 text-muted-foreground mt-4 space-y-2 border-t pt-3 text-xs">
                          <div className="flex min-w-0 items-center gap-2">
                            <LinkIcon className="text-primary size-4 shrink-0" />
                            <span className="text-muted-foreground/70 shrink-0 font-semibold uppercase">
                              Link:
                            </span>
                            <span className="line-clamp-1 min-w-0 font-mono break-all">
                              {url}
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-[auto_auto_1fr]">
                          <button
                            type="button"
                            onClick={() => copySurveyLink(survey)}
                            className="btn btn-outline focus-lift bg-accent text-accent-foreground hover:bg-accent/70 border-(--military-medal)"
                            aria-label={
                              copiedId === survey.id
                                ? "Đã sao chép link khảo sát"
                                : "Sao chép link khảo sát"
                            }
                            title={
                              copiedId === survey.id
                                ? "Đã sao chép"
                                : "Sao chép link"
                            }
                          >
                            {copiedId === survey.id ? (
                              <Check className="size-4 text-emerald-700" />
                            ) : (
                              <Copy className="size-4" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => copySurveyQr(survey)}
                            disabled={copyingQrId === survey.id}
                            className="btn btn-outline focus-lift text-primary hover:bg-accent/30 border-(--military-medal) bg-white"
                            aria-label={
                              copiedQrId === survey.id
                                ? "Đã sao chép QR khảo sát"
                                : qrCopyErrorId === survey.id
                                  ? "Không copy được QR khảo sát"
                                  : "Sao chép QR khảo sát"
                            }
                            title={
                              copiedQrId === survey.id
                                ? "Đã sao chép QR"
                                : qrCopyErrorId === survey.id
                                  ? "Không copy được"
                                  : "Sao chép QR"
                            }
                          >
                            {copyingQrId === survey.id ? (
                              <LoaderCircle className="size-4 animate-spin" />
                            ) : copiedQrId === survey.id ? (
                              <Check className="size-4 text-emerald-700" />
                            ) : (
                              <QrCode className="size-4" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => router.push(surveyPath(survey.id))}
                            className="btn btn-error focus-lift px-5 text-sm font-semibold uppercase shadow-[0_16px_28px_-18px_rgba(165,20,34,0.55)]"
                          >
                            <ExternalLink className="size-4" />
                            Tham gia khảo sát
                            <ChevronRight className="size-4" />
                          </button>
                        </div>
                      </div>

                      <aside className="border-border bg-muted flex items-center justify-center border-t p-4 md:border-t-0 md:border-l">
                        <div className="w-32 max-w-full">
                          <div className="border-border rounded-box border bg-white p-2">
                            <RetryableQrImage
                              text={url}
                              alt={`Mã QR khảo sát ${survey.title}`}
                            />
                          </div>
                          <p className="text-primary mt-2 text-center text-[10px] font-semibold tracking-widest uppercase">
                            Quét để mở
                          </p>
                        </div>
                      </aside>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
