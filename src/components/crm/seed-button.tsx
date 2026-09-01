"use client";

import { useTransition } from "react";
import { seedDemoLedger } from "@/app/actions/seed";
import { Button } from "@/components/ui/button";

export function SeedButton() {
  const [pending, start] = useTransition();
  return (
    <Button
      variant="outline"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await seedDemoLedger();
        })
      }
    >
      {pending ? "Writing…" : "Load sample ledger"}
    </Button>
  );
}
