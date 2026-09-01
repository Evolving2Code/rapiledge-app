import Link from "next/link";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SetupPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 gold-glow">
          <Zap className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-3xl font-bold">RapiLedge</h1>
      </div>

      <Card className="glass-card w-full max-w-lg">
        <CardHeader>
          <CardTitle>Setup Required</CardTitle>
          <CardDescription>
            Connect Supabase to get started
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <ol className="list-decimal space-y-2 pl-4">
            <li>Create a Supabase project at supabase.com</li>
            <li>
              Run the migration in{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                supabase/migrations/20260901000000_initial_schema.sql
              </code>
            </li>
            <li>
              Copy <code className="rounded bg-muted px-1 py-0.5 text-xs">.env.example</code> to{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">.env.local</code> and add your
              Supabase URL and anon key
            </li>
            <li>Restart the dev server</li>
          </ol>
          <Button asChild className="w-full">
            <Link href="https://supabase.com/dashboard" target="_blank">
              Open Supabase Dashboard
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
