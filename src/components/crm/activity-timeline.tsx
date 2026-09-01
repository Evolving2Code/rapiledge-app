import Link from "next/link";
import {
  Mail,
  NotebookPen,
  Phone,
  SquareCheckBig,
  GitBranch,
} from "lucide-react";
import { fullName, when } from "@/lib/format";
import type { Activity } from "@/lib/types";

const ICONS = {
  email: Mail,
  call: Phone,
  note: NotebookPen,
  task: SquareCheckBig,
  deal_stage_change: GitBranch,
};

function label(activity: Activity) {
  const p = activity.payload;
  switch (activity.type) {
    case "email":
      return `${p.direction === "sent" ? "Sent" : "Received"}: ${p.subject ?? p.snippet ?? "email"}`;
    case "call":
      return String(p.summary ?? "Call logged");
    case "note":
      return String(p.preview ?? "Note");
    case "task":
      return String(p.title ?? "Task");
    case "deal_stage_change":
      return `${p.title ?? "Deal"} → ${p.stage ?? "updated"}`;
    default:
      return activity.type;
  }
}

export function ActivityTimeline({ activities }: { activities: Activity[] }) {
  if (activities.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nothing in the stream yet. Notes, mail, calls, and stage changes land
        here — only if they will matter later.
      </p>
    );
  }
  return (
    <ol className="space-y-4">
      {activities.map((activity) => {
        const Icon = ICONS[activity.type];
        return (
          <li key={activity.id} className="flex gap-3">
            <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary">
              <Icon className="size-3.5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm leading-relaxed">{label(activity)}</p>
              <p className="text-xs text-muted-foreground">
                {when(activity.created_at)}
                {activity.contact ? (
                  <>
                    {" · "}
                    <Link
                      href={`/contacts/${activity.contact.id}`}
                      className="hover:text-primary hover:underline"
                    >
                      {fullName(activity.contact)}
                    </Link>
                  </>
                ) : null}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
