"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { format, isPast, isToday } from "date-fns";
import Link from "next/link";
import { Plus, AlertCircle } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { createTask, toggleTask } from "@/lib/actions/crm";
import { contactDisplayName, type Contact, type Task } from "@/lib/types";
import { toast } from "sonner";

interface TasksPageClientProps {
  tasks: (Task & { contact: Pick<Contact, "first_name" | "last_name" | "id"> | null })[];
  email?: string;
}

export function TasksPageClient({ tasks, email }: TasksPageClientProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const openTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);
  const overdue = openTasks.filter(
    (t) =>
      t.due_date &&
      isPast(new Date(t.due_date)) &&
      !isToday(new Date(t.due_date))
  );

  async function handleToggle(taskId: string, completed: boolean) {
    try {
      await toggleTask(taskId, completed);
      router.refresh();
    } catch {
      toast.error("Failed to update task");
    }
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      await createTask(new FormData(e.currentTarget));
      toast.success("Task created");
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create task");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <AppHeader
        title="Tasks"
        subtitle={`${openTasks.length} open · ${overdue.length} overdue`}
        email={email}
      />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mb-6 flex justify-end">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gold-glow">
                <Plus className="mr-2 h-4 w-4" />
                New Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Task</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" name="title" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="due_date">Due date</Label>
                  <Input id="due_date" name="due_date" type="date" />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating..." : "Create Task"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {overdue.length > 0 && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {overdue.length} task{overdue.length !== 1 ? "s" : ""} overdue
          </div>
        )}

        <div className="space-y-6">
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Open
            </h2>
            <div className="space-y-2">
              {openTasks.map((task) => (
                <TaskCard key={task.id} task={task} onToggle={handleToggle} />
              ))}
              {openTasks.length === 0 && (
                <p className="text-sm text-muted-foreground">No open tasks</p>
              )}
            </div>
          </section>

          {completedTasks.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Completed
              </h2>
              <div className="space-y-2">
                {completedTasks.map((task) => (
                  <TaskCard key={task.id} task={task} onToggle={handleToggle} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  );
}

function TaskCard({
  task,
  onToggle,
}: {
  task: Task & { contact: Pick<Contact, "first_name" | "last_name" | "id"> | null };
  onToggle: (id: string, completed: boolean) => void;
}) {
  const overdue =
    task.due_date &&
    !task.completed &&
    isPast(new Date(task.due_date)) &&
    !isToday(new Date(task.due_date));

  return (
    <Card className="glass-card">
      <CardContent className="flex items-center gap-3 p-4">
        <Checkbox
          checked={task.completed}
          onCheckedChange={(checked) => onToggle(task.id, !!checked)}
        />
        <div className="min-w-0 flex-1">
          <p
            className={`text-sm font-medium ${task.completed ? "line-through text-muted-foreground" : ""}`}
          >
            {task.title}
          </p>
          {task.contact && (
            <Link
              href={`/contacts/${task.contact.id}`}
              className="text-xs text-muted-foreground hover:text-primary"
            >
              {contactDisplayName(task.contact)}
            </Link>
          )}
        </div>
        {task.due_date && (
          <span
            className={`shrink-0 text-xs ${overdue ? "font-medium text-destructive" : "text-muted-foreground"}`}
          >
            {format(new Date(task.due_date), "MMM d, yyyy")}
          </span>
        )}
      </CardContent>
    </Card>
  );
}
