"use client";

import { useTransition } from "react";
import { toggleTask } from "@/app/actions/crm";
import { dueLabel, isOverdue } from "@/lib/format";
import type { Task } from "@/lib/types";
import { cn } from "@/lib/utils";

export function TaskRow({ task }: { task: Task }) {
  const [pending, start] = useTransition();
  const overdue = isOverdue(task.due_date, task.completed);
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-lg px-1 py-2",
        pending && "opacity-70",
      )}
    >
      <input
        type="checkbox"
        className="mt-1 size-4 accent-[var(--primary)]"
        checked={task.completed}
        onChange={(e) => start(() => toggleTask(task.id, e.target.checked))}
      />
      <span className="min-w-0">
        <span className={cn("block text-sm", task.completed && "line-through text-muted-foreground")}>
          {task.title}
        </span>
        <span
          className={cn(
            "text-xs text-muted-foreground",
            overdue && "text-destructive",
          )}
        >
          {dueLabel(task.due_date)}
        </span>
      </span>
    </label>
  );
}
