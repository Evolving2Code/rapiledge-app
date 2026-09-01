"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { when, whenDatetime } from "@/lib/format";
import type { Call } from "@/lib/types";

export function CallCard({ call }: { call: Call }) {
  const [open, setOpen] = useState(false);
  const items = Array.isArray(call.action_items) ? call.action_items : [];
  const flags = Array.isArray(call.flags) ? call.flags : [];
  return (
    <div className="space-y-2 text-sm">
      <div className="flex items-baseline justify-between gap-2">
        <p className="font-medium">{when(call.started_at ?? call.created_at)}</p>
        {call.sentiment && (
          <span className="text-xs text-muted-foreground">{call.sentiment}</span>
        )}
      </div>
      <p className="leading-relaxed text-muted-foreground">{call.summary}</p>
      {flags.length > 0 && (
        <ul className="list-disc pl-4 text-xs">
          {flags.map((flag) => (
            <li key={flag}>{flag}</li>
          ))}
        </ul>
      )}
      {items.length > 0 && (
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Action items
          </p>
          <ul className="mt-1 list-disc pl-4">
            {items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="flex gap-2">
        {call.transcript && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                Transcript
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {whenDatetime(call.started_at ?? call.created_at)}
                </DialogTitle>
              </DialogHeader>
              <pre className="text-sm leading-relaxed whitespace-pre-wrap">
                {call.transcript}
              </pre>
            </DialogContent>
          </Dialog>
        )}
        {call.recording_url && (
          <Button size="sm" variant="ghost" asChild>
            <a href={call.recording_url} target="_blank" rel="noreferrer">
              Recording
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}
