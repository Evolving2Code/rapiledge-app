"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { when, whenDatetime } from "@/lib/format";
import type { EmailMessage } from "@/lib/types";
import { cn } from "@/lib/utils";

function groupMessages(messages: EmailMessage[]) {
  const groups = new Map<string, EmailMessage[]>();
  for (const message of messages) {
    const key = message.thread_id ?? message.gmail_message_id ?? message.id;
    const list = groups.get(key) ?? [];
    list.push(message);
    groups.set(key, list);
  }
  return [...groups.values()].map((thread) =>
    thread.slice().sort((a, b) => a.created_at.localeCompare(b.created_at)),
  );
}

function MessageBody({ message }: { message: EmailMessage }) {
  return (
    <article className="rounded-lg border px-3 py-3">
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            "text-xs font-medium uppercase",
            message.direction === "sent" ? "text-primary" : "text-muted-foreground",
          )}
        >
          {message.direction}
        </span>
        <span className="text-xs text-muted-foreground">
          {whenDatetime(message.created_at)}
        </span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {message.direction === "sent"
          ? `To ${message.to_email ?? "unknown"}`
          : `From ${message.from_email ?? "unknown"}`}
      </p>
      <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">
        {message.body || message.snippet || "(empty)"}
      </p>
    </article>
  );
}

export function EmailList({ messages }: { messages: EmailMessage[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const threads = useMemo(() => groupMessages(messages), [messages]);

  if (threads.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Mail that matches this person lands here — sent from the record, or
        pushed in from Gmail.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {threads.map((thread) => {
        const latest = thread[thread.length - 1];
        const key = latest.thread_id ?? latest.id;
        return (
          <article key={key} className="rounded-lg border px-3 py-3">
            <div className="flex items-center justify-between gap-2">
              <span
                className={cn(
                  "text-xs font-medium uppercase",
                  latest.direction === "sent" ? "text-primary" : "text-muted-foreground",
                )}
              >
                {latest.direction}
                {thread.length > 1 ? ` · ${thread.length}` : ""}
              </span>
              <span className="text-xs text-muted-foreground">{when(latest.created_at)}</span>
            </div>
            <p className="mt-1 text-sm font-medium">{latest.subject || "(no subject)"}</p>
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {latest.snippet || latest.body}
            </p>
            <Dialog
              open={openId === key}
              onOpenChange={(open) => setOpenId(open ? key : null)}
            >
              <DialogTrigger asChild>
                <Button size="sm" variant="ghost" className="mt-1 px-0">
                  {thread.length > 1 ? "Open thread" : "Read"}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>{latest.subject || "(no subject)"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  {thread.map((message) => (
                    <MessageBody key={message.id} message={message} />
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </article>
        );
      })}
    </div>
  );
}
