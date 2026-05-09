import "server-only";

import webpush, { type PushSubscription } from "web-push";

import { getPushSubscriptionsForCategory, removePushSubscription } from "@/lib/data-store";
import type { ManagedPushSubscription, StoredTicket } from "@/lib/data-models";

let configured = false;

function getVapidConfig() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  const subject = "mailto:no-reply@hom-thu-gop-y.local";

  if (!publicKey || !privateKey) {
    return null;
  }

  return { publicKey, privateKey, subject };
}

function ensureWebPushConfigured() {
  if (configured) {
    return true;
  }

  const vapid = getVapidConfig();
  if (!vapid) {
    return false;
  }

  webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);
  configured = true;
  return true;
}

function toWebPushSubscription(
  subscription: ManagedPushSubscription,
): PushSubscription {
  return {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh,
      auth: subscription.auth,
    },
  };
}

function buildTicketNotification(ticket: StoredTicket) {
  const sender = ticket.is_anonymous
    ? "Ẩn danh"
    : [ticket.name, ticket.unit].filter(Boolean).join(" - ") || "Không ghi tên";

  return {
    title: `Có góp ý mới - ${ticket.category}`,
    body: `Mã ${ticket.ticket_code}. Người gửi: ${sender}.`,
    icon: "/logo-ludoan234.png",
    badge: "/logo-ludoan234.png",
    url: "/quan-tri",
    ticketCode: ticket.ticket_code,
  };
}

export async function notifyTicketCreated(ticket: StoredTicket) {
  if (!ensureWebPushConfigured()) {
    return;
  }

  const subscriptions = await getPushSubscriptionsForCategory(ticket.category_id);
  if (!subscriptions.length) {
    return;
  }

  const payload = JSON.stringify(buildTicketNotification(ticket));

  await Promise.allSettled(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          toWebPushSubscription(subscription),
          payload,
        );
      } catch (error) {
        const statusCode =
          typeof error === "object" && error && "statusCode" in error
            ? Number((error as { statusCode?: unknown }).statusCode)
            : 0;

        if (statusCode === 403 || statusCode === 404 || statusCode === 410) {
          await removePushSubscription(subscription.endpoint);
        } else {
          console.error("Không thể gửi Web Push notification", error);
        }
      }
    }),
  );
}
