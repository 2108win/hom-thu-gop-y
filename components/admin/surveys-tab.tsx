"use client";

import {
  CalendarClock,
  Copy,
  ExternalLink,
  LinkIcon,
  LoaderCircle,
  Plus,
  QrCode,
  Save,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import type { Dispatch, FormEvent, SetStateAction } from "react";

import type {
  DeleteConfirm,
  IsActionPending,
  SurveyDraft,
  SurveyPatch,
} from "@/components/admin/types";
import { toSurveyDateTimeInput } from "@/components/admin/utils";
import { RetryableQrImage } from "@/components/retryable-qr-image";
import { isSurveyOpen, type ManagedSurvey } from "@/lib/data-models";

type SurveysTabProps = {
  surveyDraft: SurveyDraft;
  surveys: ManagedSurvey[];
  copiedId: string;
  copiedQrId: string;
  copyingQrId: string;
  qrCopyErrorId: string;
  isActionPending: IsActionPending;
  setSurveyDraft: Dispatch<SetStateAction<SurveyDraft>>;
  onCreateSurvey: (event: FormEvent<HTMLFormElement>) => void;
  surveyShareUrl: (surveyId: string) => string;
  onPatchDraft: (surveyId: string, patch: SurveyPatch) => void;
  onSave: (survey: ManagedSurvey, actionKey?: string) => void;
  onCopyLink: (surveyId: string) => void;
  onCopyQr: (surveyId: string) => void;
  onDeleteRequest: (target: DeleteConfirm) => void;
};

export function SurveysTab({
  surveyDraft,
  surveys,
  copiedId,
  copiedQrId,
  copyingQrId,
  qrCopyErrorId,
  isActionPending,
  setSurveyDraft,
  onCreateSurvey,
  surveyShareUrl,
  onPatchDraft,
  onSave,
  onCopyLink,
  onCopyQr,
  onDeleteRequest,
}: SurveysTabProps) {
  return (
    <section className="space-y-4">
      <form
        onSubmit={onCreateSurvey}
        className="shine-card border-border border bg-white p-4 shadow-sm"
      >
        <div className="mb-3 flex items-center gap-2">
          <Plus className="text-primary size-5" />
          <h2 className="text-foreground text-base font-semibold uppercase">
            Thêm khảo sát mới
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="floating-label">
            <span>Tên khảo sát</span>
            <input
              value={surveyDraft.title}
              onChange={(event) =>
                setSurveyDraft((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              required
              placeholder="Tên khảo sát"
              className="input bg-muted focus:border-primary h-10 w-full border text-sm outline-none"
            />
          </label>
          <label className="floating-label">
            <span>Link Google Form hoặc biểu mẫu</span>
            <input
              value={surveyDraft.target_url}
              onChange={(event) =>
                setSurveyDraft((current) => ({
                  ...current,
                  target_url: event.target.value,
                }))
              }
              required
              placeholder="Link Google Form hoặc biểu mẫu"
              className="input bg-muted focus:border-primary h-10 w-full border text-sm outline-none"
            />
          </label>
          <div className="grid gap-2 sm:col-span-2 sm:grid-cols-2 sm:gap-3">
            <label className="floating-label min-w-0">
              <span>Bắt đầu</span>
              <input
                type="datetime-local"
                value={surveyDraft.start_date}
                onChange={(event) =>
                  setSurveyDraft((current) => ({
                    ...current,
                    start_date: event.target.value,
                  }))
                }
                required
                placeholder="Bắt đầu"
                className="input bg-muted text-foreground focus:border-primary h-10 w-full min-w-0 border px-2 text-xs font-bold outline-none sm:px-3 sm:text-sm"
              />
            </label>
            <label className="floating-label min-w-0">
              <span>Kết thúc</span>
              <input
                type="datetime-local"
                value={surveyDraft.end_date}
                onChange={(event) =>
                  setSurveyDraft((current) => ({
                    ...current,
                    end_date: event.target.value,
                  }))
                }
                required
                placeholder="Kết thúc"
                className="input bg-muted text-foreground focus:border-primary h-10 w-full min-w-0 border px-2 text-xs font-bold outline-none sm:px-3 sm:text-sm"
              />
            </label>
          </div>
          <label className="floating-label sm:col-span-2">
            <span>Mô tả ngắn</span>
            <textarea
              value={surveyDraft.description}
              onChange={(event) =>
                setSurveyDraft((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              rows={3}
              placeholder="Mô tả ngắn"
              className="textarea bg-muted focus:border-primary min-h-24 w-full border text-sm outline-none"
            />
          </label>
        </div>
        <label className="text-foreground/85 mt-3 flex items-center gap-2 text-sm font-bold">
          <input
            type="checkbox"
            className="checkbox checkbox-primary checkbox-xs border border-gray-300 outline-none"
            checked={surveyDraft.is_enabled}
            onChange={(event) =>
              setSurveyDraft((current) => ({
                ...current,
                is_enabled: event.target.checked,
              }))
            }
          />
          Bật hiển thị khi đến thời gian khảo sát
        </label>
        <button
          disabled={isActionPending("survey:create")}
          className="btn btn-primary focus-lift mt-3 w-full gap-2 px-4 text-sm font-semibold uppercase sm:w-auto"
        >
          {isActionPending("survey:create") ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <Plus className="size-4" />
          )}
          {isActionPending("survey:create") ? "Đang tạo" : "Tạo khảo sát"}
        </button>
      </form>

      {surveys.length === 0 ? (
        <p className="shine-card text-muted-foreground/70 p-6 text-center text-sm font-bold">
          Chưa có khảo sát nào.
        </p>
      ) : (
        surveys.map((survey) => {
          const shareUrl = surveyShareUrl(survey.id);
          const open = isSurveyOpen(survey);

          return (
            <article
              key={survey.id}
              className="shine-card focus-lift border-border border bg-white p-4 shadow-sm"
            >
              <div className="border-border/60 mb-3 flex flex-col gap-2 border-b pb-3 sm:flex-row sm:items-start sm:justify-between">
                <span
                  className={`rounded-field w-fit border px-3 py-1 text-xs font-semibold uppercase ${
                    open
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-border bg-muted text-muted-foreground"
                  }`}
                >
                  {open ? "Đang mở" : "Không hiển thị"}
                </span>
                <div>
                  <strong className="text-foreground block text-base font-semibold">
                    {survey.title || "Chưa đặt tên"}
                  </strong>
                  <span className="text-muted-foreground/70 sr-only font-mono text-[11px] font-bold uppercase">
                    {survey.id}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="floating-label">
                  <span>Tên khảo sát</span>
                  <input
                    value={survey.title}
                    onChange={(event) =>
                      onPatchDraft(survey.id, {
                        title: event.target.value,
                      })
                    }
                    placeholder="Tên khảo sát"
                    className="input bg-muted focus:border-primary h-10 w-full border text-sm font-bold outline-none"
                  />
                </label>
                <label className="floating-label">
                  <span>Link Google Form hoặc biểu mẫu</span>
                  <input
                    value={survey.target_url}
                    onChange={(event) =>
                      onPatchDraft(survey.id, {
                        target_url: event.target.value,
                      })
                    }
                    placeholder="Link Google Form hoặc biểu mẫu"
                    className="input bg-muted focus:border-primary h-10 w-full border text-sm outline-none"
                  />
                </label>
                <div className="grid gap-2 sm:col-span-2 sm:grid-cols-2 sm:gap-3">
                  <label className="floating-label min-w-0">
                    <span>Bắt đầu</span>
                    <input
                      type="datetime-local"
                      value={toSurveyDateTimeInput(survey.start_date, "start")}
                      onChange={(event) =>
                        onPatchDraft(survey.id, {
                          start_date: event.target.value,
                        })
                      }
                      placeholder="Bắt đầu"
                      className="input bg-muted text-foreground focus:border-primary h-10 w-full min-w-0 border px-2 text-xs font-bold outline-none sm:px-3 sm:text-sm"
                    />
                  </label>
                  <label className="floating-label min-w-0">
                    <span>Kết thúc</span>
                    <input
                      type="datetime-local"
                      value={toSurveyDateTimeInput(survey.end_date, "end")}
                      onChange={(event) =>
                        onPatchDraft(survey.id, {
                          end_date: event.target.value,
                        })
                      }
                      placeholder="Kết thúc"
                      className="input bg-muted text-foreground focus:border-primary h-10 w-full min-w-0 border px-2 text-xs font-bold outline-none sm:px-3 sm:text-sm"
                    />
                  </label>
                </div>
                <label className="floating-label sm:col-span-2">
                  <span>Mô tả ngắn</span>
                  <textarea
                    value={survey.description}
                    onChange={(event) =>
                      onPatchDraft(survey.id, {
                        description: event.target.value,
                      })
                    }
                    rows={3}
                    placeholder="Mô tả ngắn"
                    className="textarea bg-muted focus:border-primary min-h-24 w-full border text-sm outline-none"
                  />
                </label>
              </div>

              <div className="border-border/60 bg-muted rounded-box mt-3 border p-4">
                <p className="text-primary mb-2 flex items-center gap-2 text-xs font-semibold uppercase">
                  <LinkIcon className="size-4" />
                  Link chia sẻ và QR
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[8rem_1fr]">
                  <RetryableQrImage
                    text={shareUrl}
                    alt={`Mã QR ${survey.title}`}
                    className="border-border rounded-box aspect-square w-full border bg-white p-2"
                  />
                  <div className="min-w-0 space-y-2">
                    <p className="text-muted-foreground rounded-field bg-white p-2 font-mono text-xs break-all">
                      {shareUrl}
                    </p>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                      <button
                        type="button"
                        onClick={() => onCopyLink(survey.id)}
                        className="btn btn-accent focus-lift gap-2 border-(--military-medal)/45 px-3 text-xs font-semibold uppercase"
                      >
                        <Copy className="size-4" />
                        {copiedId === survey.id ? "Đã sao chép" : "Sao chép"}
                      </button>
                      <button
                        type="button"
                        onClick={() => onCopyQr(survey.id)}
                        disabled={copyingQrId === survey.id}
                        className="btn btn-outline focus-lift text-primary hover:bg-accent/30 border-(--military-medal)/45 bg-white px-3 text-xs font-semibold uppercase"
                      >
                        {copyingQrId === survey.id ? (
                          <LoaderCircle className="size-4 animate-spin" />
                        ) : (
                          <QrCode className="size-4" />
                        )}
                        {copyingQrId === survey.id
                          ? "Đang sao chép"
                          : copiedQrId === survey.id
                            ? "Đã sao chép QR"
                            : qrCopyErrorId === survey.id
                              ? "Không copy được"
                              : "Sao chép QR"}
                      </button>
                      <Link
                        href={`/khao-sat/${encodeURIComponent(survey.id)}`}
                        target="_blank"
                        className="btn btn-outline focus-lift border-border text-foreground/85 hover:bg-muted bg-white px-3 text-xs font-semibold uppercase"
                      >
                        <ExternalLink className="size-4" />
                        Mở thử
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <button
                  type="button"
                  onClick={() => onSave(survey)}
                  disabled={isActionPending(`survey:${survey.id}:save`)}
                  className="btn btn-primary btn-sm focus-lift gap-2 px-3 text-xs font-semibold uppercase"
                >
                  {isActionPending(`survey:${survey.id}:save`) ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <Save className="size-4" />
                  )}
                  {isActionPending(`survey:${survey.id}:save`)
                    ? "Đang lưu"
                    : "Lưu"}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onSave(
                      {
                        ...survey,
                        is_enabled: !survey.is_enabled,
                      },
                      `survey:${survey.id}:toggle`,
                    )
                  }
                  disabled={isActionPending(`survey:${survey.id}:toggle`)}
                  className={`btn btn-accent btn-sm focus-lift gap-2 border-(--military-medal)/45 px-3 text-xs font-semibold uppercase ${
                    !survey.is_enabled ? "btn-success" : ""
                  }`}
                >
                  {isActionPending(`survey:${survey.id}:toggle`) ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <CalendarClock className="size-4" />
                  )}
                  {isActionPending(`survey:${survey.id}:toggle`)
                    ? "Đang đổi"
                    : survey.is_enabled
                      ? "Tắt"
                      : "Bật"}
                </button>
                <a
                  href={survey.target_url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-outline btn-sm focus-lift border-border bg-muted text-foreground/85 px-3 text-xs font-semibold uppercase hover:bg-white"
                >
                  <ExternalLink className="size-4" />
                  Form gốc
                </a>
                <button
                  type="button"
                  onClick={() =>
                    onDeleteRequest({
                      kind: "survey",
                      id: survey.id,
                      title: survey.title,
                    })
                  }
                  className="btn btn-error btn-sm focus-lift gap-2 border-red-100 bg-red-50 px-3 text-xs font-semibold text-red-700 uppercase"
                >
                  <Trash2 className="size-4" />
                  Xóa
                </button>
              </div>
            </article>
          );
        })
      )}
    </section>
  );
}
