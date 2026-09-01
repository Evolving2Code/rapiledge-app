import { NextResponse } from "next/server";
import { getUserId } from "@/lib/supabase/server";
import { gmailAuthUrl, gmailConfigured } from "@/lib/gmail/client";

export async function GET() {
  if (!gmailConfigured()) {
    return NextResponse.json({ error: "Gmail OAuth is not configured." }, { status: 500 });
  }
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL));
  }
  return NextResponse.redirect(gmailAuthUrl(userId));
}
