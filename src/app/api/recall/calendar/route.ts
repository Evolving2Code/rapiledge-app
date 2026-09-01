import { NextResponse } from "next/server";
import { getUserId } from "@/lib/supabase/server";
import { createCalendarAuth } from "@/lib/recall/client";

export async function GET() {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL));
  }
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const auth = await createCalendarAuth(`${base}/settings?recall=connected`);
  const url = auth.oauth_url || auth.url;
  if (!url) {
    return NextResponse.json({ error: "Recall calendar auth URL missing." }, { status: 500 });
  }
  return NextResponse.redirect(url);
}
