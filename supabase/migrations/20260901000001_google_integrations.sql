-- Google OAuth tokens for Gmail integration (server-side only via RLS)

create table if not exists public.google_integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  google_email text not null,
  access_token text not null,
  refresh_token text,
  token_expires_at timestamptz,
  scopes text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.google_integrations enable row level security;

create policy "Users manage own google integration"
  on public.google_integrations for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger google_integrations_updated_at
  before update on public.google_integrations
  for each row execute function public.set_updated_at();
