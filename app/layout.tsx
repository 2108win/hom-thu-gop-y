import { ServiceWorkerRegistrar } from "@/components/service-worker-registrar";
import { FixedFooter, MarqueeBar } from "@/components/site-frame";
import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "700", "900"],
});

export const metadata: Metadata = {
  title: "Hòm thư góp ý điện tử - LỮ ĐOÀN PPK234",
  description: "Hòm thư góp ý điện tử và khảo sát trực tuyến của LỮ ĐOÀN PPK234",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/logo-ludoan234.png", type: "image/png" },
    ],
    shortcut: "/icon-192.png",
    apple: [
      {
        url: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Hòm thư góp ý",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      data-theme="homthu"
      className={`${roboto.variable} h-full antialiased`}
    >
      <body className="flex min-h-dvh flex-col">
        <MarqueeBar />
        {children}
        <ServiceWorkerRegistrar />
        <Toaster closeButton richColors position="top-right" />
        <FixedFooter />
      </body>
    </html>
  );
}
