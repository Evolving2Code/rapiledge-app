import { Badge } from "@/components/ui/badge";
import { when } from "@/lib/format";
import type { Note } from "@/lib/types";
import { cn } from "@/lib/utils";

const SOURCE: Record<Note["source"], string> = {
  manual: "Manual",
  ai_call: "AI · call",
  ai_email: "AI · email",
};

export function NotesList({ notes }: { notes: Note[] }) {
  if (notes.length === 0) {
    return <p className="text-sm text-muted-foreground">No notes yet.</p>;
  }
  return (
    <div className="space-y-3">
      {notes.map((note) => (
        <article
          key={note.id}
          className={cn(
            "rounded-lg border px-3 py-3",
            note.source === "manual"
              ? "bg-card"
              : "border-primary/20 bg-[color-mix(in_oklch,var(--card),var(--primary)_6%)]",
          )}
        >
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <Badge variant={note.source === "manual" ? "outline" : "default"}>
              {SOURCE[note.source]}
            </Badge>
            <span className="text-xs text-muted-foreground">{when(note.created_at)}</span>
          </div>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{note.body}</p>
        </article>
      ))}
    </div>
  );
}
