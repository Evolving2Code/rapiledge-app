import { createAdminClient } from "@/lib/supabase/admin";
import { getGmailMessage, listHistory, parseGmailMessage } from "@/lib/gmail/client";

export async function ingestGmailNotification(emailAddress: string, historyId: string) {
  const supabase = createAdminClient();
  const { data: integration } = await supabase
    .from("integrations")
    .select("*")
    .eq("provider", "gmail")
    .contains("extra", { email: emailAddress.toLowerCase() })
    .maybeSingle();

  if (!integration) {
    return { skipped: true, reason: "unknown mailbox" };
  }

  const ownerId = integration.owner_id as string;
  const { data: watch } = await supabase
    .from("gmail_watches")
    .select("*")
    .eq("owner_id", ownerId)
    .maybeSingle();

  const startId = (watch?.history_id as string | null) ?? historyId;
  const history = await listHistory(ownerId, startId);
  const added =
    history.history?.flatMap((h) => h.messagesAdded ?? []).map((m) => m.message) ?? [];

  for (const msg of added) {
    const full = await getGmailMessage(ownerId, msg.id);
    const parsed = parseGmailMessage(full);
    const { data: contactId } = await supabase.rpc("match_contact_by_email", {
      p_owner: ownerId,
      p_email: parsed.fromEmail,
    });
    if (!contactId) continue;

    await supabase.from("email_threads").upsert(
      {
        owner_id: ownerId,
        contact_id: contactId,
        gmail_thread_id: parsed.threadId,
        subject: parsed.subject,
        last_message_at: parsed.date,
      },
      { onConflict: "owner_id,gmail_thread_id" },
    );

    const { error } = await supabase.from("email_messages").insert({
      owner_id: ownerId,
      contact_id: contactId,
      gmail_message_id: parsed.id,
      direction: "received",
      from_email: parsed.fromEmail,
      to_email: parsed.to,
      subject: parsed.subject,
      body: parsed.body,
      snippet: parsed.snippet,
      created_at: parsed.date,
    });
    if (error && !error.message.includes("duplicate")) {
      throw error;
    }

    await supabase.rpc("log_activity", {
      p_owner: ownerId,
      p_contact: contactId,
      p_type: "email",
      p_payload: {
        direction: "received",
        subject: parsed.subject,
        snippet: parsed.snippet,
      },
    });
  }

  await supabase.from("gmail_watches").upsert(
    {
      owner_id: ownerId,
      history_id: history.historyId ?? historyId,
    },
    { onConflict: "owner_id" },
  );

  return { ingested: added.length };
}
