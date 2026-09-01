import { notFound } from "next/navigation";
import { createNote, createTask, deleteContact } from "@/app/actions/crm";
import { ActivityTimeline } from "@/components/crm/activity-timeline";
import { BriefMePanel } from "@/components/crm/brief-me-panel";
import { EmailComposer } from "@/components/crm/email-composer";
import { NotesList } from "@/components/crm/notes-list";
import { TaskRow } from "@/components/crm/task-row";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { fullName, initials, money, when, whenAbsolute } from "@/lib/format";
import { requireUser } from "@/lib/supabase/server";
import type { Activity, Call, Contact, Deal, Note, Task } from "@/lib/types";

export default async function ContactRecordPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, userId } = await requireUser();
  const { data: contact } = await supabase
    .from("contacts")
    .select("*, company:companies(*)")
    .eq("id", id)
    .eq("owner_id", userId)
    .maybeSingle();
  if (!contact) notFound();
  const record = contact as Contact;

  const [{ data: activities }, { data: notes }, { data: tasks }, { data: deals }, { data: calls }] =
    await Promise.all([
      supabase
        .from("activities")
        .select("*")
        .eq("contact_id", id)
        .order("created_at", { ascending: false })
        .limit(40),
      supabase
        .from("notes")
        .select("*")
        .eq("contact_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("tasks")
        .select("*")
        .eq("contact_id", id)
        .order("completed", { ascending: true })
        .order("due_date", { ascending: true }),
      supabase.from("deals").select("*").eq("contact_id", id).order("updated_at", { ascending: false }),
      supabase
        .from("calls")
        .select("*")
        .eq("contact_id", id)
        .order("created_at", { ascending: false })
        .limit(3),
    ]);

  const fields = record.custom_fields ?? {};

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col gap-4 rounded-2xl bg-card p-5 ring-1 ring-foreground/10 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="size-16">
            <AvatarFallback className="text-lg">{initials(fullName(record))}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="font-heading text-3xl">{fullName(record)}</h1>
            <p className="text-sm text-muted-foreground">
              {record.job_title}
              {record.company ? ` · ${record.company.name}` : ""}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {record.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Last contact</p>
            <p>{record.last_contact_at ? when(record.last_contact_at) : "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Owner</p>
            <p>You</p>
          </div>
          <EmailComposer contactId={record.id} defaultTo={record.email} />
          <form action={deleteContact.bind(null, record.id)}>
            <Button variant="ghost" type="submit">
              Delete
            </Button>
          </form>
        </div>
      </header>

      {(fields.dog_name || fields.dog_birthday) && (
        <p className="rounded-lg bg-accent px-4 py-2 text-sm">
          Remember: {fields.dog_name ?? "their dog"}
          {fields.dog_birthday ? ` · birthday ${fields.dog_birthday}` : ""}.
        </p>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr_0.95fr]">
        <Card>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityTimeline activities={(activities ?? []) as Activity[]} />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pipeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {((deals ?? []) as Deal[]).map((deal) => (
                <div key={deal.id}>
                  <p className="font-medium">{deal.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {deal.stage} · {money(Number(deal.value), deal.currency)}
                    {deal.expected_close_date
                      ? ` · close ${whenAbsolute(deal.expected_close_date)}`
                      : ""}
                  </p>
                </div>
              ))}
              {(deals ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground">No deals linked yet.</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form action={createNote.bind(null, record.id)} className="space-y-2">
                <Textarea name="body" placeholder="Something worth remembering later." required />
                <Button type="submit" size="sm">
                  Add note
                </Button>
              </form>
              <NotesList notes={(notes ?? []) as Note[]} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <BriefMePanel contactId={record.id} />
          <Card>
            <CardHeader>
              <CardTitle>Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={createTask} className="mb-3 flex gap-2">
                <input type="hidden" name="contact_id" value={record.id} />
                <Input name="title" placeholder="Remind me…" required />
                <Input name="due_date" type="date" className="w-36" />
                <Button type="submit" size="sm">
                  Add
                </Button>
              </form>
              {((tasks ?? []) as Task[]).map((task) => (
                <TaskRow key={task.id} task={task} />
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Calls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {((calls ?? []) as Call[]).map((call) => (
                <div key={call.id} className="text-sm">
                  <p className="font-medium">{when(call.started_at ?? call.created_at)}</p>
                  <p className="mt-1 leading-relaxed text-muted-foreground">{call.summary}</p>
                  {call.recording_url && (
                    <a className="text-primary text-xs" href={call.recording_url}>
                      Recording
                    </a>
                  )}
                </div>
              ))}
              {(calls ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground">
                  When Recall.ai finishes a meeting, the summary lands here.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
