import { NextResponse } from "next/server";
import QRCode from "qrcode";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get("text") ?? "";

  if (!text) {
    return NextResponse.json(
      { message: "Thiếu nội dung QR." },
      { status: 400 },
    );
  }

  const svg = await QRCode.toString(text, {
    type: "svg",
    margin: 1,
    errorCorrectionLevel: "M",
    color: {
      dark: "#153d2b",
      light: "#ffffff",
    },
  });

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
