import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { startGmailWatch } from "@/lib/gmail/client";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const horizon = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
  const { data: watches, error } = await supabase
    .from("gmail_watches")
    .select("*")
    .or(`expiration.is.null,expiration.lt.${horizon}`);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results = [];
  for (const watch of watches ?? []) {
    try {
      const renewed = await startGmailWatch(watch.owner_id);
      results.push({ owner: watch.owner_id, expiration: renewed.expiration });
    } catch (e) {
      results.push({
        owner: watch.owner_id,
        error: e instanceof Error ? e.message : "renew failed",
      });
    }
  }

  return NextResponse.json({ renewed: results.length, results });
}
