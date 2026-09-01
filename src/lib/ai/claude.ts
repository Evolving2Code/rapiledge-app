import { generateText, Output } from "ai";
import { z } from "zod";
import type { BriefMe } from "@/lib/types";

const CLAUDE = "anthropic/claude-sonnet-4.6";

export function isAiConfigured() {
  return Boolean(
    process.env.AI_GATEWAY_API_KEY ||
      process.env.ANTHROPIC_API_KEY ||
      process.env.VERCEL_OIDC_TOKEN ||
      process.env.VERCEL,
  );
}

export async function summarizeCall(transcript: string, contactName: string) {
  const result = await generateText({
    model: CLAUDE,
    output: Output.object({
      schema: z.object({
        summary: z.string(),
        actionItems: z.array(z.string()),
        flags: z.array(z.string()),
        sentiment: z.enum(["positive", "neutral", "cautious", "strained"]),
        note: z.string(),
      }),
    }),
    prompt: `You are RapiLedge, a CRM that keeps hyper-detailed client context so a salesperson walks into the next call looking like they have a photographic memory.

Clean up and distill this call transcript with ${contactName}.

Return:
- summary: 4-7 sentences, specific, no fluff
- actionItems: concrete follow-ups with owners if mentioned
- flags: things worth remembering (complaints, personal details, preferences, risks, family/pets, politics-to-avoid, etc.)
- sentiment
- note: a CRM note in first-person past tense, 1-2 short paragraphs

Transcript:
${transcript.slice(0, 80000)}`,
  });

  return result.output;
}

export async function generateBrief(input: {
  contactName: string;
  companyName?: string | null;
  customFields: Record<string, string>;
  lastCallSummary?: string | null;
  recentNotes: string[];
  openTasks: string[];
  recentEmails: string[];
  dealStage?: string | null;
}): Promise<BriefMe> {
  const result = await generateText({
    model: CLAUDE,
    output: Output.object({
      schema: z.object({
        headline: z.string(),
        lastInteraction: z.string(),
        openItems: z.array(z.string()),
        remember: z.array(z.string()),
        tone: z.string(),
      }),
    }),
    prompt: `You are RapiLedge's "Brief me" writer. Produce a pre-call digest that makes the user look like they have a photographic memory.

Contact: ${input.contactName}
Company: ${input.companyName ?? "unknown"}
Deal stage: ${input.dealStage ?? "none"}
Custom fields (personal context): ${JSON.stringify(input.customFields)}
Last call summary: ${input.lastCallSummary ?? "none"}
Recent notes:
${input.recentNotes.join("\n") || "none"}
Open tasks:
${input.openTasks.join("\n") || "none"}
Recent email snippets:
${input.recentEmails.join("\n") || "none"}

Rules:
- headline: one sly, confident line (not cheesy)
- lastInteraction: 2-4 sentences of what happened last
- openItems: unfinished work they will be asked about
- remember: the personal/complaint/preference details that make this human — dog birthdays, last complaints, kids' names, the thing they were annoyed about
- tone: how to show up on this call
- Never invent facts. If a field is empty, skip it rather than guessing.`,
  });

  return result.output;
}

export async function cleanupNote(body: string) {
  const result = await generateText({
    model: CLAUDE,
    prompt: `Clean up this CRM note without adding facts. Keep the author's voice, fix grammar, keep it short.\n\n${body}`,
  });
  return result.text;
}
