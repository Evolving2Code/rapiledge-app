import Image from "next/image";
import Link from "next/link";
import { Wordmark } from "@/components/brand/wordmark";
import { Button } from "@/components/ui/button";

const OPTIONS = [
  {
    file: "rapiledge-ui-option-1-ink-vault.png",
    name: "1 · Ink Vault",
    note: "Dark charcoal, cream type, antique gold. Private-banker desk.",
  },
  {
    file: "rapiledge-ui-option-2-daylight-brief.png",
    name: "2 · Daylight Brief",
    note: "Warm paper, terracotta, serif headlines. The live product direction.",
    chosen: true,
  },
  {
    file: "rapiledge-ui-option-3-midnight-signal.png",
    name: "3 · Midnight Signal",
    note: "Indigo command center with cyan Brief me glow.",
  },
  {
    file: "rapiledge-ui-option-4-studio-ledger.png",
    name: "4 · Studio Ledger",
    note: "Magazine columns, forest green, portrait rules.",
  },
  {
    file: "rapiledge-ui-option-5-kanban-memory.png",
    name: "5 · Kanban Memory",
    note: "Navy operational board with an amber memory drawer.",
  },
];

export default function DesignPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Wordmark />
        <Button asChild variant="outline">
          <Link href="/">Back</Link>
        </Button>
      </header>
      <main className="mx-auto max-w-6xl px-6 pb-20">
        <h1 className="font-heading text-4xl">Five UI directions</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Generated first, then built. RapiLedge ships as Daylight Brief — the
          HubSpot-style contact record on warm paper, because this product is
          used with the lights on, right before a call.
        </p>
        <div className="mt-10 grid gap-10">
          {OPTIONS.map((option) => (
            <figure key={option.file} className="overflow-hidden rounded-2xl ring-1 ring-foreground/10">
              <Image
                src={`/design/${option.file}`}
                alt={option.name}
                width={1600}
                height={900}
                className="h-auto w-full"
              />
              <figcaption className="flex flex-wrap items-baseline justify-between gap-2 bg-card px-5 py-4">
                <span className="font-heading text-lg">
                  {option.name}
                  {option.chosen ? " — chosen" : ""}
                </span>
                <span className="text-sm text-muted-foreground">{option.note}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </main>
    </div>
  );
}
