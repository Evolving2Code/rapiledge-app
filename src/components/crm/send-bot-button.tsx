"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { sendNotetaker } from "@/app/actions/meetings";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function SendBotButton({
  meetingId,
  meetingUrl,
  calendarEventId,
}: {
  meetingId: string;
  meetingUrl?: string | null;
  calendarEventId?: string | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  if (!meetingUrl && !calendarEventId) return null;
  return (
    <Button
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={() =>
        start(async () => {
          try {
            await sendNotetaker(meetingId);
            toast.success("Notetaker is on the way.");
            router.refresh();
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Could not send the bot");
          }
        })
      }
    >
      {pending ? "Joining…" : "Send notetaker"}
    </Button>
  );
}
