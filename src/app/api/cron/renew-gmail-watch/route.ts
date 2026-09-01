import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Gmail watch renewal — implemented in Phase 4
  // Re-registers Gmail push notifications before 7-day expiry
  return NextResponse.json({
    status: "ok",
    message: "Gmail watch renewal placeholder — connect Gmail in Phase 4",
  });
}
