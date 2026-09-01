-- RapiLedge initial schema
-- Run via Supabase CLI or SQL editor

-- Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Companies
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  domain text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.companies enable row level security;

create policy "Users manage own companies"
  on public.companies for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Contacts
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  first_name text not null,
  last_name text,
  email text,
  phone text,
  title text,
  avatar_url text,
  tags text[] not null default '{}',
  custom_fields jsonb not null default '{}',
  last_contact_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index contacts_user_id_idx on public.contacts(user_id);
create index contacts_email_idx on public.contacts(email);

alter table public.contacts enable row level security;

create policy "Users manage own contacts"
  on public.contacts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Deals
create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  title text not null,
  stage text not null default 'lead'
    check (stage in ('lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost')),
  value numeric(12, 2) not null default 0,
  expected_close_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index deals_user_id_idx on public.deals(user_id);
create index deals_stage_idx on public.deals(stage);

alter table public.deals enable row level security;

create policy "Users manage own deals"
  on public.deals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Tasks
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  title text not null,
  due_date date,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tasks_user_id_idx on public.tasks(user_id);
create index tasks_due_date_idx on public.tasks(due_date);

alter table public.tasks enable row level security;

create policy "Users manage own tasks"
  on public.tasks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Notes
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  body text not null,
  source text not null default 'manual'
    check (source in ('manual', 'ai_call', 'ai_email')),
  created_at timestamptz not null default now()
);

create index notes_contact_id_idx on public.notes(contact_id);

alter table public.notes enable row level security;

create policy "Users manage own notes"
  on public.notes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Activities (unified timeline)
create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete cascade,
  type text not null
    check (type in ('email', 'call', 'note', 'task', 'deal_stage_change')),
  payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index activities_contact_id_idx on public.activities(contact_id);
create index activities_created_at_idx on public.activities(created_at desc);

alter table public.activities enable row level security;

create policy "Users manage own activities"
  on public.activities for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Calls (Recall.ai)
create table if not exists public.calls (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  recall_bot_id text,
  transcript text,
  summary text,
  recording_url text,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.calls enable row level security;

create policy "Users manage own calls"
  on public.calls for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Email threads & messages (Gmail integration)
create table if not exists public.email_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  gmail_thread_id text not null,
  subject text,
  created_at timestamptz not null default now()
);

alter table public.email_threads enable row level security;

create policy "Users manage own email threads"
  on public.email_threads for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.email_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  thread_id uuid not null references public.email_threads(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  gmail_message_id text not null,
  direction text not null check (direction in ('sent', 'received')),
  body text,
  snippet text,
  created_at timestamptz not null default now()
);

alter table public.email_messages enable row level security;

create policy "Users manage own email messages"
  on public.email_messages for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Gmail watch renewal tracking
create table if not exists public.gmail_watches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  history_id text,
  expiration timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.gmail_watches enable row level security;

create policy "Users manage own gmail watches"
  on public.gmail_watches for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger companies_updated_at before update on public.companies
  for each row execute function public.set_updated_at();
create trigger contacts_updated_at before update on public.contacts
  for each row execute function public.set_updated_at();
create trigger deals_updated_at before update on public.deals
  for each row execute function public.set_updated_at();
create trigger tasks_updated_at before update on public.tasks
  for each row execute function public.set_updated_at();
create trigger gmail_watches_updated_at before update on public.gmail_watches
  for each row execute function public.set_updated_at();
