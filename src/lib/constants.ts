import type { DealStage } from "@/lib/types";

export const APP_NAME = "RapiLedge";

export const POSITIONING_LINE =
  "Remembers your client's dog's birthday and their last three complaints before you pick up the phone.";

export const DEAL_STAGES: { id: DealStage; label: string }[] = [
  { id: "lead", label: "Lead" },
  { id: "qualified", label: "Qualified" },
  { id: "proposal", label: "Proposal" },
  { id: "negotiation", label: "Negotiation" },
  { id: "won", label: "Won" },
  { id: "lost", label: "Lost" },
];

export const OPEN_DEAL_STAGES: DealStage[] = [
  "lead",
  "qualified",
  "proposal",
  "negotiation",
];

export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  );
}

export function supabasePublishableKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ""
  );
}
