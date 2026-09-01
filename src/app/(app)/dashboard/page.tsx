import Link from "next/link";
import { SeedButton } from "@/components/crm/seed-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DEAL_STAGES, OPEN_DEAL_STAGES } from "@/lib/constants";
import { dueLabel, fullName, isOverdue, money, when, whenDatetime } from "@/lib/format";
import { requireUser } from "@/lib/supabase/server";
import type { Activity, Deal, Meeting, Task } from "@/lib/types";
import { cn } from "@/lib/utils";

export default async function DashboardPage() {
  const { supabase, userId } = await requireUser();

  const [
    { data: deals },
    { data: tasks },
    { data: activities },
    { data: meetings },
    { count: contactCount },
  ] = await Promise.all([
    supabase.from("deals").select("*, contact:contacts(*)").eq("owner_id", userId),
    supabase
      .from("tasks")
      .select("*, contact:contacts(*)")
      .eq("owner_id", userId)
      .eq("completed", false)
      .order("due_date", { ascending: true }),
    supabase
      .from("activities")
      .select("*, contact:contacts(id, first_name, last_name)")
      .eq("owner_id", userId)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("meetings")
      .select("*, contact:contacts(*)")
      .eq("owner_id", userId)
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true })
      .limit(5),
    supabase.from("contacts").select("*", { count: "exact", head: true }).eq("owner_id", userId),
  ]);

  const dealList = (deals ?? []) as Deal[];
  const taskList = (tasks ?? []) as Task[];
  const openValue = dealList
    .filter((d) => OPEN_DEAL_STAGES.includes(d.stage))
    .reduce((sum, d) => sum + Number(d.value || 0), 0);
  const overdue = taskList.filter((t) => isOverdue(t.due_date, t.completed));
  const dueToday = taskList.filter(
    (t) => t.due_date && new Date(t.due_date).toDateString() === new Date().toDateString(),
  );

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-[0.18em] text-primary uppercase">
            Today&apos;s ledger
          </p>
          <h1 className="font-heading text-4xl">Dashboard</h1>
        </div>
        <div className="flex gap-2">
          {(contactCount ?? 0) === 0 && <SeedButton />}
          <Button asChild>
            <Link href="/contacts/new">New contact</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Open pipeline</CardTitle>
          </CardHeader>
          <CardContent className="font-heading text-3xl">{money(openValue)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Due today</CardTitle>
          </CardHeader>
          <CardContent className="font-heading text-3xl">{dueToday.length}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Overdue</CardTitle>
          </CardHeader>
          <CardContent className="font-heading text-3xl text-destructive">
            {overdue.length}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Contacts</CardTitle>
          </CardHeader>
          <CardContent className="font-heading text-3xl">{contactCount ?? 0}</CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Deals by stage</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            {DEAL_STAGES.map((stage) => {
              const subset = dealList.filter((d) => d.stage === stage.id);
              const total = subset.reduce((s, d) => s + Number(d.value || 0), 0);
              return (
                <Link
                  key={stage.id}
                  href="/pipeline"
                  className="rounded-lg bg-muted/60 px-3 py-3 hover:bg-muted"
                >
                  <p className="text-xs text-muted-foreground">{stage.label}</p>
                  <p className="font-heading text-xl">{money(total)}</p>
                  <p className="text-xs text-muted-foreground">{subset.length} deals</p>
                </Link>
              );
            })}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Upcoming meetings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(meetings as Meeting[] | null)?.length ? (
              (meetings as Meeting[]).map((meeting) => (
                <div key={meeting.id} className="text-sm">
                  <Link href="/meetings" className="font-medium hover:underline">
                    {meeting.title}
                  </Link>
                  <p className="text-muted-foreground">{whenDatetime(meeting.starts_at)}</p>
                  {meeting.contact && (
                    <Link
                      className="text-primary text-xs hover:underline"
                      href={`/contacts/${meeting.contact.id}`}
                    >
                      Brief me · {fullName(meeting.contact)}
                    </Link>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Connect calendar in Settings so RapiLedge can meet you at the door.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tasks that will bite</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {taskList.slice(0, 6).map((task) => (
              <div key={task.id} className="flex items-start justify-between gap-3 text-sm">
                <div>
                  <p>{task.title}</p>
                  <p
                    className={cn(
                      "text-xs text-muted-foreground",
                      isOverdue(task.due_date, task.completed) && "text-destructive",
                    )}
                  >
                    {dueLabel(task.due_date)}
                    {task.contact ? (
                      <>
                        {" · "}
                        <Link className="hover:underline" href={`/contacts/${task.contact.id}`}>
                          {fullName(task.contact)}
                        </Link>
                      </>
                    ) : null}
                  </p>
                </div>
                {isOverdue(task.due_date, task.completed) && (
                  <Badge variant="destructive">Overdue</Badge>
                )}
              </div>
            ))}
            {taskList.length === 0 && (
              <p className="text-sm text-muted-foreground">No open tasks. Suspicious, but nice.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {((activities ?? []) as Activity[]).map((activity) => (
              <p key={activity.id} className="text-sm">
                <span className="text-muted-foreground">{when(activity.created_at)} · </span>
                {activity.type.replaceAll("_", " ")}
                {activity.contact ? (
                  <>
                    {" · "}
                    <Link
                      className="text-primary hover:underline"
                      href={`/contacts/${activity.contact.id}`}
                    >
                      {fullName(activity.contact)}
                    </Link>
                  </>
                ) : null}
              </p>
            ))}
            {(activities ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">The stream is quiet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
