import { createContact } from "@/app/actions/crm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="first_name">First name</Label>
            <Input id="first_name" name="first_name" required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="last_name">Last name</Label>
            <Input id="last_name" name="last_name" required />
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="emails">More emails</Label>
          <Input id="emails" name="emails" placeholder="comma separated" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="job_title">Title</Label>
            <Input id="job_title" name="job_title" />
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="company_id">Company</Label>
          <select
            id="company_id"
            name="company_id"
            className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
          >
            <option value="">None</option>
            {((companies ?? []) as Company[]).map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="tags">Tags</Label>
          <Input id="tags" name="tags" placeholder="champion, blocker" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="dog_name">Dog&apos;s name</Label>
            <Input id="dog_name" name="dog_name" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="dog_birthday">Dog&apos;s birthday</Label>
            <Input id="dog_birthday" name="dog_birthday" placeholder="April 3" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="custom_key">Custom field</Label>
            <Input id="custom_key" name="custom_key" placeholder="coffee order" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="custom_value">Value</Label>
            <Input id="custom_value" name="custom_value" />
          </div>
        </div>
        <Button type="submit">Save contact</Button>
      </form>
    </div>
  );
}
