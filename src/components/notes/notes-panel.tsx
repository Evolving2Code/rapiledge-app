"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Plus, Sparkles, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { createNote } from "@/lib/actions/crm";
import { toast } from "sonner";
import type { Note } from "@/lib/types";

interface NotesPanelProps {
  contactId: string;
  notes: Note[];
}

export function NotesPanel({ contactId, notes }: NotesPanelProps) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.set("contact_id", contactId);
      formData.set("body", body);
      await createNote(formData);
      setBody("");
      setShowForm(false);
      toast.success("Note added");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add note");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Notes</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-2">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Add a note..."
            rows={3}
          />
          <Button type="submit" size="sm" disabled={loading}>
            {loading ? "Saving..." : "Save Note"}
          </Button>
        </form>
      )}

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {notes.map((note) => (
          <div
            key={note.id}
            className={`rounded-lg border p-3 text-sm ${
              note.source !== "manual"
                ? "border-sage/30 bg-sage/5"
                : "border-border/40"
            }`}
          >
            <div className="mb-1 flex items-center gap-2">
              {note.source === "manual" ? (
                <PenLine className="h-3 w-3 text-muted-foreground" />
              ) : (
                <Sparkles className="h-3 w-3 text-sage" />
              )}
              <Badge variant="outline" className="text-[10px]">
                {note.source === "manual"
                  ? "Manual"
                  : note.source.replace("ai_", "AI ")}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {format(new Date(note.created_at), "MMM d")}
              </span>
            </div>
            <p className="text-muted-foreground line-clamp-4">{note.body}</p>
          </div>
        ))}
        {notes.length === 0 && (
          <p className="text-xs text-muted-foreground">No notes yet</p>
        )}
      </div>
    </div>
  );
}
