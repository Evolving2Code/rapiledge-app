"use client";

import { useState } from "react";
import { updateContact } from "@/app/actions/crm";
import { ContactFields } from "@/components/crm/contact-fields";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { Company, Contact } from "@/lib/types";

export function ContactEditor({
  contact,
  companies,
}: {
  contact: Contact;
  companies: Company[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline">Edit</Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Edit contact</SheetTitle>
        </SheetHeader>
        <form
          className="space-y-4 px-4 pb-6"
          action={async (formData) => {
            await updateContact(contact.id, formData);
            setOpen(false);
          }}
        >
          <ContactFields contact={contact} companies={companies} />
          <Button type="submit" className="w-full">
            Save changes
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
