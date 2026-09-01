"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendGmailMessage } from "@/lib/google/gmail";
import {
  getGoogleIntegration,
  getValidAccessToken,
} from "@/lib/google/integration";
import { isGoogleConfigured } from "@/lib/google/config";

export async function sendContactEmail(
  contactId: string,
  subject: string,
  body: string
) {
  if (!isGoogleConfigured()) {
    throw new Error("Gmail is not configured. Add Google OAuth credentials.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: contact } = await supabase
    .from("contacts")
    .select("id, email, first_name, last_name")
    .eq("id", contactId)
    .single();

  if (!contact?.email) {
    throw new Error("Contact has no email address");
  }

  const integration = await getGoogleIntegration(user.id);
  if (!integration) {
    throw new Error("Gmail not connected. Connect in Settings first.");
  }

  const accessToken = await getValidAccessToken(integration);

  const result = await sendGmailMessage(accessToken, {
    to: contact.email,
    subject,
    body,
  });

  const snippet = body.slice(0, 200);

  // Find or create email thread
  let threadId: string;
  const { data: existingThread } = await supabase
    .from("email_threads")
    .select("id")
    .eq("user_id", user.id)
    .eq("contact_id", contactId)
    .eq("gmail_thread_id", result.threadId)
    .maybeSingle();

  if (existingThread) {
    threadId = existingThread.id;
  } else {
    const { data: newThread, error: threadError } = await supabase
      .from("email_threads")
      .insert({
        user_id: user.id,
        contact_id: contactId,
        gmail_thread_id: result.threadId,
        subject,
      })
      .select("id")
      .single();

    if (threadError) throw new Error(threadError.message);
    threadId = newThread.id;
  }

  const { error: messageError } = await supabase.from("email_messages").insert({
    user_id: user.id,
    thread_id: threadId,
    contact_id: contactId,
    gmail_message_id: result.id,
    direction: "sent",
    body,
    snippet,
  });

  if (messageError) throw new Error(messageError.message);

  await supabase.from("activities").insert({
    user_id: user.id,
    contact_id: contactId,
    type: "email",
    payload: {
      subject,
      snippet,
      direction: "sent",
      gmail_message_id: result.id,
      gmail_thread_id: result.threadId,
    },
  });

  await supabase
    .from("contacts")
    .update({ last_contact_at: new Date().toISOString() })
    .eq("id", contactId);

  revalidatePath(`/contacts/${contactId}`);
  revalidatePath("/dashboard");

  return { messageId: result.id, threadId: result.threadId };
}

export async function disconnectGmail() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("google_integrations")
    .delete()
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/settings");
}

export async function getGmailConnectionStatus() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { connected: false, email: null, configured: false };

  const { data } = await supabase
    .from("google_integrations")
    .select("google_email")
    .eq("user_id", user.id)
    .maybeSingle();

  return {
    connected: !!data,
    email: data?.google_email ?? null,
    configured: isGoogleConfigured(),
  };
}
