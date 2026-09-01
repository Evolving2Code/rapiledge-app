import { signOut } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { gmailConfigured } from "@/lib/gmail/client";
import { recallConfigured } from "@/lib/recall/client";
import { requireUser } from "@/lib/supabase/server";
import { whenDatetime } from "@/lib/format";

export default async function SettingsPage() {
  const { supabase, userId, claims } = await requireUser();
  const [{ data: gmail }, { data: watch }, { data: recall }] = await Promise.all([
    supabase.from("integrations").select("*").eq("owner_id", userId).eq("provider", "gmail").maybeSingle(),
    supabase.from("gmail_watches").select("*").eq("owner_id", userId).maybeSingle(),
    supabase.from("integrations").select("*").eq("owner_id", userId).eq("provider", "recall").maybeSingle(),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-heading text-4xl">Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <p className="text-sm">{String(claims?.email ?? "Signed in")}</p>
          <form action={signOut}>
            <Button type="submit" variant="outline">
              Sign out
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Gmail</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            Send as you from a contact record. Inbound mail is pushed through Google Pub/Sub
            — watches expire every 7 days, so a daily cron renews them.
          </p>
          {gmail ? (
            <p>
              Connected. Watch expires{" "}
              {watch?.expiration ? whenDatetime(watch.expiration) : "(start a watch after Pub/Sub is set)"}.
            </p>
          ) : (
            <p>Not connected.</p>
          )}
          {gmailConfigured() ? (
            <Button asChild>
              <a href="/api/gmail/oauth">Connect Gmail</a>
            </Button>
          ) : (
            <p className="text-destructive">
              Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Vercel.
            </p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Recall.ai notetaker</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            Calendar connection and meeting bots. Completions hit{" "}
            <code>/api/webhooks/recall</code>, then Claude writes the summary onto the
            matched contact.
          </p>
          {recall ? <p>Calendar connected.</p> : <p>Not connected.</p>}
          {recallConfigured() ? (
            <Button asChild>
              <a href="/api/recall/calendar">Connect calendar</a>
            </Button>
          ) : (
            <p className="text-destructive">Set RECALL_API_KEY in Vercel.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
