import { NextResponse } from "next/server";
import { ingestGmailNotification } from "@/lib/gmail/inbound";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    message?: { data?: string };
  };
  const encoded = body.message?.data;
  if (!encoded) {
    return NextResponse.json({ ok: true, ignored: true });
  }
  const decoded = JSON.parse(
    Buffer.from(encoded, "base64").toString("utf8"),
  ) as { emailAddress?: string; historyId?: number | string };
  if (!decoded.emailAddress || decoded.historyId == null) {
    return NextResponse.json({ ok: true, ignored: true });
  }
  await ingestGmailNotification(
    decoded.emailAddress,
    String(decoded.historyId),
  );
  return NextResponse.json({ ok: true });
}
