-- RapiLedge v1 schema
-- Run in the Supabase SQL editor (or via supabase db push) as a superuser.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  domain text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  first_name text not null,
  last_name text not null,
  email text,
  emails text[] not null default '{}',
  phone text,
  photo_url text,
  job_title text,
  tags text[] not null default '{}',
  custom_fields jsonb not null default '{}'::jsonb,
  last_contact_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$ begin
  create type public.deal_stage as enum (
    'lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost'
  );
exception when duplicate_object then null;
end $$;

create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  company_id uuid references public.companies(id) on delete set null,
  title text not null,
  stage public.deal_stage not null default 'lead',
  value numeric(12,2) not null default 0,
  currency text not null default 'USD',
  expected_close_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  title text not null,
  due_date timestamptz,
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

do $$ begin
  create type public.note_source as enum ('manual', 'ai_call', 'ai_email');
exception when duplicate_object then null;
end $$;

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  body text not null,
  source public.note_source not null default 'manual',
  created_at timestamptz not null default now()
);

do $$ begin
  create type public.activity_type as enum (
    'email', 'call', 'note', 'task', 'deal_stage_change'
  );
exception when duplicate_object then null;
end $$;

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete cascade,
  type public.activity_type not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.calls (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  recall_bot_id text,
  meeting_url text,
  transcript text,
  summary text,
  action_items jsonb not null default '[]'::jsonb,
  flags jsonb not null default '[]'::jsonb,
  sentiment text,
  recording_url text,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.email_threads (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  gmail_thread_id text not null,
  subject text,
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  unique (owner_id, gmail_thread_id)
);

create table if not exists public.email_messages (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  thread_id uuid references public.email_threads(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  gmail_message_id text not null,
  direction text not null check (direction in ('sent', 'received')),
  from_email text,
  to_email text,
  subject text,
  body text,
  snippet text,
  created_at timestamptz not null default now(),
  unique (owner_id, gmail_message_id)
);

create table if not exists public.integrations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  extra jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (owner_id, provider)
);

create table if not exists public.gmail_watches (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade unique,
  history_id text,
  expiration timestamptz,
  topic_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.meetings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  title text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  meeting_url text,
  recall_bot_id text,
  calendar_event_id text,
  status text not null default 'scheduled',
  created_at timestamptz not null default now()
);

drop trigger if exists companies_updated_at on public.companies;
create trigger companies_updated_at before update on public.companies
for each row execute function public.set_updated_at();

drop trigger if exists contacts_updated_at on public.contacts;
create trigger contacts_updated_at before update on public.contacts
for each row execute function public.set_updated_at();

drop trigger if exists deals_updated_at on public.deals;
create trigger deals_updated_at before update on public.deals
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.log_activity(
  p_owner uuid,
  p_contact uuid,
  p_type public.activity_type,
  p_payload jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  activity_id uuid;
begin
  insert into public.activities (owner_id, contact_id, type, payload)
  values (p_owner, p_contact, p_type, coalesce(p_payload, '{}'::jsonb))
  returning id into activity_id;

  if p_contact is not null then
    update public.contacts
    set last_contact_at = now()
    where id = p_contact;
  end if;

  return activity_id;
end;
$$;

create or replace function public.match_contact_by_email(p_owner uuid, p_email text)
returns uuid
language sql
stable
as $$
  select id
  from public.contacts
  where owner_id = p_owner
    and p_email is not null
    and (
      lower(email) = lower(p_email)
      or exists (
        select 1 from unnest(emails) as e where lower(e) = lower(p_email)
      )
    )
  limit 1;
$$;

create index if not exists contacts_owner_idx on public.contacts (owner_id);
create index if not exists contacts_email_idx on public.contacts (owner_id, lower(email));
create index if not exists contacts_company_idx on public.contacts (company_id);
create index if not exists companies_owner_idx on public.companies (owner_id);
create index if not exists deals_owner_stage_idx on public.deals (owner_id, stage);
create index if not exists deals_contact_idx on public.deals (contact_id);
create index if not exists tasks_owner_due_idx on public.tasks (owner_id, due_date);
create index if not exists notes_contact_idx on public.notes (contact_id, created_at desc);
create index if not exists activities_contact_idx on public.activities (contact_id, created_at desc);
create index if not exists activities_owner_idx on public.activities (owner_id, created_at desc);
create index if not exists calls_contact_idx on public.calls (contact_id, created_at desc);
create index if not exists meetings_owner_starts_idx on public.meetings (owner_id, starts_at);
create index if not exists gmail_watches_expiration_idx on public.gmail_watches (expiration);

alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.contacts enable row level security;
alter table public.deals enable row level security;
alter table public.tasks enable row level security;
alter table public.notes enable row level security;
alter table public.activities enable row level security;
alter table public.calls enable row level security;
alter table public.email_threads enable row level security;
alter table public.email_messages enable row level security;
alter table public.integrations enable row level security;
alter table public.gmail_watches enable row level security;
alter table public.meetings enable row level security;

-- Profiles
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (id = auth.uid());
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert with check (id = auth.uid());

-- Owner-scoped tables
do $$
declare
  t text;
begin
  foreach t in array array[
    'companies','contacts','deals','tasks','notes','activities','calls',
    'email_threads','email_messages','integrations','gmail_watches','meetings'
  ]
  loop
    execute format('drop policy if exists %I on public.%I', t || '_select_own', t);
    execute format(
      'create policy %I on public.%I for select using (owner_id = auth.uid())',
      t || '_select_own', t
    );
    execute format('drop policy if exists %I on public.%I', t || '_insert_own', t);
    execute format(
      'create policy %I on public.%I for insert with check (owner_id = auth.uid())',
      t || '_insert_own', t
    );
    execute format('drop policy if exists %I on public.%I', t || '_update_own', t);
    execute format(
      'create policy %I on public.%I for update using (owner_id = auth.uid()) with check (owner_id = auth.uid())',
      t || '_update_own', t
    );
    execute format('drop policy if exists %I on public.%I', t || '_delete_own', t);
    execute format(
      'create policy %I on public.%I for delete using (owner_id = auth.uid())',
      t || '_delete_own', t
    );
  end loop;
end $$;

revoke all on function public.handle_new_user() from public;
revoke all on function public.log_activity(uuid, uuid, public.activity_type, jsonb) from public;
grant execute on function public.log_activity(uuid, uuid, public.activity_type, jsonb) to authenticated, service_role;
grant execute on function public.match_contact_by_email(uuid, text) to authenticated, service_role;
