export type DealStage =
  | "lead"
  | "qualified"
  | "proposal"
  | "negotiation"
  | "won"
  | "lost";

export type NoteSource = "manual" | "ai_call" | "ai_email";

export type ActivityType =
  | "email"
  | "call"
  | "note"
  | "task"
  | "deal_stage_change";

export type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
};

export type Company = {
  id: string;
  owner_id: string;
  name: string;
  domain: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Contact = {
  id: string;
  owner_id: string;
  company_id: string | null;
  first_name: string;
  last_name: string;
  email: string | null;
  emails: string[];
  phone: string | null;
  photo_url: string | null;
  job_title: string | null;
  tags: string[];
  custom_fields: Record<string, string>;
  last_contact_at: string | null;
  created_at: string;
  updated_at: string;
  company?: Company | null;
};

export type Deal = {
  id: string;
  owner_id: string;
  contact_id: string | null;
  company_id: string | null;
  title: string;
  stage: DealStage;
  value: number;
  currency: string;
  expected_close_date: string | null;
  created_at: string;
  updated_at: string;
  contact?: Contact | null;
  company?: Company | null;
};

export type Task = {
  id: string;
  owner_id: string;
  contact_id: string | null;
  title: string;
  due_date: string | null;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  contact?: Contact | null;
};

export type Note = {
  id: string;
  owner_id: string;
  contact_id: string;
  body: string;
  source: NoteSource;
  created_at: string;
};

export type Activity = {
  id: string;
  owner_id: string;
  contact_id: string | null;
  type: ActivityType;
  payload: Record<string, unknown>;
  created_at: string;
};

export type Call = {
  id: string;
  owner_id: string;
  contact_id: string | null;
  recall_bot_id: string | null;
  meeting_url: string | null;
  transcript: string | null;
  summary: string | null;
  action_items: string[];
  flags: string[];
  sentiment: string | null;
  recording_url: string | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
};

export type EmailMessage = {
  id: string;
  owner_id: string;
  thread_id: string | null;
  contact_id: string | null;
  gmail_message_id: string;
  direction: "sent" | "received";
  from_email: string | null;
  to_email: string | null;
  subject: string | null;
  body: string | null;
  snippet: string | null;
  created_at: string;
};

export type Meeting = {
  id: string;
  owner_id: string;
  contact_id: string | null;
  title: string | null;
  starts_at: string;
  ends_at: string | null;
  meeting_url: string | null;
  recall_bot_id: string | null;
  calendar_event_id: string | null;
  status: string;
  created_at: string;
  contact?: Contact | null;
};

export type Integration = {
  id: string;
  owner_id: string;
  provider: string;
  expires_at: string | null;
  extra: Record<string, unknown>;
  created_at: string;
};

export type GmailWatch = {
  id: string;
  owner_id: string;
  history_id: string | null;
  expiration: string | null;
  topic_name: string | null;
};

export type BriefMe = {
  headline: string;
  lastInteraction: string;
  openItems: string[];
  remember: string[];
  tone: string;
};
