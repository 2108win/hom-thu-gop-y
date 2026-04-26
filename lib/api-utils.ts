import { NextResponse } from "next/server";

import { isStoreConfigError } from "@/lib/data-store";

export function jsonError(error: unknown, fallback = "Có lỗi xảy ra.") {
  if (isStoreConfigError(error)) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : fallback },
      { status: 503 },
    );
  }

  return NextResponse.json(
    { message: error instanceof Error ? error.message : fallback },
    { status: 500 },
  );
}

export function badRequest(message: string) {
  return NextResponse.json({ message }, { status: 400 });
}
