import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
import { createRecallBot } from "@/lib/recall/client";

export async function POST(request: Request) {
  const { userId, supabase } = await requireUser();
  const body = (await request.json()) as {
    meetingId?: string;
    meetingUrl?: string;
  };
  if (!body.meetingUrl && !body.meetingId) {
    return NextResponse.json({ error: "meetingUrl required" }, { status: 400 });
  }

  let meetingUrl = body.meetingUrl;
  const meetingId = body.meetingId;
  if (meetingId) {
    const { data } = await supabase
      .from("meetings")
      .select("*")
      .eq("id", meetingId)
      .single();
    meetingUrl = data?.meeting_url;
  }
  if (!meetingUrl) {
    return NextResponse.json({ error: "No meeting URL" }, { status: 400 });
  }

  const bot = await createRecallBot({ meetingUrl });
  if (meetingId) {
    await supabase
      .from("meetings")
      .update({ recall_bot_id: bot.id, status: "bot_joining" })
      .eq("id", meetingId)
      .eq("owner_id", userId);
  }
  return NextResponse.json({ botId: bot.id });
}
