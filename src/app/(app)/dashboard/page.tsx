import Link from "next/link";
import { format, isPast, isToday } from "date-fns";
import {
  Users,
  DollarSign,
  CheckSquare,
  Activity,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import {
  contactDisplayName,
  formatCurrency,
  DEAL_STAGES,
  type Activity as ActivityType,
  type Contact,
  type Deal,
  type Task,
} from "@/lib/types";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [contactsRes, dealsRes, tasksRes, activitiesRes] = await Promise.all([
    supabase.from("contacts").select("id", { count: "exact", head: true }),
    supabase.from("deals").select("*").not("stage", "in", '("closed_won","closed_lost")'),
    supabase
      .from("tasks")
      .select("*, contact:contacts(first_name, last_name)")
      .eq("completed", false)
      .order("due_date", { ascending: true })
      .limit(10),
    supabase
      .from("activities")
      .select("*, contact:contacts(first_name, last_name)")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const deals = (dealsRes.data ?? []) as Deal[];
  const tasks = (tasksRes.data ?? []) as (Task & { contact: Pick<Contact, "first_name" | "last_name"> | null })[];
  const activities = (activitiesRes.data ?? []) as (ActivityType & {
    contact: Pick<Contact, "first_name" | "last_name"> | null;
  })[];

  const pipelineValue = deals.reduce((sum, d) => sum + Number(d.value), 0);
  const dealsByStage = DEAL_STAGES.filter(
    (s) => !["closed_won", "closed_lost"].includes(s.id)
  ).map((stage) => ({
    ...stage,
    count: deals.filter((d) => d.stage === stage.id).length,
    value: deals
      .filter((d) => d.stage === stage.id)
      .reduce((sum, d) => sum + Number(d.value), 0),
  }));

  const overdueTasks = tasks.filter(
    (t) => t.due_date && isPast(new Date(t.due_date)) && !isToday(new Date(t.due_date))
  );
  const todayTasks = tasks.filter(
    (t) => t.due_date && isToday(new Date(t.due_date))
  );

  return (
    <>
      <AppHeader
        title="Dashboard"
        subtitle="Your command center"
        email={user?.email}
      />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={Users}
            label="Contacts"
            value={String(contactsRes.count ?? 0)}
          />
          <StatCard
            icon={DollarSign}
            label="Pipeline Value"
            value={formatCurrency(pipelineValue)}
          />
          <StatCard
            icon={CheckSquare}
            label="Open Tasks"
            value={String(tasks.length)}
            accent={overdueTasks.length > 0 ? "destructive" : undefined}
          />
          <StatCard
            icon={Activity}
            label="Active Deals"
            value={String(deals.length)}
          />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <Card className="glass-card lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Pipeline</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/pipeline">
                  View <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {dealsByStage.map((stage) => (
                <div key={stage.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={stage.color}>
                      {stage.label}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {stage.count}
                    </span>
                  </div>
                  <span className="text-sm font-medium">
                    {formatCurrency(stage.value)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="glass-card lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Tasks</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/tasks">
                  View all <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {overdueTasks.length > 0 && (
                <div className="mb-3 flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {overdueTasks.length} overdue
                </div>
              )}
              {todayTasks.length > 0 && (
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-primary">
                  Due today
                </p>
              )}
              {[...todayTasks, ...tasks.filter((t) => !todayTasks.includes(t))]
                .slice(0, 6)
                .map((task) => (
                  <TaskRow key={task.id} task={task} />
                ))}
              {tasks.length === 0 && (
                <p className="text-sm text-muted-foreground">No open tasks</p>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {activities.map((activity) => (
                <div key={activity.id} className="flex gap-3 text-sm">
                  <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate">
                      <span className="capitalize text-muted-foreground">
                        {activity.type.replace("_", " ")}
                      </span>
                      {activity.contact && (
                        <>
                          {" · "}
                          <Link
                            href={`/contacts/${activity.contact_id}`}
                            className="text-foreground hover:text-primary"
                          >
                            {contactDisplayName(activity.contact)}
                          </Link>
                        </>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(activity.created_at), "MMM d, h:mm a")}
                    </p>
                  </div>
                </div>
              ))}
              {activities.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No activity yet. Add a contact to get started.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  accent?: "destructive";
}) {
  return (
    <Card className="glass-card">
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Icon
            className={`h-5 w-5 ${accent === "destructive" ? "text-destructive" : "text-primary"}`}
          />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p
            className={`text-2xl font-semibold ${accent === "destructive" ? "text-destructive" : ""}`}
          >
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function TaskRow({
  task,
}: {
  task: Task & { contact: Pick<Contact, "first_name" | "last_name"> | null };
}) {
  const overdue =
    task.due_date &&
    isPast(new Date(task.due_date)) &&
    !isToday(new Date(task.due_date));

  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-border/40 px-3 py-2">
      <span className="truncate text-sm">{task.title}</span>
      {task.due_date && (
        <span
          className={`shrink-0 text-xs ${overdue ? "text-destructive" : "text-muted-foreground"}`}
        >
          {format(new Date(task.due_date), "MMM d")}
        </span>
      )}
    </div>
  );
}
