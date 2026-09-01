import Link from "next/link";
import { createMeeting, syncRecallCalendarForm } from "@/app/actions/meetings";
import { SendBotButton } from "@/components/crm/send-bot-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fullName, whenDatetime } from "@/lib/format";
import { recallConfigured } from "@/lib/recall/client";
import { requireUser } from "@/lib/supabase/server";
import type { Contact, Meeting } from "@/lib/types";

export default async function MeetingsPage() {
  const { supabase, userId } = await requireUser();
  const cutoff = new Date().toISOString();
  const [{ data: upcomingRows }, { data: pastRows }, { data: contacts }] = await Promise.all([
    supabase
      .from("meetings")
      .select("*, contact:contacts(*)")
      .eq("owner_id", userId)
      .gte("starts_at", cutoff)
      .order("starts_at", { ascending: true }),
    supabase
      .from("meetings")
      .select("*, contact:contacts(*)")
      .eq("owner_id", userId)
      .lt("starts_at", cutoff)
      .order("starts_at", { ascending: false })
      .limit(12),
    supabase.from("contacts").select("*").eq("owner_id", userId).order("last_name"),
  ]);
  const upcoming = (upcomingRows ?? []) as Meeting[];
  const past = (pastRows ?? []) as Meeting[];

  return (
    <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1fr_300px]">
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-heading text-4xl">Meetings</h1>
            <p className="text-sm text-muted-foreground">
              Recall.ai joins. Claude writes. You walk in briefed.
            </p>
          </div>
          <div className="flex gap-2">
            {recallConfigured() && (
              <form action={syncRecallCalendarForm}>
                <Button type="submit" variant="outline">
                  Sync calendar
                </Button>
              </form>
            )}
            <Button asChild variant="outline">
              <Link href="/settings">Connect calendar</Link>
            </Button>
          </div>
        </div>
        <section>
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">Upcoming</h2>
          <div className="divide-y rounded-xl bg-card ring-1 ring-foreground/10">
            {upcoming.map((meeting) => (
              <MeetingRow key={meeting.id} meeting={meeting} />
            ))}
            {upcoming.length === 0 && (
              <p className="px-4 py-8 text-sm text-muted-foreground">
                Nothing on the books. Add a meeting, or sync Recall.ai.
              </p>
            )}
          </div>
        </section>
        {past.length > 0 && (
          <section>
            <h2 className="mb-2 text-sm font-medium text-muted-foreground">Past</h2>
            <div className="divide-y rounded-xl bg-card ring-1 ring-foreground/10">
              {past.map((meeting) => (
                  <MeetingRow key={meeting.id} meeting={meeting} />
                ))}
            </div>
          </section>
        )}
      </div>
      <form action={createMeeting} className="h-fit space-y-3 rounded-xl bg-card p-5 ring-1 ring-foreground/10">
        <h2 className="font-heading text-xl">Log a meeting</h2>
        <div className="space-y-1">
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="starts_at">Starts</Label>
          <Input id="starts_at" name="starts_at" type="datetime-local" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="meeting_url">Join URL</Label>
          <Input id="meeting_url" name="meeting_url" placeholder="https://meet.google.com/…" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="contact_id">Contact</Label>
          <select
            id="contact_id"
            name="contact_id"
            className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
          >
            <option value="">Unmatched</option>
            {((contacts ?? []) as Contact[]).map((contact) => (
              <option key={contact.id} value={contact.id}>
                {contact.first_name} {contact.last_name}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit">Save meeting</Button>
      </form>
    </div>
  );
}

function MeetingRow({ meeting }: { meeting: Meeting }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4">
      <div>
        <p className="font-medium">{meeting.title ?? "Untitled meeting"}</p>
        <p className="text-sm text-muted-foreground">{whenDatetime(meeting.starts_at)}</p>
        {meeting.contact && (
          <Link className="text-primary text-sm hover:underline" href={`/contacts/${meeting.contact.id}`}>
            Brief me · {fullName(meeting.contact)}
          </Link>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="secondary">{meeting.status}</Badge>
        <SendBotButton
          meetingId={meeting.id}
          meetingUrl={meeting.meeting_url}
          calendarEventId={meeting.calendar_event_id}
        />
      </div>
    </div>
  );
}
