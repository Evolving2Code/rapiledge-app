import { createContact } from "@/app/actions/crm";
import { ContactFields } from "@/components/crm/contact-fields";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/supabase/server";
import type { Company } from "@/lib/types";

export default async function NewContactPage() {
  const { supabase, userId } = await requireUser();
  const { data: companies } = await supabase
    .from("companies")
    .select("*")
    .eq("owner_id", userId)
    .order("name");

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="font-heading text-4xl">New contact</h1>
      <form action={createContact} className="space-y-4 rounded-xl bg-card p-6 ring-1 ring-foreground/10">
        <ContactFields companies={(companies ?? []) as Company[]} />
        <Button type="submit">Save contact</Button>
      </form>
    </div>
  );
}
