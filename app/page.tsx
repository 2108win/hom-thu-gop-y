import { FeedbackApp } from "@/components/feedback-app";
import type { ManagedListener } from "@/lib/data-models";
import { getManagedListeners } from "@/lib/google-sheets-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function Home() {
  let listeners: ManagedListener[] | undefined;

  try {
    listeners = await getManagedListeners();
  } catch {
    listeners = undefined;
  }

  return <FeedbackApp initialListeners={listeners} />;
}
