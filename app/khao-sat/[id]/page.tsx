import { ArrowLeft, CalendarClock, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { isSurveyOpen } from "@/lib/data-models";
import { findManagedSurvey } from "@/lib/data-store";
import { appName, logoPath, unitName } from "@/lib/site-data";

type SurveyPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function SurveyPage({ params }: SurveyPageProps) {
  const { id } = await params;
  const survey = await findManagedSurvey(id);

  if (survey && isSurveyOpen(survey)) {
    redirect(survey.target_url);
  }

  return (
    <main className="site-canvas bg-base-100 text-base-content flex flex-col">
      <div className="flex-1">
        <header className="command-hero border-b-4 border-(--military-medal) text-white shadow-sm">
          <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 sm:py-5">
            <Link
              href="/khao-sat"
              className="btn btn-outline focus-lift mb-4 border-(--military-medal-soft)/30 bg-white/10 px-3 text-xs font-semibold tracking-[0.08em] text-(--military-cream) uppercase hover:bg-white/20 hover:text-white"
            >
              <ArrowLeft className="size-4" />
              Danh sách khảo sát
            </Link>

            <div className="grid gap-4 sm:grid-cols-[4.5rem_1fr] sm:items-center">
              <div className="emblem-frame flex size-16 items-center justify-center border border-(--military-medal)/70 p-2 shadow-sm">
                <Image
                  src={logoPath}
                  alt="Logo Lữ đoàn PPK234"
                  width={64}
                  height={64}
                  priority
                  className="h-full w-full object-contain"
                  sizes="64px"
                />
              </div>
              <div className="min-w-0">
                <p className="lux-badge mb-2 inline-flex items-center gap-1 px-3 py-1 text-[10px] font-semibold tracking-[0.14em] text-(--military-cream) uppercase">
                  <ShieldCheck className="size-3" />
                  {unitName}
                </p>
                <h1 className="text-2xl leading-7 font-semibold text-white uppercase sm:text-3xl sm:leading-9">
                  Hệ thống khảo sát trực tuyến
                </h1>
                <p className="mt-1 max-w-2xl text-sm leading-6 font-semibold text-(--military-cream)">
                  {appName}
                </p>
              </div>
            </div>
          </div>
        </header>

        <section className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
          <div className="card shine-card reveal-up border-base-300 bg-base-100 border text-center shadow-sm">
            <div className="card-body p-6">
              <div className="text-primary mx-auto mb-4 flex size-14 items-center justify-center">
                <CalendarClock className="size-7" />
              </div>
              <h2 className="text-primary mb-2 text-xl font-semibold uppercase">
                Khảo sát chưa mở
              </h2>
              <p className="text-muted-foreground mx-auto mb-5 max-w-md text-sm leading-6">
                Khảo sát không tồn tại, đã tạm ẩn hoặc không nằm trong thời gian
                tiếp nhận phản hồi.
              </p>
              <Link
                href="/khao-sat"
                className="btn btn-primary focus-lift px-5 text-sm font-semibold uppercase"
              >
                Quay lại danh sách
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
