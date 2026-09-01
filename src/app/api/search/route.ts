import { NextResponse } from "next/server";
import { fullName } from "@/lib/format";
import { sanitizeSearch } from "@/lib/forms";
import { requireUser } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = sanitizeSearch(searchParams.get("q") ?? "");
  const { supabase, userId } = await requireUser();

  let contactsQuery = supabase
    .from("contacts")
    .select("id, first_name, last_name, email, company:companies(name)")
    .eq("owner_id", userId)
    .limit(8);
  if (q) {
    contactsQuery = contactsQuery.or(
      `first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%`,
    );
  }

  let companiesQuery = supabase
    .from("companies")
    .select("id, name")
    .eq("owner_id", userId)
    .limit(6);
  if (q) companiesQuery = companiesQuery.ilike("name", `%${q}%`);

  let dealsQuery = supabase
    .from("deals")
    .select("id, title, stage")
    .eq("owner_id", userId)
    .limit(6);
  if (q) dealsQuery = dealsQuery.ilike("title", `%${q}%`);

  const [{ data: contacts }, { data: companies }, { data: deals }] = await Promise.all([
    contactsQuery,
    companiesQuery,
    dealsQuery,
  ]);

  return NextResponse.json({
    contacts: (contacts ?? []).map((contact) => {
      const company = contact.company as { name?: string } | { name?: string }[] | null;
      const companyName = Array.isArray(company) ? company[0]?.name : company?.name;
      return {
        id: contact.id,
        name: fullName(contact),
        email: contact.email,
        company: companyName,
      };
    }),
    companies: companies ?? [],
    deals: deals ?? [],
  });
}
