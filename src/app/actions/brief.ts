"use server";

import { cleanupNote, generateBrief, isAiConfigured } from "@/lib/ai/claude";
import { requireUser } from "@/lib/supabase/server";
import type { BriefMe, Call, EmailMessage, Note, Task } from "@/lib/types";
import { fullName } from "@/lib/format";

export async function briefContact(contactId: string): Promise<BriefMe> {
  const { supabase } = await requireUser();
  const { data: contact, error } = await supabase
    .from("contacts")
    .select("*, company:companies(*)")
    .eq("id", contactId)
    .single();
  if (error || !contact) throw new Error("Contact not found.");

  const [{ data: notes }, { data: tasks }, { data: calls }, { data: emails }, { data: deals }] =
    await Promise.all([
      supabase
        .from("notes")
        .select("*")
        .eq("contact_id", contactId)
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("tasks")
        .select("*")
        .eq("contact_id", contactId)
        .eq("completed", false)
        .order("due_date", { ascending: true }),
      supabase
        .from("calls")
        .select("*")
        .eq("contact_id", contactId)
        .order("created_at", { ascending: false })
        .limit(1),
      supabase
        .from("email_messages")
        .select("*")
        .eq("contact_id", contactId)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("deals")
        .select("*")
        .eq("contact_id", contactId)
        .order("updated_at", { ascending: false })
        .limit(1),
    ]);

  return generateBrief({
    contactName: fullName(contact),
    companyName: contact.company?.name,
    customFields: (contact.custom_fields ?? {}) as Record<string, string>,
    lastCallSummary: (calls?.[0] as Call | undefined)?.summary,
    recentNotes: ((notes ?? []) as Note[]).map((n) => n.body),
    openTasks: ((tasks ?? []) as Task[]).map((t) => t.title),
    recentEmails: ((emails ?? []) as EmailMessage[]).map(
      (e) => `${e.direction}: ${e.snippet || e.subject || ""}`,
    ),
    dealStage: deals?.[0]?.stage ?? null,
  });
}

export async function polishNoteDraft(body: string) {
  const text = body.trim();
  if (!text) throw new Error("Nothing to polish.");
  if (!isAiConfigured()) throw new Error("AI is not configured.");
  return cleanupNote(text);
}
