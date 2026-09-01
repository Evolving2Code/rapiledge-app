import { createTask } from "@/app/actions/crm";
import { TaskRow } from "@/components/crm/task-row";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isOverdue } from "@/lib/format";
import { requireUser } from "@/lib/supabase/server";
import type { Contact, Task } from "@/lib/types";

export default async function TasksPage() {
  const { supabase, userId } = await requireUser();
  const [{ data: tasks }, { data: contacts }] = await Promise.all([
    supabase
      .from("tasks")
      .select("*, contact:contacts(*)")
      .eq("owner_id", userId)
      .order("completed", { ascending: true })
      .order("due_date", { ascending: true, nullsFirst: false }),
    supabase.from("contacts").select("*").eq("owner_id", userId).order("last_name"),
  ]);
  const list = (tasks ?? []) as Task[];
  const overdue = list.filter((t) => isOverdue(t.due_date, t.completed));

  return (
    <div className="mx-auto grid max-w-4xl gap-8 lg:grid-cols-[1fr_300px]">
      <div>
        <h1 className="font-heading text-4xl">Tasks</h1>
        {overdue.length > 0 && (
          <p className="mt-2 text-sm text-destructive">{overdue.length} overdue — they will surface on the dashboard until you finish them.</p>
        )}
        <div className="mt-6 divide-y rounded-xl bg-card px-3 py-2 ring-1 ring-foreground/10">
          {list.map((task) => (
            <div key={task.id} className="py-1">
              <TaskRow task={task} />
              {task.contact && (
                <p className="mb-2 pl-8 text-xs text-muted-foreground">
                  {task.contact.first_name} {task.contact.last_name}
                </p>
              )}
            </div>
          ))}
          {list.length === 0 && (
            <p className="px-2 py-8 text-sm text-muted-foreground">No tasks. Add one that will matter later.</p>
          )}
        </div>
      </div>
      <form action={createTask} className="h-fit space-y-3 rounded-xl bg-card p-5 ring-1 ring-foreground/10">
        <h2 className="font-heading text-xl">New reminder</h2>
        <div className="space-y-1">
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="due_date">Due</Label>
          <Input id="due_date" name="due_date" type="datetime-local" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="contact_id">Contact</Label>
          <select
            id="contact_id"
            name="contact_id"
            className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
          >
            <option value="">Standalone</option>
            {((contacts ?? []) as Contact[]).map((contact) => (
              <option key={contact.id} value={contact.id}>
                {contact.first_name} {contact.last_name}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit">Add task</Button>
      </form>
    </div>
  );
}
