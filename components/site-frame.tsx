import { ArrowLeft, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import {
  appName,
  footerName,
  logoPath,
  slogan,
  unitName,
} from "@/lib/site-data";

export function MarqueeBar() {
  return (
    <div className="marquee-container sticky! top-0 z-50 w-full shadow-md">
      <div className="marquee-content" aria-hidden="true">
        {[0, 1, 2].map((item) => (
          <span key={item} className="marquee-item">
            <span className="marquee-star">★</span>
            <span>{slogan}</span>
            <span className="marquee-star">★</span>
          </span>
        ))}
      </div>
      <span className="sr-only">{slogan}</span>
    </div>
  );
}

export function UnitHeader({
  badge,
  floating = false,
}: {
  badge?: ReactNode;
  floating?: boolean;
}) {
  return (
    <div className="command-hero hero-panel mb-4 px-4 pt-7 pb-6 text-center text-white shadow-xl shadow-green-950/20 sm:px-5">
      <div className="emblem-frame mx-auto mb-3 flex size-24 items-center justify-center overflow-hidden border-4 border-(--military-medal)">
        <Image
          src={logoPath}
          alt="Logo Lữ đoàn PPK234"
          width={96}
          height={96}
          priority
          className={`h-full w-full object-contain ${floating ? "emblem-steady" : ""}`}
          sizes="96px"
        />
      </div>
      <p className="lux-badge mb-2 inline-flex items-center justify-center gap-1 px-3 py-1 text-[10px] font-bold tracking-[0.18em] text-(--military-cream) uppercase">
        <ShieldCheck className="size-3" />
        Tiếp nhận bảo mật
      </p>
      <h1 className="text-2xl leading-7 font-semibold tracking-tight text-white uppercase">
        {unitName}
      </h1>
      <p className="mx-auto mt-1 max-w-xs text-sm font-semibold text-(--military-cream)">
        {appName}
      </p>
      {badge}
    </div>
  );
}

export function BackButton() {
  return (
    <div className="sticky top-12 z-40 mx-auto mt-2 flex w-full max-w-4xl px-3">
      <Link
        href="/"
        title="Quay lại"
        className="btn btn-square btn-outline text-primary focus-lift border-(--military-medal)/45 bg-white/95 shadow-sm hover:bg-white"
      >
        <ArrowLeft className="size-5" />
      </Link>
    </div>
  );
}

export function FixedFooter() {
  return (
    <div className="command-hero sticky! bottom-0 z-40 mt-auto w-full border-t border-(--military-medal)/25 px-4 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] text-center text-[10px] font-semibold tracking-[0.16em] text-(--military-cream) uppercase shadow-[0_-10px_28px_-22px_rgba(10,31,21,0.65)]">
      {footerName}
    </div>
  );
}
