"use client";

import { useRouter } from "next/navigation";
import { format, isPast, isToday } from "date-fns";
import { Plus } from "lucide-react";
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
import { createTask, toggleTask } from "@/lib/actions/crm";
import { toast } from "sonner";
import type { Task } from "@/lib/types";
import { useState } from "react";

interface TasksPanelProps {
  contactId: string;
  tasks: Task[];
}

export function TasksPanel({ contactId, tasks }: TasksPanelProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

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
    const formData = new FormData(e.currentTarget);
    formData.set("contact_id", contactId);
    try {
      await createTask(formData);
      toast.success("Task created");
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create task");
    } finally {
      setLoading(false);
    }
  }

  const openTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Tasks</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm">
              <Plus className="h-3 w-3" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Task</DialogTitle>
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
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Creating..." : "Create Task"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2 max-h-48 overflow-y-auto">
        {openTasks.map((task) => (
          <TaskItem key={task.id} task={task} onToggle={handleToggle} />
        ))}
        {openTasks.length === 0 && (
          <p className="text-xs text-muted-foreground">No open tasks</p>
        )}
        {completedTasks.length > 0 && (
          <p className="pt-2 text-xs font-medium text-muted-foreground">
            Completed
          </p>
        )}
        {completedTasks.map((task) => (
          <TaskItem key={task.id} task={task} onToggle={handleToggle} />
        ))}
      </div>
    </div>
  );
}

function TaskItem({
  task,
  onToggle,
}: {
  task: Task;
  onToggle: (id: string, completed: boolean) => void;
}) {
  const overdue =
    task.due_date &&
    !task.completed &&
    isPast(new Date(task.due_date)) &&
    !isToday(new Date(task.due_date));

  return (
    <div className="flex items-center gap-2 rounded-lg border border-border/40 px-2 py-1.5">
      <Checkbox
        checked={task.completed}
        onCheckedChange={(checked) => onToggle(task.id, !!checked)}
      />
      <span
        className={`flex-1 text-sm ${task.completed ? "line-through text-muted-foreground" : ""}`}
      >
        {task.title}
      </span>
      {task.due_date && (
        <span
          className={`text-xs ${overdue ? "text-destructive" : "text-muted-foreground"}`}
        >
          {format(new Date(task.due_date), "MMM d")}
        </span>
      )}
    </div>
  );
}
