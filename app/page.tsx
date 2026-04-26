import { FeedbackApp } from "@/components/feedback-app";
import type { ManagedListener } from "@/lib/data-models";
import { getManagedListeners } from "@/lib/data-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function Home() {
  let listeners: ManagedListener[] = [];

  try {
    listeners = (await getManagedListeners())
      .filter((listener) => listener.is_enabled)
      .sort((a, b) => a.order - b.order);
  } catch {
    listeners = [];
  }

  return <FeedbackApp initialListeners={listeners} />;
}
