"use client";

import { useState, useTransition } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateBrief } from "@/lib/actions/brief";

interface BriefMePanelProps {
  contactId: string;
}

export function BriefMePanel({ contactId }: BriefMePanelProps) {
  const [brief, setBrief] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleGenerate() {
    startTransition(async () => {
      try {
        const result = await generateBrief(contactId);
        setBrief(result);
      } catch {
        setBrief("Unable to generate brief. Please try again.");
      }
    });
  }

  return (
    <div className="brief-me-panel rounded-xl p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-terracotta" />
          <h3 className="font-semibold text-warm-foreground">Brief Me</h3>
        </div>
        <Button
          size="sm"
          onClick={handleGenerate}
          disabled={isPending}
          className="bg-terracotta text-white hover:bg-terracotta/90"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
              Generating...
            </>
          ) : (
            "Generate Brief"
          )}
        </Button>
      </div>
      <p className="mt-1 text-xs text-warm-foreground/70">
        Your photographic memory, on demand
      </p>

      {brief ? (
        <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-warm-foreground/90">
          {brief.split("\n").map((line, i) => {
            if (line.startsWith("## ")) {
              return (
                <h4 key={i} className="mt-3 first:mt-0 text-base font-semibold">
                  {line.replace("## ", "")}
                </h4>
              );
            }
            if (line.startsWith("### ")) {
              return (
                <h5 key={i} className="mt-2 font-medium text-terracotta">
                  {line.replace("### ", "")}
                </h5>
              );
            }
            if (line.startsWith("**") && line.endsWith("**")) {
              return (
                <p key={i} className="font-medium">
                  {line.replace(/\*\*/g, "")}
                </p>
              );
            }
            if (line.startsWith("- ")) {
              return (
                <p key={i} className="ml-2">
                  {line}
                </p>
              );
            }
            if (line.startsWith("> ")) {
              return (
                <blockquote
                  key={i}
                  className="border-l-2 border-terracotta/40 pl-3 italic text-warm-foreground/80"
                >
                  {line.replace("> ", "")}
                </blockquote>
              );
            }
            return line ? <p key={i}>{line}</p> : <br key={i} />;
          })}
        </div>
      ) : (
        <p className="mt-4 text-sm text-warm-foreground/60">
          Hit generate before your next call. We&apos;ll pull together their last
          interaction, open tasks, and anything worth remembering.
        </p>
      )}
    </div>
  );
}
