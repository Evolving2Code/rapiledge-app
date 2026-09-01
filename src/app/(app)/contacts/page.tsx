import Link from "next/link";
import { SeedButton } from "@/components/crm/seed-button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fullName, initials, when } from "@/lib/format";
import { requireUser } from "@/lib/supabase/server";
import type { Contact } from "@/lib/types";

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = typeof q === "string" ? q : "";
  const { supabase, userId } = await requireUser();
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
  const { data } = await request;
  const contacts = (data ?? []) as Contact[];

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
      <form className="max-w-sm">
        <Input name="q" placeholder="Search name or email" defaultValue={query} />
      </form>
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
              </p>
            </div>
            <div className="hidden items-center gap-2 sm:flex">
              {contact.tags.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
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
