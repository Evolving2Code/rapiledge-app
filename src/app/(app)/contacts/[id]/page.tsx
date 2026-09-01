import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { Mail, Phone, Building2, ArrowLeft } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { BriefMePanel } from "@/components/brief-me/brief-me-panel";
import { ComposeEmailDialog } from "@/components/email/compose-email-dialog";
import { ActivityTimeline } from "@/components/timeline/activity-timeline";
import { DealsPanel } from "@/components/deals/deals-panel";
import { NotesPanel } from "@/components/notes/notes-panel";
import { TasksPanel } from "@/components/tasks/tasks-panel";
import { createClient } from "@/lib/supabase/server";
import {
  contactDisplayName,
  DEAL_STAGES,
  type Contact,
  type Company,
  type Deal,
  type Note,
  type Task,
  type Activity,
} from "@/lib/types";

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: contact } = await supabase
    .from("contacts")
    .select("*, company:companies(*)")
    .eq("id", id)
    .single();

  if (!contact) notFound();

  const typedContact = contact as Contact & { company: Company | null };

  const [activitiesRes, notesRes, tasksRes, dealsRes, gmailRes] = await Promise.all([
    supabase
      .from("activities")
      .select("*")
      .eq("contact_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("notes")
      .select("*")
      .eq("contact_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("tasks")
      .select("*")
      .eq("contact_id", id)
      .order("due_date", { ascending: true }),
    supabase.from("deals").select("*").eq("contact_id", id),
    supabase
      .from("google_integrations")
      .select("id")
      .eq("user_id", user!.id)
      .maybeSingle(),
  ]);

  const name = contactDisplayName(typedContact);
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const primaryDeal = (dealsRes.data as Deal[] | null)?.find(
    (d) => !["closed_won", "closed_lost"].includes(d.stage)
  );
  const dealStage = primaryDeal
    ? DEAL_STAGES.find((s) => s.id === primaryDeal.stage)
    : null;

  return (
    <>
      <AppHeader title={name} subtitle={typedContact.title ?? undefined} email={user?.email} />
      <main className="flex-1 overflow-y-auto">
        <div className="border-b border-border/60 px-6 py-4">
          <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
            <Link href="/contacts">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Contacts
            </Link>
          </Button>

          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            <Avatar className="h-20 w-20 border-2 border-primary/20">
              <AvatarFallback className="bg-primary/10 text-2xl text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-bold">{name}</h2>
                {dealStage && (
                  <Badge variant="outline" className={dealStage.color}>
                    {dealStage.label}
                  </Badge>
                )}
              </div>

              {typedContact.company && (
                <p className="mt-1 flex items-center gap-1.5 text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  {typedContact.company.name}
                </p>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-3">
                {typedContact.email && (
                  <>
                    <a
                      href={`mailto:${typedContact.email}`}
                      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
                    >
                      <Mail className="h-4 w-4" />
                      {typedContact.email}
                    </a>
                    <ComposeEmailDialog
                      contactId={id}
                      contactEmail={typedContact.email}
                      contactName={name}
                      gmailConnected={!!gmailRes.data}
                    />
                  </>
                )}
                {typedContact.phone && (
                  <a
                    href={`tel:${typedContact.phone}`}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
                  >
                    <Phone className="h-4 w-4" />
                    {typedContact.phone}
                  </a>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                {typedContact.last_contact_at && (
                  <span>
                    Last contact:{" "}
                    {format(new Date(typedContact.last_contact_at), "MMM d, yyyy")}
                  </span>
                )}
                {primaryDeal && (
                  <span className="text-primary">
                    Deal: ${Number(primaryDeal.value).toLocaleString()}
                  </span>
                )}
              </div>

              {typedContact.tags?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {typedContact.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="w-full lg:w-80">
              <BriefMePanel contactId={id} />
            </div>
          </div>
        </div>

        <div className="grid gap-6 p-6 lg:grid-cols-3">
          <div className="glass-card rounded-xl p-5 lg:col-span-2">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Activity Timeline
            </h3>
            <ActivityTimeline
              activities={(activitiesRes.data ?? []) as Activity[]}
            />
          </div>

          <div className="space-y-6">
            <div className="glass-card rounded-xl p-5">
              <DealsPanel
                contactId={id}
                deals={(dealsRes.data ?? []) as Deal[]}
              />
              <Separator className="my-4" />
              <TasksPanel
                contactId={id}
                tasks={(tasksRes.data ?? []) as Task[]}
              />
              <Separator className="my-4" />
              <NotesPanel
                contactId={id}
                notes={(notesRes.data ?? []) as Note[]}
              />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
