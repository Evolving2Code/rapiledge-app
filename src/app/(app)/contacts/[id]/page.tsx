import Link from "next/link";
import { notFound } from "next/navigation";
import { createDeal, createTask, deleteContact } from "@/app/actions/crm";
import { ActivityTimeline } from "@/components/crm/activity-timeline";
import { BriefMePanel } from "@/components/crm/brief-me-panel";
import { CallCard } from "@/components/crm/call-card";
import { ConfirmDelete } from "@/components/crm/confirm-delete";
import { ContactEditor } from "@/components/crm/contact-editor";
import { EmailComposer } from "@/components/crm/email-composer";
import { EmailList } from "@/components/crm/email-list";
import { NoteComposer } from "@/components/crm/note-composer";
import { NotesList } from "@/components/crm/notes-list";
import { TaskRow } from "@/components/crm/task-row";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DEAL_STAGES } from "@/lib/constants";
import { extraCustomFields, stageLabel } from "@/lib/forms";
import { fullName, initials, money, when, whenAbsolute } from "@/lib/format";
import { requireUser } from "@/lib/supabase/server";
import type {
  Activity,
  Call,
  Company,
  Contact,
  Deal,
  EmailMessage,
  Note,
  Task,
} from "@/lib/types";

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

  const [
    { data: activities },
    { data: notes },
    { data: tasks },
    { data: deals },
    { data: calls },
    { data: emails },
    { data: companies },
    { data: profile },
  ] = await Promise.all([
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
      .limit(5),
    supabase
      .from("email_messages")
      .select("*")
      .eq("contact_id", id)
      .order("created_at", { ascending: false })
      .limit(24),
    supabase.from("companies").select("*").eq("owner_id", userId).order("name"),
    supabase.from("profiles").select("full_name").eq("id", userId).maybeSingle(),
  ]);

  const fields = record.custom_fields ?? {};
  const extras = extraCustomFields(fields);
  const dealList = (deals ?? []) as Deal[];
  const currentDeal = dealList.find((deal) => !["won", "lost"].includes(deal.stage)) ?? dealList[0];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col gap-4 rounded-2xl bg-card p-5 ring-1 ring-foreground/10 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="size-16">
            <AvatarFallback className="text-lg">{initials(fullName(record))}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="font-heading text-3xl">{fullName(record)}</h1>
            <p className="text-sm text-muted-foreground">
              {record.job_title}
              {record.company ? (
                <>
                  {" · "}
                  <Link className="hover:underline" href={`/companies/${record.company.id}`}>
                    {record.company.name}
                  </Link>
                </>
              ) : null}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {record.email ?? "No email"}
              {record.phone ? ` · ${record.phone}` : ""}
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
            <p className="text-xs text-muted-foreground">Deal stage</p>
            <p>{currentDeal ? stageLabel(currentDeal.stage) : "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Owner</p>
            <p>{profile?.full_name || "You"}</p>
          </div>
          <EmailComposer contactId={record.id} defaultTo={record.email} />
          <ContactEditor contact={record} companies={(companies ?? []) as Company[]} />
          <ConfirmDelete
            description="This contact, and the notes tied only to them, leave the ledger."
            onConfirm={() => deleteContact(record.id)}
          />
        </div>
      </header>

      {(fields.dog_name || fields.dog_birthday || extras.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {(fields.dog_name || fields.dog_birthday) && (
            <p className="rounded-lg bg-accent px-4 py-2 text-sm">
              Remember: {fields.dog_name ?? "their dog"}
              {fields.dog_birthday ? ` · birthday ${fields.dog_birthday}` : ""}.
            </p>
          )}
          {extras.map(([key, value]) => (
            <p key={key} className="rounded-lg bg-muted px-4 py-2 text-sm">
              {key}: {value}
            </p>
          ))}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr_0.95fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityTimeline activities={(activities ?? []) as Activity[]} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Mail</CardTitle>
            </CardHeader>
            <CardContent>
              <EmailList messages={(emails ?? []) as EmailMessage[]} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pipeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {dealList.map((deal) => (
                <Link key={deal.id} href={`/pipeline/${deal.id}`} className="block rounded-lg hover:bg-muted/50">
                  <p className="font-medium">{deal.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {stageLabel(deal.stage)} · {money(Number(deal.value), deal.currency)}
                    {deal.expected_close_date
                      ? ` · close ${whenAbsolute(deal.expected_close_date)}`
                      : ""}
                  </p>
                </Link>
              ))}
              <form action={createDeal} className="space-y-2 border-t pt-3">
                <input type="hidden" name="contact_id" value={record.id} />
                {record.company_id && (
                  <input type="hidden" name="company_id" value={record.company_id} />
                )}
                <Input name="title" placeholder="New deal title" required />
                <div className="flex gap-2">
                  <Input name="value" type="number" min="0" placeholder="Value" />
                  <select
                    name="stage"
                    className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
                    defaultValue="lead"
                  >
                    {DEAL_STAGES.map((stage) => (
                      <option key={stage.id} value={stage.id}>
                        {stage.label}
                      </option>
                    ))}
                  </select>
                  <Button type="submit" size="sm">
                    Add
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <NoteComposer contactId={record.id} />
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
            <CardContent className="space-y-5">
              {((calls ?? []) as Call[]).map((call) => (
                <CallCard key={call.id} call={call} />
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
