# RapiLedge

The CRM that remembers your client's dog's birthday and their last three complaints before you pick up the phone.

RapiLedge is a contact-centric CRM (HubSpot-shaped, photographic-memory positioned) with real auth, Postgres, Gmail push, Recall.ai call notes, and Claude-written pre-call briefs. Nothing is logged just to be logged — it is logged so it resurfaces at the right moment.

The live UI is **Daylight Brief**: warm paper, ink, terracotta, serif headlines. Five generated directions live at `/design`.

## Stack

- Next.js App Router on Vercel
- Supabase Auth + Postgres with Row Level Security
- Gmail API (send) + Gmail watch → Google Pub/Sub (receive)
- Recall.ai meeting bots
- Claude via the Vercel AI SDK / AI Gateway (`anthropic/claude-sonnet-4.6`)

## Setup

### 1. Supabase

1. Create a project.
2. Run `supabase/migrations/0001_init.sql` in the SQL editor.
3. Auth → URL configuration: add `https://YOUR_DOMAIN/auth/callback` and `http://localhost:3000/auth/callback`.
4. Copy the project URL and **publishable** (or legacy anon) key.

### 2. Environment

Copy `.env.example` to `.env.local` (and into Vercel → Environment Variables):

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser/server publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Webhooks + watch renewal (never expose) |
| `NEXT_PUBLIC_APP_URL` | Canonical app URL |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Gmail OAuth |
| `GMAIL_PUBSUB_TOPIC` | `projects/…/topics/rapiledge-gmail` |
| `RECALL_API_KEY` | Recall.ai |
| `RECALL_WEBHOOK_SECRET` | Optional webhook guard |
| `CRON_SECRET` | Protects `/api/cron/gmail-watch` |
| `AI_GATEWAY_API_KEY` | Local AI Gateway (Vercel OIDC is enough in prod) |

### 3. Gmail receive (the sharp edge)

1. Enable the Gmail API and Pub/Sub in Google Cloud.
2. Create a topic, grant `gmail-api-push@system.gserviceaccount.com` publisher.
3. Push-subscribe that topic to `https://YOUR_DOMAIN/api/webhooks/gmail`.
4. OAuth consent: `gmail.send` + `gmail.readonly` (and `gmail.modify` for watch).
5. Domain verification as required by Google.
6. After a user connects Gmail in **Settings**, RapiLedge registers a `users.watch`. Watches die after 7 days; Vercel Cron hits `/api/cron/gmail-watch` daily and renews anything within 48 hours of expiry.

### 4. Recall.ai

1. Create an API key.
2. Point Recall webhooks at `https://YOUR_DOMAIN/api/webhooks/recall`.
3. Connect calendar from Settings. At meeting time, `POST /api/recall/bot` with a meeting URL (or id) to send the bot in. On completion, Claude writes summary + action items + flags onto the matched contact, including an AI note in the timeline.

### 5. Run

```bash
npm install
npm run dev
```

Sign up, then **Load sample ledger** on the dashboard to see Elena Voss, Nico the whippet, and three live complaints — then open her record and hit **Brief me**.

## Routes that matter

- `/contacts/[id]` — the product: header, timeline, pipeline, notes (manual vs AI), tasks, Brief me
- `/pipeline` — kanban, drag to update stage
- `/api/webhooks/gmail` — Pub/Sub push
- `/api/cron/gmail-watch` — 7-day watch renewal
- `/api/webhooks/recall` — transcript → Claude → `calls` + timeline
