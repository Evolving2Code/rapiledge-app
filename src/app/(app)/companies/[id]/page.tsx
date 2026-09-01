import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { fullName, initials } from "@/lib/format";
import { requireUser } from "@/lib/supabase/server";
import type { Company, Contact } from "@/lib/types";

export default async function CompanyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, userId } = await requireUser();
  const { data: company } = await supabase
    .from("companies")
    .select("*")
    .eq("id", id)
    .eq("owner_id", userId)
    .maybeSingle();
  if (!company) notFound();
  const record = company as Company;
  const { data: contacts } = await supabase
    .from("contacts")
    .select("*")
    .eq("company_id", id)
    .order("last_name");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-heading text-4xl">{record.name}</h1>
        <p className="text-muted-foreground">{record.domain}</p>
        {record.notes && <p className="mt-3 text-sm leading-relaxed">{record.notes}</p>}
      </div>
      <div className="divide-y rounded-xl bg-card ring-1 ring-foreground/10">
        {((contacts ?? []) as Contact[]).map((contact) => (
          <Link
            key={contact.id}
            href={`/contacts/${contact.id}`}
            className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40"
          >
            <Avatar>
              <AvatarFallback>{initials(fullName(contact))}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{fullName(contact)}</p>
              <p className="text-sm text-muted-foreground">{contact.job_title}</p>
            </div>
          </Link>
        ))}
        {(contacts ?? []).length === 0 && (
          <p className="px-4 py-8 text-sm text-muted-foreground">No people at this company yet.</p>
        )}
      </div>
    </div>
  );
}
