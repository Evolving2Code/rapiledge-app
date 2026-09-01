import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { exchangeCode, getGmailAccessToken, startGmailWatch } from "@/lib/gmail/client";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const ownerId = searchParams.get("state");
  if (!code || !ownerId) {
    return NextResponse.redirect(`${origin}/settings?gmail=missing`);
  }

  const tokens = await exchangeCode(code);
  const expiresAt = new Date(
    Date.now() + (tokens.expires_in ?? 3600) * 1000,
  ).toISOString();
  const supabase = createAdminClient();
  await supabase.from("integrations").upsert(
    {
      owner_id: ownerId,
      provider: "gmail",
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: expiresAt,
      extra: {},
    },
    { onConflict: "owner_id,provider" },
  );

  const access = await getGmailAccessToken(ownerId);
  const profileRes = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/profile",
    { headers: { Authorization: `Bearer ${access}` } },
  );
  const profile = (await profileRes.json()) as { emailAddress?: string };
  await supabase
    .from("integrations")
    .update({ extra: { email: profile.emailAddress?.toLowerCase() } })
    .eq("owner_id", ownerId)
    .eq("provider", "gmail");

  if (process.env.GMAIL_PUBSUB_TOPIC) {
    await startGmailWatch(ownerId);
  }

  return NextResponse.redirect(`${origin}/settings?gmail=connected`);
}
