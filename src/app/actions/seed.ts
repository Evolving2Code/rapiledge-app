"use server";

import { revalidatePath } from "next/cache";
import { addDays, subDays } from "date-fns";
import { requireUser } from "@/lib/supabase/server";

export async function seedDemoLedger() {
  const { supabase, userId } = await requireUser();

  const { count } = await supabase
    .from("contacts")
    .select("*", { count: "exact", head: true });
  if ((count ?? 0) > 0) {
    return { ok: true, skipped: true };
  }

  const companies = [
    { name: "Meridian Labs", domain: "meridianlabs.com", notes: "Series B biotech. Legal is slow." },
    { name: "Northwind", domain: "northwind.co", notes: "Family-owned logistics. Decision by committee." },
    { name: "Helix Capital", domain: "helixcap.com", notes: "Growth equity. Hates being sold to." },
    { name: "Harbor & Co", domain: "harborand.co", notes: "Design-led CPG. Brand is religion." },
  ];

  const { data: insertedCompanies, error: companyError } = await supabase
    .from("companies")
    .insert(companies.map((c) => ({ ...c, owner_id: userId })))
    .select("*");
  if (companyError) throw new Error(companyError.message);

  const byName = Object.fromEntries(
    (insertedCompanies ?? []).map((c) => [c.name, c.id]),
  );

  const contactRows = [
    {
      first_name: "Elena",
      last_name: "Voss",
      email: "elena.voss@meridianlabs.com",
      phone: "+1-415-555-0142",
      job_title: "VP Partnerships",
      company_id: byName["Meridian Labs"],
      tags: ["champion", "board-facing"],
      custom_fields: {
        dog_name: "Nico",
        dog_birthday: "April 3",
        coffee: "oat cortado, extra shot",
        avoid: "Do not mention the Q1 outage unprompted",
      },
      last_contact_at: subDays(new Date(), 2).toISOString(),
    },
    {
      first_name: "Marcus",
      last_name: "Chen",
      email: "marcus@northwind.co",
      phone: "+1-312-555-0199",
      job_title: "COO",
      company_id: byName["Northwind"],
      tags: ["economic-buyer"],
      custom_fields: {
        dog_name: "Mochi",
        dog_birthday: "November 12",
        kids: "Twins, age 8",
      },
      last_contact_at: subDays(new Date(), 6).toISOString(),
    },
    {
      first_name: "Priya",
      last_name: "Shah",
      email: "priya.shah@helixcap.com",
      phone: "+1-212-555-0177",
      job_title: "Principal",
      company_id: byName["Helix Capital"],
      tags: ["skeptic", "high-value"],
      custom_fields: {
        remember: "Hates decks longer than 8 slides",
        timezone: "ET, early mornings only",
      },
      last_contact_at: subDays(new Date(), 1).toISOString(),
    },
    {
      first_name: "Amelia",
      last_name: "Hart",
      email: "amelia@harborand.co",
      phone: "+1-206-555-0104",
      job_title: "Founder",
      company_id: byName["Harbor & Co"],
      tags: ["founder"],
      custom_fields: {
        dog_name: "Juniper",
        dog_birthday: "June 21",
      },
      last_contact_at: subDays(new Date(), 9).toISOString(),
    },
    {
      first_name: "Jonah",
      last_name: "Hale",
      email: "jonah.hale@meridianlabs.com",
      phone: "+1-415-555-0188",
      job_title: "Head of Legal",
      company_id: byName["Meridian Labs"],
      tags: ["blocker"],
      custom_fields: {
        remember: "Wants DPA in their paper, not ours",
      },
      last_contact_at: subDays(new Date(), 4).toISOString(),
    },
  ].map((c) => ({ ...c, owner_id: userId, emails: [c.email] }));

  const { data: contacts, error: contactError } = await supabase
    .from("contacts")
    .insert(contactRows)
    .select("*");
  if (contactError) throw new Error(contactError.message);

  const find = (first: string) => contacts?.find((c) => c.first_name === first);

  const elena = find("Elena")!;
  const marcus = find("Marcus")!;
  const priya = find("Priya")!;
  const amelia = find("Amelia")!;
  const jonah = find("Jonah")!;

  await supabase.from("deals").insert([
    {
      owner_id: userId,
      contact_id: elena.id,
      company_id: elena.company_id,
      title: "Meridian Labs · Platform",
      stage: "negotiation",
      value: 84000,
      expected_close_date: addDays(new Date(), 18).toISOString().slice(0, 10),
    },
    {
      owner_id: userId,
      contact_id: marcus.id,
      company_id: marcus.company_id,
      title: "Northwind fleet ops",
      stage: "proposal",
      value: 46000,
      expected_close_date: addDays(new Date(), 32).toISOString().slice(0, 10),
    },
    {
      owner_id: userId,
      contact_id: priya.id,
      company_id: priya.company_id,
      title: "Helix portfolio rollout",
      stage: "qualified",
      value: 210000,
      expected_close_date: addDays(new Date(), 55).toISOString().slice(0, 10),
    },
    {
      owner_id: userId,
      contact_id: amelia.id,
      company_id: amelia.company_id,
      title: "Harbor brand studio",
      stage: "lead",
      value: 18000,
      expected_close_date: addDays(new Date(), 40).toISOString().slice(0, 10),
    },
    {
      owner_id: userId,
      contact_id: jonah.id,
      company_id: jonah.company_id,
      title: "Meridian legal addendum",
      stage: "negotiation",
      value: 12000,
      expected_close_date: addDays(new Date(), 12).toISOString().slice(0, 10),
    },
  ]);

  await supabase.from("notes").insert([
    {
      owner_id: userId,
      contact_id: elena.id,
      source: "manual",
      body: "Nico (whippet) turns 4 on April 3. Elena still mentions the March invoice discrepancy as complaint #1.",
      created_at: subDays(new Date(), 20).toISOString(),
    },
    {
      owner_id: userId,
      contact_id: elena.id,
      source: "ai_email",
      body: "Complaint #2: implementation Slack went quiet over a weekend. She wants a named human, not a bot.",
      created_at: subDays(new Date(), 11).toISOString(),
    },
    {
      owner_id: userId,
      contact_id: elena.id,
      source: "ai_call",
      body: "Complaint #3: legal redlines bounced twice. Jonah is the real bottleneck; Elena is still the champion. She asked us to remember that her board meeting is the 19th.",
      created_at: subDays(new Date(), 2).toISOString(),
    },
    {
      owner_id: userId,
      contact_id: marcus.id,
      source: "manual",
      body: "Walked the warehouse. Mochi the corgi is a celebrity there. Marcus wants weekend coverage in writing.",
      created_at: subDays(new Date(), 6).toISOString(),
    },
    {
      owner_id: userId,
      contact_id: priya.id,
      source: "ai_call",
      body: "Priya called the last deck 'a TED Talk with a price tag.' She will take a two-page memo. No logos in the header.",
      created_at: subDays(new Date(), 1).toISOString(),
    },
  ]);

  await supabase.from("tasks").insert([
    {
      owner_id: userId,
      contact_id: elena.id,
      title: "Send board-ready one-pager before the 19th",
      due_date: addDays(new Date(), 1).toISOString(),
    },
    {
      owner_id: userId,
      contact_id: elena.id,
      title: "Nico's birthday note (April 3) — handwritten, not a mail-merge",
      due_date: addDays(new Date(), 14).toISOString(),
    },
    {
      owner_id: userId,
      contact_id: jonah.id,
      title: "Return DPA in their paper",
      due_date: subDays(new Date(), 1).toISOString(),
    },
    {
      owner_id: userId,
      contact_id: priya.id,
      title: "Two-page memo, no deck",
      due_date: addDays(new Date(), 0).toISOString(),
    },
    {
      owner_id: userId,
      title: "Renew Gmail watch if the cron is quiet",
      due_date: addDays(new Date(), 3).toISOString(),
    },
  ]);

  await supabase.from("calls").insert({
    owner_id: userId,
    contact_id: elena.id,
    summary:
      "Elena walked through remaining legal friction and confirmed she still wants to close before the board meeting. Three live complaints: the March invoice, weekend Slack silence, and bouncing redlines. She asked that we remember Nico's birthday in April — unprompted, which means it matters.",
    action_items: [
      "Send board one-pager",
      "Push Jonah a DPA in their paper",
      "Assign a named Slack human for implementation",
    ],
    flags: [
      "Nico the whippet, birthday April 3",
      "Board meeting on the 19th",
      "Do not re-litigate the Q1 outage",
    ],
    sentiment: "cautious",
    started_at: subDays(new Date(), 2).toISOString(),
    ended_at: subDays(new Date(), 2).toISOString(),
    transcript:
      "[Demo transcript] Elena: The invoice from March is still sitting in finance. Also — and I know this is small — Nico turns four in April and I will notice if you remember. Jonah is going to hate your DPA.",
  });

  await supabase.from("meetings").insert({
    owner_id: userId,
    contact_id: elena.id,
    title: "Elena · pre-board check-in",
    starts_at: addDays(new Date(), 1).toISOString(),
    meeting_url: "https://meet.google.com/demo-elena",
    status: "scheduled",
  });

  const activitySeeds = [
    {
      contact_id: elena.id,
      type: "call" as const,
      payload: { summary: "Pre-board check-in. Three complaints still live." },
      created_at: subDays(new Date(), 2).toISOString(),
    },
    {
      contact_id: elena.id,
      type: "email" as const,
      payload: { direction: "received", subject: "Re: redlines", snippet: "Jonah bounced v2. Can you use our paper?" },
      created_at: subDays(new Date(), 3).toISOString(),
    },
    {
      contact_id: priya.id,
      type: "note" as const,
      payload: { preview: "Two-page memo, no TED Talk.", source: "ai_call" },
      created_at: subDays(new Date(), 1).toISOString(),
    },
    {
      contact_id: marcus.id,
      type: "task" as const,
      payload: { title: "Weekend coverage in writing" },
      created_at: subDays(new Date(), 6).toISOString(),
    },
  ];
  await supabase.from("activities").insert(
    activitySeeds.map((a) => ({ ...a, owner_id: userId })),
  );

  revalidatePath("/dashboard");
  revalidatePath("/contacts");
  revalidatePath("/pipeline");
  revalidatePath("/tasks");
  return { ok: true, skipped: false };
}
