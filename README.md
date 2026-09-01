# RapiLedge

**The CRM that remembers your client's dog's birthday and their last three complaints before you pick up the phone.**

RapiLedge is a contact-centric CRM built for hyper-detailed client context — every email, call, note, and deal change surfaces at exactly the right moment.

## Tech Stack

- **Next.js 16** (App Router)
- **Supabase** (Auth + Postgres + RLS)
- **Vercel** (hosting)
- **Tailwind CSS + shadcn/ui**
- **Gmail API** (send + Pub/Sub receive) — send live; receive in Phase 4
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
2. Run migrations in order via the SQL editor:
   - `supabase/migrations/20260901000000_initial_schema.sql`
   - `supabase/migrations/20260901000001_google_integrations.sql`
3. (Optional) Run `supabase/seed.sql` after signup — replace `YOUR_USER_ID` with your `auth.users` id
4. Copy your project URL and anon key

### 3. Environment variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional — enables AI-powered Brief Me digests
ANTHROPIC_API_KEY=your_anthropic_key

# Gmail send (Phase 3)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Phase 5 (Recall.ai)
RECALL_API_KEY=
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), sign up, and start adding contacts.

### 5. Connect Gmail (optional)

1. Create a project in [Google Cloud Console](https://console.cloud.google.com)
2. Enable the **Gmail API**
3. Create OAuth 2.0 credentials (Web application)
4. Add authorized redirect URI: `http://localhost:3000/api/auth/google/callback` (and your production URL)
5. Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to `.env.local`
6. In RapiLedge, go to **Settings → Connect Gmail**
7. Send emails from any contact record — they're auto-logged to the timeline

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
- [x] Gmail send from contact record + timeline logging
- [ ] Gmail receive (Pub/Sub webhook)
- [ ] Recall.ai call notetaker
- [ ] Calendar integration

## Deploy to Vercel

1. Push to GitHub
2. Import in Vercel
3. Add environment variables
4. Deploy

## License

MIT
