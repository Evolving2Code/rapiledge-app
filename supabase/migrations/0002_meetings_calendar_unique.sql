-- Unique calendar events per owner so Recall sync can upsert.
create unique index if not exists meetings_owner_calendar_event_uidx
  on public.meetings (owner_id, calendar_event_id)
  where calendar_event_id is not null;

create index if not exists email_messages_contact_idx
  on public.email_messages (contact_id, created_at desc);
