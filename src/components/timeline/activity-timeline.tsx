"use client";

import { format } from "date-fns";
import {
  Mail,
  Phone,
  PhoneCall,
  StickyNote,
  CheckSquare,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import type { Activity, ActivityType } from "@/lib/types";

const activityIcons: Record<ActivityType, React.ComponentType<{ className?: string }>> = {
  email: Mail,
  call: PhoneCall,
  note: StickyNote,
  task: CheckSquare,
  deal_stage_change: TrendingUp,
};

const activityColors: Record<ActivityType, string> = {
  email: "bg-blue-500/20 text-blue-400",
  call: "bg-sage/20 text-sage",
  note: "bg-primary/20 text-primary",
  task: "bg-terracotta/20 text-terracotta",
  deal_stage_change: "bg-purple-500/20 text-purple-400",
};

interface ActivityTimelineProps {
  activities: Activity[];
}

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-muted-foreground">No activity yet</p>
        <p className="mt-1 text-xs text-muted-foreground/70">
          Emails, calls, notes, and deal changes will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="relative space-y-0">
      <div className="absolute left-[19px] top-2 bottom-2 w-px bg-border/60" />
      {activities.map((activity) => (
        <ActivityItem key={activity.id} activity={activity} />
      ))}
    </div>
  );
}

function ActivityItem({ activity }: { activity: Activity }) {
  const Icon = activityIcons[activity.type];
  const colorClass = activityColors[activity.type];
  const payload = activity.payload as Record<string, string>;

  return (
    <div className="relative flex gap-4 pb-6">
      <div
        className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${colorClass}`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1 pt-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium capitalize">
            {activity.type.replace(/_/g, " ")}
          </span>
          {payload.source === "ai_call" || payload.source === "ai_email" ? (
            <Sparkles className="h-3 w-3 text-primary" />
          ) : null}
          <span className="text-xs text-muted-foreground">
            {format(new Date(activity.created_at), "MMM d, h:mm a")}
          </span>
        </div>
        <ActivityBody type={activity.type} payload={payload} />
      </div>
    </div>
  );
}

function ActivityBody({
  type,
  payload,
}: {
  type: ActivityType;
  payload: Record<string, string>;
}) {
  switch (type) {
    case "email":
      return (
        <p className="mt-1 text-sm text-muted-foreground">
          {payload.subject ?? payload.snippet ?? "Email"}
        </p>
      );
    case "call":
      return (
        <p className="mt-1 text-sm text-muted-foreground">
          {payload.summary ?? "Call logged"}
        </p>
      );
    case "note":
      return (
        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
          {payload.body}
        </p>
      );
    case "task":
      return (
        <p className="mt-1 text-sm text-muted-foreground">
          {payload.title} — {payload.action}
        </p>
      );
    case "deal_stage_change":
      return (
        <p className="mt-1 text-sm text-muted-foreground">
          <span className="font-medium">{payload.title}</span> moved to{" "}
          <span className="capitalize">{payload.stage?.replace(/_/g, " ")}</span>
        </p>
      );
    default:
      return null;
  }
}
