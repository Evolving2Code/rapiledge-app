import { extraCustomFields } from "@/lib/forms";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Company, Contact } from "@/lib/types";

export function ContactFields({
  contact,
  companies,
}: {
  contact?: Contact;
  companies: Company[];
}) {
  const extra = extraCustomFields(contact?.custom_fields ?? {});
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="first_name">First name</Label>
          <Input
            id="first_name"
            name="first_name"
            required
            defaultValue={contact?.first_name}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="last_name">Last name</Label>
          <Input
            id="last_name"
            name="last_name"
            required
            defaultValue={contact?.last_name}
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          defaultValue={contact?.email ?? ""}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="emails">More emails</Label>
        <Input
          id="emails"
          name="emails"
          placeholder="comma separated"
          defaultValue={contact?.emails?.join(", ") ?? ""}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" defaultValue={contact?.phone ?? ""} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="job_title">Title</Label>
          <Input
            id="job_title"
            name="job_title"
            defaultValue={contact?.job_title ?? ""}
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="company_id">Company</Label>
        <select
          id="company_id"
          name="company_id"
          defaultValue={contact?.company_id ?? ""}
          className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
        >
          <option value="">None</option>
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="tags">Tags</Label>
        <Input
          id="tags"
          name="tags"
          placeholder="champion, blocker"
          defaultValue={contact?.tags?.join(", ") ?? ""}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="dog_name">Dog&apos;s name</Label>
          <Input
            id="dog_name"
            name="dog_name"
            defaultValue={contact?.custom_fields?.dog_name ?? ""}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="dog_birthday">Dog&apos;s birthday</Label>
          <Input
            id="dog_birthday"
            name="dog_birthday"
            placeholder="April 3"
            defaultValue={contact?.custom_fields?.dog_birthday ?? ""}
          />
        </div>
      </div>
      {extra.length > 0 && (
        <dl className="space-y-1 rounded-lg bg-muted/50 px-3 py-2 text-sm">
          {extra.map(([key, value]) => (
            <div key={key} className="flex justify-between gap-3">
              <dt className="text-muted-foreground">{key}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      )}
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
    </>
  );
}
