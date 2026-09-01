"use client";

import { useState, useTransition } from "react";
import { briefContact } from "@/app/actions/brief";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BriefMe } from "@/lib/types";

export function BriefMePanel({ contactId }: { contactId: string }) {
  const [brief, setBrief] = useState<BriefMe | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <Card className="border-primary/20 bg-[color-mix(in_oklch,var(--card),var(--primary)_4%)]">
      <CardHeader>
        <CardTitle className="font-heading text-xl">Brief me</CardTitle>
        <p className="text-sm text-muted-foreground">
          Walk in knowing everything.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          disabled={pending}
          onClick={() =>
            start(async () => {
              setError(null);
              try {
                setBrief(await briefContact(contactId));
              } catch (e) {
                setError(e instanceof Error ? e.message : "Brief failed");
              }
            })
          }
        >
          {pending ? "Reading the ledger…" : "Brief me for this call"}
        </Button>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {brief && (
          <div className="space-y-4 text-sm">
            <p className="font-heading text-lg leading-snug">{brief.headline}</p>
            <div>
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Last interaction
              </p>
              <p className="mt-1 leading-relaxed">{brief.lastInteraction}</p>
            </div>
            {brief.openItems.length > 0 && (
              <div>
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Open items
                </p>
                <ul className="mt-1 list-disc space-y-1 pl-4">
                  {brief.openItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            {brief.remember.length > 0 && (
              <div>
                <p className="text-xs font-medium tracking-wide text-primary uppercase">
                  Remember
                </p>
                <ul className="mt-1 list-disc space-y-1 pl-4">
                  {brief.remember.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            <p className="text-muted-foreground italic">{brief.tone}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
