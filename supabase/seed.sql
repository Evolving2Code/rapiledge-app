-- RapiLedge demo seed data
-- Replace YOUR_USER_ID below with your auth.users id, then run in Supabase SQL editor.
--
--   select id, email from auth.users;

-- ▼ Replace this UUID ▼
-- YOUR_USER_ID: paste your user id here and find-replace all occurrences

/*
insert into public.companies (user_id, name, domain) values
  ('YOUR_USER_ID', 'Acme Corp', 'acme.com'),
  ('YOUR_USER_ID', 'Northwind Labs', 'northwind.io'),
  ('YOUR_USER_ID', 'Brightpath Co', 'brightpath.co');

-- After running companies insert, use returned IDs or run:
with c as (
  select id, name from public.companies where user_id = 'YOUR_USER_ID'
)
insert into public.contacts (user_id, company_id, first_name, last_name, email, phone, title, tags, last_contact_at)
select 'YOUR_USER_ID', c.id, v.first_name, v.last_name, v.email, v.phone, v.title, v.tags, v.last_contact_at
from (values
  ('Acme Corp', 'Sarah', 'Chen', 'sarah.chen@acme.com', '+1 415-555-0101', 'VP Engineering', '{"enterprise","champion"}', now() - interval '2 days'),
  ('Northwind Labs', 'Marcus', 'Rivera', 'marcus@northwind.io', '+1 212-555-0202', 'CTO', '{"startup","technical"}', now() - interval '5 days'),
  ('Brightpath Co', 'Elena', 'Park', 'elena@brightpath.co', '+1 310-555-0303', 'Head of Ops', '{"mid-market"}', now() - interval '1 day')
) as v(company_name, first_name, last_name, email, phone, title, tags, last_contact_at)
join c on c.name = v.company_name;
*/

-- Quick seed script (uncomment and set user_id):
do $$
declare
  uid uuid := 'YOUR_USER_ID';  -- ← replace before running
  co_acme uuid;
  co_north uuid;
  co_bright uuid;
  ct_sarah uuid;
  ct_marcus uuid;
begin
  insert into public.companies (user_id, name, domain) values
    (uid, 'Acme Corp', 'acme.com'),
    (uid, 'Northwind Labs', 'northwind.io'),
    (uid, 'Brightpath Co', 'brightpath.co')
  returning id into co_acme;

  select id into co_acme from public.companies where user_id = uid and name = 'Acme Corp';
  select id into co_north from public.companies where user_id = uid and name = 'Northwind Labs';
  select id into co_bright from public.companies where user_id = uid and name = 'Brightpath Co';

  insert into public.contacts (user_id, company_id, first_name, last_name, email, phone, title, tags, last_contact_at) values
    (uid, co_acme, 'Sarah', 'Chen', 'sarah.chen@acme.com', '+1 415-555-0101', 'VP Engineering', '{"enterprise","champion"}', now() - interval '2 days')
  returning id into ct_sarah;

  insert into public.contacts (user_id, company_id, first_name, last_name, email, phone, title, tags, last_contact_at) values
    (uid, co_north, 'Marcus', 'Rivera', 'marcus@northwind.io', '+1 212-555-0202', 'CTO', '{"startup","technical"}', now() - interval '5 days'),
    (uid, co_bright, 'Elena', 'Park', 'elena@brightpath.co', '+1 310-555-0303', 'Head of Ops', '{"mid-market"}', now() - interval '1 day');

  select id into ct_sarah from public.contacts where user_id = uid and email = 'sarah.chen@acme.com';
  select id into ct_marcus from public.contacts where user_id = uid and email = 'marcus@northwind.io';

  insert into public.deals (user_id, contact_id, title, stage, value, expected_close_date) values
    (uid, ct_sarah, 'Acme Platform License', 'negotiation', 45000, (current_date + 30)),
    (uid, ct_marcus, 'Northwind Pilot', 'proposal', 12000, (current_date + 45));

  insert into public.tasks (user_id, contact_id, title, due_date, completed) values
    (uid, ct_sarah, 'Send revised pricing deck', current_date - 1, false),
    (uid, ct_sarah, 'Schedule security review call', current_date, false);

  insert into public.notes (user_id, contact_id, body, source) values
    (uid, ct_sarah, 'Sarah mentioned their dog Max turns 3 next month — send a card. Also frustrated about slow onboarding in Q3.', 'manual'),
    (uid, ct_sarah, 'Call summary: Discussed enterprise tier. Action items: send SOC2 report. Sentiment: positive but price-sensitive.', 'ai_call');

  insert into public.activities (user_id, contact_id, type, payload, created_at) values
    (uid, ct_sarah, 'email', '{"subject":"Re: Enterprise pricing","snippet":"Thanks for the updated proposal...","direction":"received"}', now() - interval '2 days'),
    (uid, ct_sarah, 'call', '{"summary":"Discussed enterprise tier and security requirements"}', now() - interval '4 days'),
    (uid, ct_sarah, 'deal_stage_change', '{"title":"Acme Platform License","stage":"negotiation"}', now() - interval '3 days');
end $$;
