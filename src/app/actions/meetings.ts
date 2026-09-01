"use server";

import { revalidatePath } from "next/cache";
import {
  createRecallBot,
  listCalendarEvents,
  listCalendars,
  scheduleCalendarBot,
} from "@/lib/recall/client";
import { requireUser } from "@/lib/supabase/server";

export async function createMeeting(formData: FormData) {
  const { supabase, userId } = await requireUser();
  const title = String(formData.get("title") ?? "").trim();
  const starts = String(formData.get("starts_at") ?? "");
  if (!title || !starts) throw new Error("Title and start time are required.");
  const contactId = String(formData.get("contact_id") ?? "") || null;
  const { error } = await supabase.from("meetings").insert({
    owner_id: userId,
    title,
    contact_id: contactId,
    starts_at: new Date(starts).toISOString(),
    meeting_url: String(formData.get("meeting_url") ?? "").trim() || null,
    status: "scheduled",
  });
  if (error) throw new Error(error.message);
  revalidatePath("/meetings");
  revalidatePath("/dashboard");
  if (contactId) revalidatePath(`/contacts/${contactId}`);
}

export async function sendNotetaker(meetingId: string) {
  const { supabase, userId } = await requireUser();
  const { data: meeting, error } = await supabase
    .from("meetings")
    .select("*")
    .eq("id", meetingId)
    .eq("owner_id", userId)
    .single();
  if (error || !meeting) throw new Error("Meeting not found.");

  if (meeting.calendar_event_id) {
    const scheduled = await scheduleCalendarBot(meeting.calendar_event_id);
    const botId = scheduled.id ?? scheduled.bot_id ?? null;
    await supabase
      .from("meetings")
      .update({
        recall_bot_id: botId,
        status: "bot_scheduled",
        meeting_url: meeting.meeting_url ?? scheduled.meeting_url ?? null,
      })
      .eq("id", meetingId);
    revalidatePath("/meetings");
    return { botId };
  }

  if (!meeting.meeting_url) {
    throw new Error("This meeting has no join URL for the bot.");
  }
  const bot = await createRecallBot({ meetingUrl: meeting.meeting_url });
  await supabase
    .from("meetings")
    .update({ recall_bot_id: bot.id, status: "bot_joining" })
    .eq("id", meetingId);
  revalidatePath("/meetings");
  return { botId: bot.id };
}

export async function syncRecallCalendar() {
  const { supabase, userId } = await requireUser();
  const calendars = await listCalendars();
  const results = calendars.results ?? [];
  let upserted = 0;
  for (const calendar of results) {
    const events = await listCalendarEvents(calendar.id);
    for (const event of events.results ?? []) {
      const meetingUrl = event.meeting_url ?? null;
      const startsAt = event.start_time;
      if (!startsAt) continue;
      const attendees = (event.raw?.attendees ?? event.attendees ?? [])
        .map((person) =>
          typeof person === "string"
            ? person
            : person.email ?? person.emailAddress ?? "",
        )
        .filter(Boolean);
      let contactId: string | null = null;
      for (const email of attendees) {
        const { data } = await supabase.rpc("match_contact_by_email", {
          p_owner: userId,
          p_email: String(email).toLowerCase(),
        });
        if (data) {
          contactId = data as string;
          break;
        }
      }

      const { data: existing } = await supabase
        .from("meetings")
        .select("id, contact_id, recall_bot_id")
        .eq("calendar_event_id", event.id)
        .maybeSingle();

      const title = event.raw?.summary ?? event.title ?? "Untitled meeting";
      const status = event.bots?.length
        ? "bot_scheduled"
        : existing?.recall_bot_id
          ? "bot_scheduled"
          : "scheduled";
      const payload = {
        title,
        starts_at: startsAt,
        ends_at: event.end_time ?? null,
        meeting_url: meetingUrl,
        status,
        ...(contactId ? { contact_id: contactId } : {}),
      };

      const { error: writeError } = existing
        ? await supabase.from("meetings").update(payload).eq("id", existing.id)
        : await supabase.from("meetings").insert({
            ...payload,
            owner_id: userId,
            calendar_event_id: event.id,
            contact_id: contactId,
          });
      if (!writeError) upserted += 1;
    }
  }
  await supabase.from("integrations").upsert(
    {
      owner_id: userId,
      provider: "recall",
      extra: { calendars: results.length, synced_at: new Date().toISOString() },
    },
    { onConflict: "owner_id,provider" },
  );
  revalidatePath("/meetings");
  revalidatePath("/dashboard");
  return { upserted, calendars: results.length };
}

export async function syncRecallCalendarForm() {
  await syncRecallCalendar();
}
