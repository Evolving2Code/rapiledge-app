"use client";

import { useTransition } from "react";
import { sendContactEmail } from "@/app/actions/email";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from "sonner";

export function EmailComposer({
  contactId,
  defaultTo,
}: {
  contactId: string;
  defaultTo?: string | null;
}) {
  const [pending, start] = useTransition();
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Email</Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Send as you</SheetTitle>
        </SheetHeader>
        <form
          className="mt-4 space-y-3 px-4"
          action={(formData) =>
            start(async () => {
              try {
                await sendContactEmail(contactId, formData);
                toast.success("Sent and logged to the timeline.");
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Send failed");
              }
            })
          }
        >
          <div className="space-y-1">
            <Label htmlFor="to">To</Label>
            <Input id="to" name="to" type="email" defaultValue={defaultTo ?? ""} required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" name="subject" required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="body">Message</Label>
            <Textarea id="body" name="body" rows={8} required />
          </div>
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Sending…" : "Send via Gmail"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
