# RapiLedge — UI Design Options

Before writing any application code, we generated five distinct visual directions for RapiLedge's **contact record page** — the "heart of the app" per the product spec (header, activity timeline, deal panel, notes panel, tasks panel, and the signature **"Brief me"** AI digest panel).

Each direction is a full mockup of the same layout so they can be compared apples-to-apples. Pick one (or mix elements from a couple) and we'll turn it into a real design system (Tailwind theme, shadcn/ui tokens, component library) before Phase 2 (Core CRM) begins.

All five keep the core positioning line somewhere visible, per the brand brief: *"Remembers your client's dog's birthday and their last three complaints before you pick up the phone."*

## Option 1 — Noir Ledger

`mockups/rapiledge-ui-option-1-noir-ledger.png`

Dark, exclusive, private-members'-club feel. Near-black background, warm brass/gold accent, serif headings mixed with clean sans body text. Leans into "confident" — this is the CRM equivalent of a leather-bound ledger.

- **Palette:** `#111114` background, `#C9A24B` gold accent
- **Vibe:** premium, exclusive, a little old-money
- **Best for:** positioning RapiLedge as a high-end tool for relationship-driven sales (agencies, consultants, wealth advisors)

## Option 2 — Paper Trail

`mockups/rapiledge-ui-option-2-paper-trail.png`

Warm, human, approachable — feels like a beautifully kept personal rolodex rather than cold enterprise software. Cream background, terracotta + forest green accents, rounded cards.

- **Palette:** `#FAF6EF` background, `#C9663A` terracotta, `#3A5A45` green
- **Vibe:** warm, personal, low-intimidation
- **Best for:** solo founders / small teams who want the CRM to feel like a personal assistant, not a data warehouse

## Option 3 — Command Deck

`mockups/rapiledge-ui-option-3-command-deck.png`

Professional, data-dense, HubSpot/Linear-inspired. Slate navy panels on a light page, electric cyan accent, monospace numerals. This is the safest, most "enterprise SaaS" option.

- **Palette:** `#1B2333` panels, `#F4F6F9` page, `#2FD8E0` accent
- **Vibe:** sharp, professional, data-forward
- **Best for:** sales teams who live in dashboards and want density over charm

## Option 4 — Minimal Mono

`mockups/rapiledge-ui-option-4-minimal-mono.png`

Ultra-minimal, Notion/Arc-inspired. Mostly white with a single bold violet accent, generous whitespace, calm typography. Lowest visual noise of the five — lets the AI-generated content (notes, digests) be the star.

- **Palette:** `#FFFFFF` / `#F7F7F8` background, `#7C3AED` accent
- **Vibe:** calm, airy, high-end minimal
- **Best for:** a "quiet luxury" positioning — understated confidence rather than loud branding

## Option 5 — Neon Sly

`mockups/rapiledge-ui-option-5-neon-sly.png`

Bold, high-contrast, most literal match for the brand tone ("confident, a little sly"). Near-black background with a signature neon lime accent, big rounded type, playful attitude.

- **Palette:** `#0B0C10` background, `#C6FF3D` neon accent
- **Vibe:** bold, memorable, a little cheeky
- **Best for:** standing out in a crowded CRM market with a distinctive, opinionated brand identity

## Layout constants across all five options

Regardless of which visual direction is chosen, the underlying contact-record layout stays the same (per spec):

1. **Header** — photo, name, company, last-contact date, deal stage, owner
2. **Activity timeline** — unified chronological feed (email / call / note / task / deal-stage-change)
3. **Deal/pipeline panel** — current stage, value, associated deals
4. **Notes panel** — manual vs. AI-generated notes, visually distinguished by source
5. **Tasks panel** — upcoming/overdue reminders
6. **"Brief me" panel** — on-demand AI pre-call digest, visually set apart from the rest of the page (border/glow/tint in every option) since it's the flagship feature

## Next steps

Once a direction (or hybrid) is chosen, Phase 1 (Foundation) work will:

- Translate the chosen palette/typography into a Tailwind + shadcn/ui theme
- Build the shared layout shell (nav, contact header, panel grid) as reusable components
- Wire it to real data once the Supabase schema (Phase 1) and Core CRM (Phase 2) land

See the main build plan in the project brief for the full phased roadmap (Foundation → Core CRM → Gmail send → Gmail receive/webhook → Recall.ai notetaker → Brief me digest + polish).
