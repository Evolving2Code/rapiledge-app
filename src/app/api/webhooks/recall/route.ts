import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { summarizeCall } from "@/lib/ai/claude";
import { getRecallBot } from "@/lib/recall/client";

type RecallPayload = {
  event?: string;
  data?: {
    data?: {
      bot?: { id?: string };
      bot_id?: string;
      transcript?: { id?: string };
    };
    bot?: { id?: string };
  };
};

export async function POST(request: Request) {
  const secret = process.env.RECALL_WEBHOOK_SECRET;
  if (secret) {
    const header = request.headers.get("x-recall-signature") ?? request.headers.get("authorization");
    if (header !== secret && header !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const payload = (await request.json()) as RecallPayload;
  const botId =
    payload.data?.data?.bot?.id ||
    payload.data?.data?.bot_id ||
    payload.data?.bot?.id;
  if (!botId) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const bot = (await getRecallBot(botId)) as {
    id: string;
    meeting_url?: string;
    recordings?: {
      media_shortcuts?: { transcript?: { data?: { download_url?: string } }; video_mixed?: { data?: { download_url?: string } } };
    }[];
    metadata?: Record<string, string>;
    status_changes?: { code?: string; created_at?: string }[];
  };

  const supabase = createAdminClient();
  const { data: meeting } = await supabase
    .from("meetings")
    .select("*")
    .eq("recall_bot_id", botId)
    .maybeSingle();

  const ownerId = meeting?.owner_id as string | undefined;
  if (!ownerId) {
    return NextResponse.json({ ok: true, unmatched: true });
  }

  const transcriptUrl =
    bot.recordings?.[0]?.media_shortcuts?.transcript?.data?.download_url;
  let transcript = "";
  if (transcriptUrl) {
    const res = await fetch(transcriptUrl);
    transcript = await res.text();
  }

  const contactId = meeting?.contact_id as string | null;
  let contactName = "the contact";
  if (contactId) {
    const { data: contact } = await supabase
      .from("contacts")
      .select("first_name, last_name")
      .eq("id", contactId)
      .single();
    if (contact) contactName = `${contact.first_name} ${contact.last_name}`;
  }

  const summary = transcript
    ? await summarizeCall(transcript, contactName)
    : {
        summary: "Call completed without a transcript.",
        actionItems: [],
        flags: [],
        sentiment: "neutral",
        note: "Call logged. Transcript was not available.",
      };

  const started =
    bot.status_changes?.find((s) => s.code === "in_call_recording")?.created_at ??
    new Date().toISOString();
  const ended = new Date().toISOString();

  const { data: call } = await supabase
    .from("calls")
    .insert({
      owner_id: ownerId,
      contact_id: contactId,
      recall_bot_id: botId,
      meeting_url: bot.meeting_url,
      transcript,
      summary: summary.summary,
      action_items: summary.actionItems,
      flags: summary.flags,
      sentiment: summary.sentiment,
      recording_url:
        bot.recordings?.[0]?.media_shortcuts?.video_mixed?.data?.download_url ?? null,
      started_at: started,
      ended_at: ended,
    })
    .select("id")
    .single();

  if (contactId) {
    await supabase.from("notes").insert({
      owner_id: ownerId,
      contact_id: contactId,
      body: summary.note,
      source: "ai_call",
    });
    await supabase.rpc("log_activity", {
      p_owner: ownerId,
      p_contact: contactId,
      p_type: "call",
      p_payload: { summary: summary.summary, call_id: call?.id },
    });
  }

  await supabase
    .from("meetings")
    .update({ status: "completed" })
    .eq("recall_bot_id", botId);

  return NextResponse.json({ ok: true, callId: call?.id });
}
