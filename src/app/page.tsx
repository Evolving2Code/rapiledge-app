import Link from "next/link";
import { Wordmark } from "@/components/brand/wordmark";
import { Button } from "@/components/ui/button";
import { POSITIONING_LINE } from "@/lib/constants";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Wordmark />
        <div className="flex items-center gap-3">
          <Button variant="ghost" asChild>
            <Link href="/design">UI directions</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Get the ledger</Link>
          </Button>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center px-6 pb-24 pt-10">
        <p className="text-xs font-medium tracking-[0.2em] text-primary uppercase">
          Photographic memory, on demand
        </p>
        <h1 className="font-heading mt-4 max-w-3xl text-4xl leading-[1.15] text-balance sm:text-6xl">
          {POSITIONING_LINE}
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
          RapiLedge is the CRM that does not log things just to log them. Every
          note, email, and call comes back at the exact moment you pick up the
          phone — so you look like you never forgot.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Button size="lg" asChild>
            <Link href="/signup">Start a ledger</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/login">I already remember my password</Link>
          </Button>
        </div>
        <dl className="mt-16 grid gap-8 border-t pt-10 sm:grid-cols-3">
          {[
            {
              k: "Brief me",
              v: "On-demand digest of last interaction, open items, and the details that make you look dangerous.",
            },
            {
              k: "Gmail, live",
              v: "Send from the contact record. Inbound mail hits a real Pub/Sub webhook — not a polite poll.",
            },
            {
              k: "The call, written down",
              v: "A Recall.ai bot joins. Claude turns the transcript into a summary you will actually use.",
            },
          ].map((item) => (
            <div key={item.k}>
              <dt className="font-heading text-lg">{item.k}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {item.v}
              </dd>
            </div>
          ))}
        </dl>
      </main>
    </div>
  );
}
