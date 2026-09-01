"use server";

import { createClient } from "@/lib/supabase/server";
import { contactDisplayName } from "@/lib/types";

export async function generateBrief(contactId: string): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const [contactRes, notesRes, tasksRes, activitiesRes, callsRes, dealsRes] =
    await Promise.all([
      supabase
        .from("contacts")
        .select("*, company:companies(*)")
        .eq("id", contactId)
        .single(),
      supabase
        .from("notes")
        .select("*")
        .eq("contact_id", contactId)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("tasks")
        .select("*")
        .eq("contact_id", contactId)
        .eq("completed", false)
        .order("due_date", { ascending: true }),
      supabase
        .from("activities")
        .select("*")
        .eq("contact_id", contactId)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("calls")
        .select("*")
        .eq("contact_id", contactId)
        .order("created_at", { ascending: false })
        .limit(1),
      supabase
        .from("deals")
        .select("*")
        .eq("contact_id", contactId)
        .not("stage", "in", '("closed_won","closed_lost")'),
    ]);

  const contact = contactRes.data;
  if (!contact) throw new Error("Contact not found");

  const name = contactDisplayName(contact);
  const company = contact.company?.name ?? "Unknown company";
  const openTasks = tasksRes.data ?? [];
  const recentNotes = notesRes.data ?? [];
  const lastCall = callsRes.data?.[0];
  const activeDeals = dealsRes.data ?? [];
  const recentActivity = activitiesRes.data ?? [];

  // If Claude API key is set, use it for richer digests
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    const context = JSON.stringify({
      contact: { name, company, title: contact.title, tags: contact.tags },
      openTasks,
      recentNotes: recentNotes.map((n) => ({ body: n.body, source: n.source })),
      lastCall: lastCall
        ? { summary: lastCall.summary, started_at: lastCall.started_at }
        : null,
      activeDeals,
      recentActivity: recentActivity.map((a) => ({
        type: a.type,
        payload: a.payload,
        created_at: a.created_at,
      })),
    });

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: `You are a CRM briefing assistant for RapiLedge. Generate a concise pre-call digest for a sales rep about to call ${name} at ${company}. Use warm, confident tone. Structure with: Last Interaction, Open Items, Key Context, Suggested Talking Points. Be specific — reference actual data. Keep under 300 words.\n\nContext:\n${context}`,
          },
        ],
      }),
    });

    if (response.ok) {
      const result = await response.json();
      const text = result.content?.[0]?.text;
      if (text) return text;
    }
  }

  // Fallback: template-based digest
  const lines: string[] = [];
  lines.push(`## Brief for ${name}`);
  lines.push(`**${company}**${contact.title ? ` · ${contact.title}` : ""}`);
  lines.push("");

  if (lastCall?.summary) {
    lines.push("### Last Call");
    lines.push(lastCall.summary);
    lines.push("");
  } else if (recentActivity.length > 0) {
    const last = recentActivity[0];
    lines.push("### Last Interaction");
    lines.push(
      `${last.type.replace("_", " ")} — ${new Date(last.created_at).toLocaleDateString()}`
    );
    if (last.payload && typeof last.payload === "object") {
      const p = last.payload as Record<string, string>;
      if (p.body) lines.push(`> ${p.body.slice(0, 150)}...`);
      if (p.title) lines.push(`> ${p.title}`);
    }
    lines.push("");
  }

  if (openTasks.length > 0) {
    lines.push("### Open Items");
    openTasks.forEach((t) => {
      const due = t.due_date
        ? ` (due ${new Date(t.due_date).toLocaleDateString()})`
        : "";
      lines.push(`- ${t.title}${due}`);
    });
    lines.push("");
  }

  if (activeDeals.length > 0) {
    lines.push("### Active Deals");
    activeDeals.forEach((d) => {
      lines.push(`- **${d.title}** — ${d.stage.replace("_", " ")} · $${d.value.toLocaleString()}`);
    });
    lines.push("");
  }

  if (recentNotes.length > 0) {
    lines.push("### Recent Notes");
    recentNotes.slice(0, 3).forEach((n) => {
      const tag = n.source === "manual" ? "" : ` [${n.source.replace("ai_", "AI ")}]`;
      lines.push(`- ${n.body.slice(0, 120)}${n.body.length > 120 ? "..." : ""}${tag}`);
    });
    lines.push("");
  }

  if (contact.tags?.length > 0) {
    lines.push("### Tags");
    lines.push(contact.tags.map((t: string) => `\`${t}\``).join(" · "));
  }

  return lines.join("\n");
}
