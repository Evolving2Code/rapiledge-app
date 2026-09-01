"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { sendContactEmail } from "@/lib/actions/email";
import { toast } from "sonner";
import Link from "next/link";

interface ComposeEmailDialogProps {
  contactId: string;
  contactEmail: string;
  contactName: string;
  gmailConnected: boolean;
}

export function ComposeEmailDialog({
  contactId,
  contactEmail,
  contactName,
  gmailConnected,
}: ComposeEmailDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) return;

    setLoading(true);
    try {
      await sendContactEmail(contactId, subject, body);
      toast.success("Email sent and logged to timeline");
      setOpen(false);
      setSubject("");
      setBody("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send email");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-primary/30">
          <Mail className="mr-2 h-4 w-4 text-primary" />
          Send Email
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Send Email</DialogTitle>
          <DialogDescription>
            To {contactName} &lt;{contactEmail}&gt;
          </DialogDescription>
        </DialogHeader>

        {!gmailConnected ? (
          <div className="space-y-4 py-4 text-center">
            <p className="text-sm text-muted-foreground">
              Connect your Gmail account to send emails directly from RapiLedge.
              Sent messages are automatically logged to the contact timeline.
            </p>
            <Button asChild>
              <Link href="/settings">Connect Gmail</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Following up on our conversation"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="body">Message</Label>
              <Textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Hi Sarah, ..."
                rows={8}
                required
              />
            </div>
            <Button type="submit" className="w-full gold-glow" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send &amp; Log
                </>
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
