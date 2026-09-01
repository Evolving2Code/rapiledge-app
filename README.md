# RapiLedge

**The CRM that remembers your client's dog's birthday and their last three complaints before you pick up the phone.**

RapiLedge is a contact-centric CRM built for hyper-detailed client context — every email, call, note, and deal change surfaces at exactly the right moment.

## Tech Stack

- **Next.js 16** (App Router)
- **Supabase** (Auth + Postgres + RLS)
- **Vercel** (hosting)
- **Tailwind CSS + shadcn/ui**
- **Gmail API** (send + Pub/Sub receive) — coming in Phase 3–4
- **Recall.ai** (AI call notetaker) — coming in Phase 5
- **Claude API** (Brief Me digests + summarization)

## Design

Dark Executive + Warm Human hybrid:
- Deep navy shell with gold accents
- Warm cream "Brief Me" panel with terracotta highlights
- Glass-morphism cards, sage green for AI-generated content

## Getting Started

### 1. Clone and install

```bash
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run the migration in `supabase/migrations/20260901000000_initial_schema.sql` via the SQL editor
3. Copy your project URL and anon key

### 3. Environment variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional — enables AI-powered Brief Me digests
ANTHROPIC_API_KEY=your_anthropic_key

# Phase 3+ (Gmail integration)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_PUBSUB_TOPIC=

# Phase 5 (Recall.ai)
RECALL_API_KEY=
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), sign up, and start adding contacts.

## Features (v1)

- [x] Auth (Supabase email/password)
- [x] Contacts CRUD with search
- [x] Companies (schema ready)
- [x] Deal pipeline (kanban, drag-and-drop)
- [x] Tasks with due dates and overdue surfacing
- [x] Notes (manual + AI source distinction)
- [x] Unified activity timeline per contact
- [x] **Brief Me** — on-demand pre-call AI digest
- [x] Dashboard with pipeline value, tasks, recent activity
- [ ] Gmail send + receive (webhook)
- [ ] Recall.ai call notetaker
- [ ] Calendar integration

## Deploy to Vercel

1. Push to GitHub
2. Import in Vercel
3. Add environment variables
4. Deploy

## License

MIT
