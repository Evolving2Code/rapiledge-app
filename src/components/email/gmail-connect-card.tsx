"use client";

import { useRouter } from "next/navigation";
import { Mail, Unplug, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { disconnectGmail } from "@/lib/actions/email";
import { toast } from "sonner";

interface GmailConnectCardProps {
  connected: boolean;
  email: string | null;
  configured: boolean;
}

export function GmailConnectCard({
  connected,
  email,
  configured,
}: GmailConnectCardProps) {
  const router = useRouter();

  async function handleDisconnect() {
    try {
      await disconnectGmail();
      toast.success("Gmail disconnected");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to disconnect");
    }
  }

  if (!configured) {
    return (
      <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
        <p className="text-sm text-muted-foreground">
          Add <code className="text-xs">GOOGLE_CLIENT_ID</code> and{" "}
          <code className="text-xs">GOOGLE_CLIENT_SECRET</code> to your environment
          variables, then restart the server.
        </p>
      </div>
    );
  }

  if (connected && email) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-sage/30 bg-sage/5 p-4">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-sage" />
          <div>
            <p className="text-sm font-medium">Gmail connected</p>
            <p className="text-xs text-muted-foreground">{email}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={handleDisconnect}>
          <Unplug className="mr-1 h-3 w-3" />
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between rounded-lg border border-border/60 p-4">
      <div className="flex items-center gap-3">
        <Mail className="h-5 w-5 text-primary" />
        <div>
          <p className="text-sm font-medium">Connect Gmail</p>
          <p className="text-xs text-muted-foreground">
            Send emails from contact records and auto-log to timeline
          </p>
        </div>
      </div>
      <Button asChild className="gold-glow">
        <a href="/api/auth/google">Connect</a>
      </Button>
    </div>
  );
}
