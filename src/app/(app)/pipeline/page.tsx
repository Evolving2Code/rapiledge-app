import { createDeal } from "@/app/actions/crm";
import { KanbanBoard } from "@/components/crm/kanban-board";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { DEAL_STAGES } from "@/lib/constants";
import { requireUser } from "@/lib/supabase/server";
import type { Contact, Deal } from "@/lib/types";

export default async function PipelinePage() {
  const { supabase, userId } = await requireUser();
  const [{ data: deals }, { data: contacts }] = await Promise.all([
    supabase
      .from("deals")
      .select("*, contact:contacts(*)")
      .eq("owner_id", userId),
    supabase.from("contacts").select("*").eq("owner_id", userId).order("last_name"),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-4xl">Pipeline</h1>
          <p className="text-sm text-muted-foreground">Drag a card when the stage actually changed.</p>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button>New deal</Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>New deal</SheetTitle>
            </SheetHeader>
            <form action={createDeal} className="space-y-3 px-4">
              <input type="hidden" name="next" value="deal" />
              <div className="space-y-1">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="value">Value</Label>
                <Input id="value" name="value" type="number" min="0" step="1" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="stage">Stage</Label>
                <select
                  id="stage"
                  name="stage"
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
                <Input id="expected_close_date" name="expected_close_date" type="date" />
              </div>
              <Button type="submit">Create deal</Button>
            </form>
          </SheetContent>
        </Sheet>
      </div>
      <KanbanBoard deals={(deals ?? []) as Deal[]} />
    </div>
  );
}
