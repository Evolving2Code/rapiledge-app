import Link from "next/link";
import { signIn } from "@/app/actions/auth";
import { Wordmark } from "@/components/brand/wordmark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isSupabaseConfigured, POSITIONING_LINE } from "@/lib/constants";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; checkEmail?: string }>;
}) {
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : null;
  const checkEmail = params.checkEmail === "1";
  const configured = isSupabaseConfigured();

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-sidebar p-10 lg:flex">
        <Wordmark />
        <blockquote className="max-w-md">
          <p className="font-heading text-3xl leading-snug">{POSITIONING_LINE}</p>
          <footer className="mt-4 text-sm text-muted-foreground">
            — the only pitch RapiLedge needs
          </footer>
        </blockquote>
      </div>
      <div className="flex flex-col justify-center px-6 py-16">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Wordmark />
          </div>
          <h1 className="font-heading text-3xl">Welcome back</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            The ledger does not forget. Your password might.
          </p>
          {!configured && (
            <p className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              Supabase is not configured. Add{" "}
              <code>NEXT_PUBLIC_SUPABASE_URL</code> and a publishable key, then
              run the SQL in <code>supabase/migrations</code>.
            </p>
          )}
          {checkEmail && (
            <p className="mt-4 rounded-lg bg-accent px-3 py-2 text-sm">
              Check your email to confirm the account, then sign in.
            </p>
          )}
          {error && (
            <p className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
          <form action={signIn} className="mt-8 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                disabled={!configured}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                disabled={!configured}
              />
            </div>
            <Button type="submit" className="w-full" disabled={!configured}>
              Open the ledger
            </Button>
          </form>
          <p className="mt-6 text-sm text-muted-foreground">
            New here?{" "}
            <Link href="/signup" className="text-primary underline-offset-4 hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
