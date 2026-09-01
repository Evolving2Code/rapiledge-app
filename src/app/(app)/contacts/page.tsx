import Link from "next/link";
import { SeedButton } from "@/components/crm/seed-button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sanitizeSearch } from "@/lib/forms";
import { fullName, initials, when } from "@/lib/format";
import { requireUser } from "@/lib/supabase/server";
import type { Company, Contact } from "@/lib/types";

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; company?: string; tag?: string }>;
}) {
  const { q, company, tag } = await searchParams;
  const query = sanitizeSearch(typeof q === "string" ? q : "");
  const companyId = typeof company === "string" ? company : "";
  const tagFilter = typeof tag === "string" ? tag : "";
  const { supabase, userId } = await requireUser();
  const { data: companies } = await supabase
    .from("companies")
    .select("*")
    .eq("owner_id", userId)
    .order("name");
  let request = supabase
    .from("contacts")
    .select("*, company:companies(*)")
    .eq("owner_id", userId)
    .order("last_contact_at", { ascending: false, nullsFirst: false });
  if (query) {
    request = request.or(
      `first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`,
    );
  }
  if (companyId) request = request.eq("company_id", companyId);
  if (tagFilter) request = request.contains("tags", [tagFilter]);
  const { data } = await request;
  const contacts = (data ?? []) as Contact[];
  const tags = [...new Set(contacts.flatMap((contact) => contact.tags))].slice(0, 12);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-4xl">Contacts</h1>
          <p className="text-sm text-muted-foreground">
            The record is the product. Everything else is a panel.
          </p>
        </div>
        <div className="flex gap-2">
          {contacts.length === 0 && <SeedButton />}
          <Button asChild>
            <Link href="/contacts/new">New contact</Link>
          </Button>
        </div>
      </div>
      <form className="flex flex-wrap gap-2">
        <Input name="q" placeholder="Search name or email" defaultValue={query} className="max-w-sm" />
        <select
          name="company"
          defaultValue={companyId}
          className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm"
        >
          <option value="">All companies</option>
          {((companies ?? []) as Company[]).map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <Input name="tag" placeholder="Tag" defaultValue={tagFilter} className="w-36" />
        <Button type="submit" variant="outline">
          Filter
        </Button>
      </form>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((item) => (
            <Link key={item} href={`/contacts?tag=${encodeURIComponent(item)}`}>
              <Badge variant={item === tagFilter ? "default" : "secondary"}>{item}</Badge>
            </Link>
          ))}
        </div>
      )}
      <div className="divide-y rounded-xl bg-card ring-1 ring-foreground/10">
        {contacts.map((contact) => (
          <Link
            key={contact.id}
            href={`/contacts/${contact.id}`}
            className="flex items-center gap-4 px-4 py-3 hover:bg-muted/40"
          >
            <Avatar className="size-10">
              <AvatarFallback>{initials(fullName(contact))}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="font-medium">{fullName(contact)}</p>
              <p className="truncate text-sm text-muted-foreground">
                {contact.job_title}
                {contact.company ? ` · ${contact.company.name}` : ""}
                {contact.email ? ` · ${contact.email}` : ""}
              </p>
            </div>
            <div className="hidden items-center gap-2 sm:flex">
              {contact.tags.slice(0, 2).map((item) => (
                <Badge key={item} variant="secondary">
                  {item}
                </Badge>
              ))}
            </div>
            <p className="hidden text-xs text-muted-foreground md:block">
              {contact.last_contact_at ? when(contact.last_contact_at) : "No touch"}
            </p>
          </Link>
        ))}
        {contacts.length === 0 && (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            Empty ledger. Add a contact, or load the sample so you can see Brief me
            remember a dog&apos;s birthday.
          </p>
        )}
      </div>
    </div>
  );
}
