"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/supabase/server";
import { sendGmail } from "@/lib/gmail/client";

export async function sendContactEmail(contactId: string, formData: FormData) {
  const { supabase, userId } = await requireUser();
  const { data: contact, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("id", contactId)
    .single();
  if (error || !contact) throw new Error("Contact not found.");
  const to =
    String(formData.get("to") ?? "").trim() || contact.email || contact.emails?.[0];
  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!to || !subject || !body) throw new Error("To, subject, and body are required.");

  const sent = await sendGmail({ ownerId: userId, to, subject, body });

  const { data: thread } = await supabase
    .from("email_threads")
    .upsert(
      {
        owner_id: userId,
        contact_id: contactId,
        gmail_thread_id: sent.threadId,
        subject,
        last_message_at: new Date().toISOString(),
      },
      { onConflict: "owner_id,gmail_thread_id" },
    )
    .select("id")
    .single();

  await supabase.from("email_messages").insert({
    owner_id: userId,
    thread_id: thread?.id ?? null,
    contact_id: contactId,
    gmail_message_id: sent.id,
    direction: "sent",
    to_email: to,
    subject,
    body,
    snippet: body.slice(0, 180),
  });

  await supabase.rpc("log_activity", {
    p_owner: userId,
    p_contact: contactId,
    p_type: "email",
    p_payload: { direction: "sent", subject, snippet: body.slice(0, 180) },
  });

  revalidatePath(`/contacts/${contactId}`);
}
