import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  exchangeCodeForTokens,
  fetchGoogleEmail,
  verifyOAuthState,
} from "@/lib/google/oauth";
import { GOOGLE_SCOPES } from "@/lib/google/config";

function appUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000")
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      `${appUrl()}/settings?gmail=error&message=${encodeURIComponent(error)}`
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(`${appUrl()}/settings?gmail=error`);
  }

  const validState = await verifyOAuthState(state);
  if (!validState) {
    return NextResponse.redirect(`${appUrl()}/settings?gmail=error&message=invalid_state`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${appUrl()}/login`);
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const googleEmail = await fetchGoogleEmail(tokens.access_token);

    const { error: upsertError } = await supabase
      .from("google_integrations")
      .upsert(
        {
          user_id: user.id,
          google_email: googleEmail,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token ?? null,
          token_expires_at: new Date(
            Date.now() + tokens.expires_in * 1000
          ).toISOString(),
          scopes: [...GOOGLE_SCOPES],
        },
        { onConflict: "user_id" }
      );

    if (upsertError) throw upsertError;

    return NextResponse.redirect(`${appUrl()}/settings?gmail=connected`);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to connect Gmail";
    return NextResponse.redirect(
      `${appUrl()}/settings?gmail=error&message=${encodeURIComponent(message)}`
    );
  }
}
