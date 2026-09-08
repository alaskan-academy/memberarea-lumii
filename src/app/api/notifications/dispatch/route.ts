import { createServiceClient } from "@/lib/supabase/service";
import { dispatchCampaign } from "@/lib/notifications/actions";
import { NextResponse } from "next/server";

// Vercel Cron — roda diariamente às 8h UTC ("0 8 * * *" em vercel.json).
// A Vercel Cron autentica enviando `Authorization: Bearer <CRON_SECRET>`;
// aceitamos também o header legado `x-cron-secret` para chamadas manuais.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  const legacyHeader = req.headers.get("x-cron-secret");
  const authorized =
    !!secret && (authHeader === `Bearer ${secret}` || legacyHeader === secret);
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const service = createServiceClient();
  const now = new Date().toISOString();

  const { data: pending } = await service
    .from("notification_campaigns")
    .select("id")
    .eq("status", "scheduled")
    .lte("scheduled_at", now);

  if (!pending || pending.length === 0) {
    return NextResponse.json({ dispatched: 0 });
  }

  for (const campaign of pending) {
    await dispatchCampaign(campaign.id);
  }

  return NextResponse.json({ dispatched: pending.length });
}
