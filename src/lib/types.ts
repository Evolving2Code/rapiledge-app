export type DealStage =
  | "lead"
  | "qualified"
  | "proposal"
  | "negotiation"
  | "closed_won"
  | "closed_lost";

export type NoteSource = "manual" | "ai_call" | "ai_email";

export type ActivityType =
  | "email"
  | "call"
  | "note"
  | "task"
  | "deal_stage_change";

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Company {
  id: string;
  user_id: string;
  name: string;
  domain: string | null;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  user_id: string;
  company_id: string | null;
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  title: string | null;
  avatar_url: string | null;
  tags: string[];
  custom_fields: Record<string, unknown>;
  last_contact_at: string | null;
  created_at: string;
  updated_at: string;
  company?: Company | null;
}

export interface Deal {
  id: string;
  user_id: string;
  contact_id: string | null;
  title: string;
  stage: DealStage;
  value: number;
  expected_close_date: string | null;
  created_at: string;
  updated_at: string;
  contact?: Contact | null;
}

export interface Task {
  id: string;
  user_id: string;
  contact_id: string | null;
  title: string;
  due_date: string | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
  contact?: Contact | null;
}

export interface Note {
  id: string;
  user_id: string;
  contact_id: string;
  body: string;
  source: NoteSource;
  created_at: string;
}

export interface Activity {
  id: string;
  user_id: string;
  contact_id: string | null;
  type: ActivityType;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface Call {
  id: string;
  user_id: string;
  contact_id: string | null;
  recall_bot_id: string | null;
  transcript: string | null;
  summary: string | null;
  recording_url: string | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
}

export const DEAL_STAGES: { id: DealStage; label: string; color: string }[] = [
  { id: "lead", label: "Lead", color: "bg-muted text-muted-foreground" },
  { id: "qualified", label: "Qualified", color: "bg-sage/20 text-sage" },
  { id: "proposal", label: "Proposal", color: "bg-primary/20 text-primary" },
  { id: "negotiation", label: "Negotiation", color: "bg-terracotta/20 text-terracotta" },
  { id: "closed_won", label: "Closed Won", color: "bg-sage/30 text-sage" },
  { id: "closed_lost", label: "Closed Lost", color: "bg-destructive/20 text-destructive" },
];

export function contactDisplayName(contact: Pick<Contact, "first_name" | "last_name">) {
  return [contact.first_name, contact.last_name].filter(Boolean).join(" ");
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}
