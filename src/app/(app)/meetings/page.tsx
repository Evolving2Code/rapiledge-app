import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fullName, whenDatetime } from "@/lib/format";
import { requireUser } from "@/lib/supabase/server";
import type { Meeting } from "@/lib/types";

export default async function MeetingsPage() {
  const { supabase, userId } = await requireUser();
  const { data } = await supabase
    .from("meetings")
    .select("*, contact:contacts(*)")
    .eq("owner_id", userId)
    .order("starts_at", { ascending: true });
  const meetings = (data ?? []) as Meeting[];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-heading text-4xl">Meetings</h1>
          <p className="text-sm text-muted-foreground">
            Recall.ai joins. Claude writes. You walk in briefed.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/settings">Connect calendar</Link>
        </Button>
      </div>
      <div className="divide-y rounded-xl bg-card ring-1 ring-foreground/10">
        {meetings.map((meeting) => (
          <div key={meeting.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-4">
            <div>
              <p className="font-medium">{meeting.title ?? "Untitled meeting"}</p>
              <p className="text-sm text-muted-foreground">{whenDatetime(meeting.starts_at)}</p>
              {meeting.contact && (
                <Link className="text-primary text-sm hover:underline" href={`/contacts/${meeting.contact.id}`}>
                  Brief me · {fullName(meeting.contact)}
                </Link>
              )}
            </div>
            <Badge variant="secondary">{meeting.status}</Badge>
          </div>
        ))}
        {meetings.length === 0 && (
          <p className="px-4 py-10 text-sm text-muted-foreground">
            No upcoming meetings. Connect Google Calendar through Recall.ai in Settings.
          </p>
        )}
      </div>
    </div>
  );
}
