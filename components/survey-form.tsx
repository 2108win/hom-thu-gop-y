"use client";

import { CheckCircle, LoaderCircle, Send } from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";

import { BackButton, UnitHeader } from "@/components/site-frame";
import type { StoredSurveyResponse, SurveyAnswer } from "@/lib/data-models";
import type { Survey } from "@/lib/site-data";

export function SurveyForm({ survey }: { survey?: Survey }) {
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [responseCode, setResponseCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [answersByQuestion, setAnswersByQuestion] = useState<
    Record<number, string>
  >({});

  if (!survey) {
    return (
      <main className="site-canvas flex flex-col">
        <BackButton />
        <div
          className="mx-auto flex-1 pb-4"
          style={{ width: "min(calc(100vw - 0.75rem), 36rem)" }}
        >
          <div className="card shine-card animate-pop border-base-300 bg-base-100 mt-4 border text-center shadow-sm">
            <div className="card-body">
              <h2 className="text-primary text-xl font-semibold uppercase">
                Không tìm thấy khảo sát
              </h2>
              <p className="text-muted-foreground mb-4 text-sm">
                Mã khảo sát không tồn tại hoặc đã ngừng nhận phản hồi.
              </p>
              <Link
                href="/khao-sat"
                className="btn btn-primary focus-lift px-5 py-3 text-sm font-semibold uppercase"
              >
                QUAY LẠI DANH SÁCH
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const readErrorMessage = async (response: Response) => {
    try {
      const data = (await response.json()) as { message?: string };
      return data.message || "Có lỗi xảy ra.";
    } catch {
      return "Có lỗi xảy ra.";
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!survey) {
      return;
    }

    const missingAnswer = survey.questions.some(
      (_question, questionIndex) => !answersByQuestion[questionIndex],
    );

    if (missingAnswer) {
      setErrorMessage("Vui lòng trả lời đầy đủ các câu hỏi khảo sát.");
      return;
    }

    setSubmitting(true);
    const answers = survey.questions.map(
      (question, questionIndex) =>
        ({
          question: question.prompt,
          answer: answersByQuestion[questionIndex],
        }) satisfies SurveyAnswer,
    );

    try {
      const response = await fetch("/api/survey-responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          surveyId: survey.id,
          answers,
        }),
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }

      const data = (await response.json()) as {
        response: StoredSurveyResponse;
      };
      setResponseCode(data.response.response_code);
      setSuccess(true);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Không thể gửi kết quả khảo sát.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="site-canvas flex flex-col">
      <BackButton />
      <div
        className="mx-auto flex-1 pb-4"
        style={{ width: "min(calc(100vw - 0.75rem), 36rem)" }}
      >
        <UnitHeader />

        <div className="card shine-card animate-pop border-base-300 bg-base-100 mb-4 border text-center shadow-sm">
          <div className="card-body p-5">
            <p className="text-primary mb-2 text-center text-[11px] font-semibold tracking-[0.14em] uppercase">
              Phiếu khảo sát
            </p>
            <h2 className="text-foreground mx-auto mb-2 max-w-[19rem] text-center text-base leading-7 font-semibold break-words uppercase sm:max-w-none sm:text-xl">
              {survey.title}
            </h2>
            <p className="text-muted-foreground mx-auto max-w-[20rem] text-center text-sm leading-6 sm:max-w-none">
              {survey.description}
            </p>
          </div>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {survey.questions.map((question, questionIndex) => (
            <section
              key={question.prompt}
              className="card shine-card animate-pop border-base-300 bg-base-100 border shadow-sm"
              style={{ animationDelay: `${questionIndex * 0.1}s` }}
            >
              <div className="card-body p-5">
                <p className="text-foreground mb-4 flex gap-3 text-sm leading-6 font-semibold">
                  <span className="bg-primary flex size-7 shrink-0 items-center justify-center text-xs text-white">
                    {questionIndex + 1}
                  </span>
                  <span className="min-w-0 break-words">{question.prompt}</span>
                </p>

                <div className="grid gap-2" role="radiogroup">
                  {question.options.map((option, optionIndex) => {
                    const id = `opt_${questionIndex}_${optionIndex}`;
                    const checked = answersByQuestion[questionIndex] === option;

                    return (
                      <label
                        key={option}
                        htmlFor={id}
                        className={`focus-lift border-border bg-muted text-foreground/85 hover:bg-accent/35 flex cursor-pointer items-center gap-3 border p-4 text-sm leading-5 font-bold shadow-sm transition ${
                          checked
                            ? "border-primary bg-primary/5 text-primary"
                            : ""
                        }`}
                      >
                        <input
                          id={id}
                          type="radio"
                          name={`question-${questionIndex}`}
                          value={option}
                          checked={checked}
                          onChange={() =>
                            setAnswersByQuestion((current) => ({
                              ...current,
                              [questionIndex]: option,
                            }))
                          }
                          className="radio radio-primary"
                        />
                        <span className="min-w-0">{option}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </section>
          ))}

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-error focus-lift w-full text-base font-semibold uppercase shadow-lg"
          >
            {submitting ? (
              <LoaderCircle className="size-5 animate-spin" />
            ) : (
              <Send className="size-5" />
            )}
            {submitting ? "Đang gửi" : "Gửi kết quả"}
          </button>
        </form>
      </div>

      {success && (
        <div className="modal modal-open" role="dialog" aria-modal="true">
          <div className="modal-box max-w-sm text-center">
            <div className="bg-primary mx-auto mb-4 flex size-20 items-center justify-center text-white">
              <CheckCircle className="size-10" />
            </div>
            <h3 className="text-foreground text-xl font-semibold uppercase">
              Thành công!
            </h3>
            <p className="text-base-content/70 mt-2 text-sm">
              Kết quả khảo sát của đồng chí đã được hệ thống ghi nhận an toàn.
            </p>
            <div className="my-5 border border-emerald-100 bg-emerald-50 p-3">
              <span className="mb-1 block text-[10px] font-semibold tracking-[0.14em] text-emerald-600 uppercase">
                Mã phản hồi
              </span>
              <strong className="text-primary font-mono text-2xl select-all">
                {responseCode}
              </strong>
            </div>
            <Link
              href="/khao-sat"
              className="btn btn-primary focus-lift w-full font-semibold uppercase shadow-lg"
            >
              QUAY LẠI DANH SÁCH
            </Link>
          </div>
          <button
            className="modal-backdrop"
            type="button"
            aria-label="Đóng"
            onClick={() => setSuccess(false)}
          />
        </div>
      )}

      {Boolean(errorMessage) && (
        <div className="modal modal-open" role="dialog" aria-modal="true">
          <div className="modal-box max-w-sm text-center">
            <h3 className="text-foreground text-lg font-semibold uppercase">
              Cần kiểm tra lại
            </h3>
            <p className="text-base-content/70 mt-2 text-sm">{errorMessage}</p>
            <button
              type="button"
              onClick={() => setErrorMessage("")}
              className="btn btn-secondary focus-lift mt-5 w-full font-semibold uppercase"
            >
              Đóng lại
            </button>
          </div>
          <button
            className="modal-backdrop"
            type="button"
            aria-label="Đóng"
            onClick={() => setErrorMessage("")}
          />
        </div>
      )}
    </main>
  );
}
