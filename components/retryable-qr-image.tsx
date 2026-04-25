"use client";

import { LoaderCircle, RefreshCcw } from "lucide-react";
import { useState } from "react";

type RetryableQrImageProps = {
  text: string;
  alt: string;
  className?: string;
};

export function RetryableQrImage({
  text,
  alt,
  className = "aspect-square w-full",
}: RetryableQrImageProps) {
  const [retryToken, setRetryToken] = useState(0);
  const [failedSrc, setFailedSrc] = useState("");
  const [loadedSrc, setLoadedSrc] = useState("");

  const src = text
    ? `/api/qr?text=${encodeURIComponent(text)}&retry=${retryToken}`
    : "";
  const status =
    !src || failedSrc === src
      ? "error"
      : loadedSrc === src
        ? "ready"
        : "loading";

  const retry = () => {
    if (!text) {
      return;
    }

    setFailedSrc("");
    setLoadedSrc("");
    setRetryToken(Date.now());
  };

  if (status === "error") {
    return (
      <div className={`${className} flex items-center justify-center`}>
        <button
          type="button"
          onClick={retry}
          disabled={!text}
          className="btn btn-outline btn-sm focus-lift h-auto min-h-0 flex-col gap-1 px-2 py-3 text-[10px] font-semibold uppercase"
        >
          <RefreshCcw className="size-4" />
          Tải lại QR
        </button>
      </div>
    );
  }

  return (
    <div className={`${className} relative overflow-hidden`}>
      {status === "loading" ? (
        <div className="bg-base-200/80 absolute inset-0 flex items-center justify-center">
          <LoaderCircle className="text-primary size-5 animate-spin" />
        </div>
      ) : null}
      {/* eslint-disable-next-line @next/next/no-img-element -- QR is a generated SVG endpoint, not an LCP content image. */}
      <img
        key={src}
        src={src}
        alt={alt}
        onLoad={() => setLoadedSrc(src)}
        onError={() => setFailedSrc(src)}
        className={`aspect-square w-full ${status === "loading" ? "opacity-0" : "opacity-100"}`}
      />
    </div>
  );
}
