import Link from "next/link";
import { createCompany } from "@/app/actions/crm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { requireUser } from "@/lib/supabase/server";
import type { Company } from "@/lib/types";

export default async function CompaniesPage() {
  const { supabase, userId } = await requireUser();
  const { data } = await supabase
    .from("companies")
    .select("*")
    .eq("owner_id", userId)
    .order("name");
  const companies = (data ?? []) as Company[];

  return (
    <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1fr_320px]">
      <div>
        <h1 className="font-heading text-4xl">Companies</h1>
        <div className="mt-6 divide-y rounded-xl bg-card ring-1 ring-foreground/10">
          {companies.map((company) => (
            <Link
              key={company.id}
              href={`/companies/${company.id}`}
              className="block px-4 py-3 hover:bg-muted/40"
            >
              <p className="font-medium">{company.name}</p>
              <p className="text-sm text-muted-foreground">{company.domain ?? "No domain"}</p>
            </Link>
          ))}
          {companies.length === 0 && (
            <p className="px-4 py-8 text-sm text-muted-foreground">No companies yet.</p>
          )}
        </div>
      </div>
      <form action={createCompany} className="h-fit space-y-3 rounded-xl bg-card p-5 ring-1 ring-foreground/10">
        <h2 className="font-heading text-xl">Add company</h2>
        <div className="space-y-1">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="domain">Domain</Label>
          <Input id="domain" name="domain" placeholder="acme.com" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" name="notes" rows={3} />
        </div>
        <Button type="submit">Save</Button>
      </form>
    </div>
  );
}
