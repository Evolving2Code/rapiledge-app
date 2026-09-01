import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteDeal, updateDeal } from "@/app/actions/crm";
import { ConfirmDelete } from "@/components/crm/confirm-delete";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEAL_STAGES } from "@/lib/constants";
import { stageLabel } from "@/lib/forms";
import { fullName, money, whenAbsolute } from "@/lib/format";
import { requireUser } from "@/lib/supabase/server";
import type { Activity, Contact, Deal } from "@/lib/types";
import { ActivityTimeline } from "@/components/crm/activity-timeline";

export default async function DealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, userId } = await requireUser();
  const { data: deal } = await supabase
    .from("deals")
    .select("*, contact:contacts(*, company:companies(*)), company:companies(*)")
    .eq("id", id)
    .eq("owner_id", userId)
    .maybeSingle();
  if (!deal) notFound();
  const record = deal as Deal;
  const { data: contacts } = await supabase
    .from("contacts")
    .select("*")
    .eq("owner_id", userId)
    .order("last_name");
  const { data: activities } = record.contact_id
    ? await supabase
        .from("activities")
        .select("*")
        .eq("contact_id", record.contact_id)
        .order("created_at", { ascending: false })
        .limit(12)
    : { data: [] };

  return (
    <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        <div>
          <p className="text-xs font-medium tracking-[0.18em] text-primary uppercase">
            {stageLabel(record.stage)}
          </p>
          <h1 className="font-heading text-4xl">{record.title}</h1>
          <p className="mt-1 text-muted-foreground">
            {money(Number(record.value), record.currency)}
            {record.expected_close_date
              ? ` · expected ${whenAbsolute(record.expected_close_date)}`
              : ""}
          </p>
          {record.contact && (
            <Link
              className="mt-2 inline-block text-sm text-primary hover:underline"
              href={`/contacts/${record.contact.id}`}
            >
              Brief me · {fullName(record.contact)}
            </Link>
          )}
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Contact activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityTimeline activities={(activities ?? []) as Activity[]} />
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Deal details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateDeal.bind(null, record.id)} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" defaultValue={record.title} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="value">Value</Label>
              <Input
                id="value"
                name="value"
                type="number"
                min="0"
                defaultValue={Number(record.value) || 0}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="stage">Stage</Label>
              <select
                id="stage"
                name="stage"
                defaultValue={record.stage}
                className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
              >
                {DEAL_STAGES.map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="contact_id">Contact</Label>
              <select
                id="contact_id"
                name="contact_id"
                defaultValue={record.contact_id ?? ""}
                className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
              >
                <option value="">None</option>
                {((contacts ?? []) as Contact[]).map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.first_name} {contact.last_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="expected_close_date">Expected close</Label>
              <Input
                id="expected_close_date"
                name="expected_close_date"
                type="date"
                defaultValue={record.expected_close_date ?? ""}
              />
            </div>
            <Button type="submit" className="w-full">
              Save deal
            </Button>
          </form>
          <div className="mt-4 flex justify-end">
            <ConfirmDelete
              description="This deal leaves the board. The contact stays."
              onConfirm={() => deleteDeal(record.id)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
