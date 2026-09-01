import Link from "next/link";
import { signUp } from "@/app/actions/auth";
import { Wordmark } from "@/components/brand/wordmark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isSupabaseConfigured, POSITIONING_LINE } from "@/lib/constants";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : null;
  const configured = isSupabaseConfigured();

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-sidebar p-10 lg:flex">
        <Wordmark />
        <p className="font-heading max-w-md text-3xl leading-snug">
          {POSITIONING_LINE}
        </p>
      </div>
      <div className="flex flex-col justify-center px-6 py-16">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Wordmark />
          </div>
          <h1 className="font-heading text-3xl">Start a ledger</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Nothing gets logged just to be logged.
          </p>
          {error && (
            <p className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
          <form action={signUp} className="mt-8 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Name</Label>
              <Input id="full_name" name="full_name" required disabled={!configured} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                disabled={!configured}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                minLength={8}
                required
                disabled={!configured}
              />
            </div>
            <Button type="submit" className="w-full" disabled={!configured}>
              Create account
            </Button>
          </form>
          <p className="mt-6 text-sm text-muted-foreground">
            Already inside?{" "}
            <Link href="/login" className="text-primary underline-offset-4 hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
