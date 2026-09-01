import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { buildGoogleAuthUrl, setOAuthState } from "@/lib/google/oauth";
import { isGoogleConfigured } from "@/lib/google/config";

export async function GET() {
  if (!isGoogleConfigured()) {
    return NextResponse.json(
      { error: "Google OAuth is not configured" },
      { status: 503 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"));
  }

  const state = randomBytes(32).toString("hex");
  await setOAuthState(state);

  const url = buildGoogleAuthUrl(state);
  return NextResponse.redirect(url);
}
