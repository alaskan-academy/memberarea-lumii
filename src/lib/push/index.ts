import webpush from "web-push";
import { createServiceClient } from "@/lib/supabase/service";
import { fetchAll } from "@/lib/supabase/fetch-all";

let vapidConfigured = false;
function ensureVapid() {
  if (vapidConfigured) return;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) throw new Error("VAPID keys not configured");
  // Usa || (não ??) de propósito — VAPID_EMAIL pode estar definida mas vazia
  // no ambiente (ex: "VAPID_EMAIL=" no .env.local), e ?? só cobre undefined/null.
  const email = process.env.VAPID_EMAIL?.trim() || "contato@lumiieduca.com.br";
  webpush.setVapidDetails(`mailto:${email}`, pub, priv);
  vapidConfigured = true;
}

export interface PushPayload {
  title: string;
  body?: string;
  link?: string;
}

type SubRow = { endpoint: string; p256dh: string; auth: string };

async function sendToSub(sub: SubRow, payload: PushPayload): Promise<void> {
  ensureVapid();
  await webpush.sendNotification(
    { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
    JSON.stringify(payload)
  );
}

async function cleanExpiredSub(endpoint: string) {
  const service = createServiceClient();
  await service.from("push_subscriptions").delete().eq("endpoint", endpoint);
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  const service = createServiceClient();
  const { data: subs } = await service
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (!subs?.length) return;

  await Promise.allSettled(
    subs.map((sub) =>
      sendToSub(sub, payload).catch(async (err: { statusCode?: number }) => {
        if (err?.statusCode === 410) await cleanExpiredSub(sub.endpoint);
      })
    )
  );
}

export async function broadcastPush(
  payload: PushPayload,
  userIds?: string[]
): Promise<number> {
  const service = createServiceClient();
  // Pagina todas as inscrições — sem isto, um broadcast atinge no máx. 1.000
  // dispositivos (limite silencioso do Supabase) e subnotifica a base inteira.
  const subs = await fetchAll<{ endpoint: string; p256dh: string; auth: string }>(
    (from, to) => {
      let q = service.from("push_subscriptions").select("endpoint, p256dh, auth");
      if (userIds?.length) q = q.in("user_id", userIds);
      return q.order("id").range(from, to);
    }
  );
  if (!subs.length) return 0;

  const results = await Promise.allSettled(
    subs.map((sub) =>
      sendToSub(sub, payload).catch(async (err: { statusCode?: number }) => {
        if (err?.statusCode === 410) await cleanExpiredSub(sub.endpoint);
        throw err;
      })
    )
  );

  return results.filter((r) => r.status === "fulfilled").length;
}
