"use client";

import { useState, useTransition } from "react";
import { polishNoteDraft } from "@/app/actions/brief";
import { createNote } from "@/app/actions/crm";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export function NoteComposer({ contactId }: { contactId: string }) {
  const [body, setBody] = useState("");
  const [saving, startSave] = useTransition();
  const [polishing, startPolish] = useTransition();

  return (
    <form
      className="space-y-2"
      action={(formData) =>
        startSave(async () => {
          try {
            await createNote(contactId, formData);
            setBody("");
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Could not save note");
          }
        })
      }
    >
      <Textarea
        name="body"
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder="Something worth remembering later."
        required
      />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="sm" disabled={saving || !body.trim()}>
          {saving ? "Saving…" : "Add note"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={polishing || !body.trim()}
          onClick={() =>
            startPolish(async () => {
              try {
                setBody(await polishNoteDraft(body));
                toast.success("Cleaned up. Facts stayed put.");
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Polish failed");
              }
            })
          }
        >
          {polishing ? "Polishing…" : "Polish with Claude"}
        </Button>
      </div>
    </form>
  );
}
