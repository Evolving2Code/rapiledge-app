import { AppHeader } from "@/components/layout/app-header";
import { ContactCard } from "@/components/contacts/contact-card";
import { ContactSearch, NewContactDialog } from "@/components/contacts/contact-form";
import { createClient } from "@/lib/supabase/server";
import type { Contact, Company } from "@/lib/types";

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let query = supabase
    .from("contacts")
    .select("*, company:companies(*)")
    .order("updated_at", { ascending: false });

  if (q) {
    query = query.or(
      `first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%`
    );
  }

  const { data: contacts } = await query;
  const typedContacts = (contacts ?? []) as (Contact & { company: Company | null })[];

  return (
    <>
      <AppHeader
        title="Contacts"
        subtitle={`${typedContacts.length} contact${typedContacts.length !== 1 ? "s" : ""}`}
        email={user?.email}
      />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <ContactSearch defaultValue={q} />
          <NewContactDialog />
        </div>

        {typedContacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 py-16 text-center">
            <p className="text-lg font-medium">No contacts yet</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Add your first contact and start building the context that makes
              every call feel like d&eacute;j&agrave; vu.
            </p>
            <div className="mt-4">
              <NewContactDialog />
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {typedContacts.map((contact) => (
              <ContactCard key={contact.id} contact={contact} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
