import { AppHeader } from "@/components/layout/app-header";
import { GmailConnectCard } from "@/components/email/gmail-connect-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { isGoogleConfigured } from "@/lib/google/config";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ gmail?: string; message?: string }>;
}) {
  const { gmail, message } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: integration } = await supabase
    .from("google_integrations")
    .select("google_email")
    .eq("user_id", user!.id)
    .maybeSingle();

  return (
    <>
      <AppHeader title="Settings" subtitle="Integrations & preferences" email={user?.email} />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-2xl space-y-6">
          {gmail === "connected" && (
            <div className="rounded-lg border border-sage/30 bg-sage/10 px-4 py-3 text-sm text-sage">
              Gmail connected successfully.
            </div>
          )}
          {gmail === "error" && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              Failed to connect Gmail{message ? `: ${message}` : "."}
            </div>
          )}

          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Email</CardTitle>
              <CardDescription>
                Connect Gmail to send emails from contact records. Messages are
                automatically logged to the activity timeline.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GmailConnectCard
                connected={!!integration}
                email={integration?.google_email ?? null}
                configured={isGoogleConfigured()}
              />
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Coming soon</CardTitle>
              <CardDescription>Additional integrations in upcoming phases</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• Gmail inbound sync (Pub/Sub webhook) — Phase 4</p>
              <p>• Recall.ai call notetaker — Phase 5</p>
              <p>• Calendar connection — Phase 5</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
