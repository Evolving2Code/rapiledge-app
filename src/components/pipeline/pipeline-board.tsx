"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { updateDealStage, createDeal } from "@/lib/actions/crm";
import { toast } from "sonner";
import {
  DEAL_STAGES,
  formatCurrency,
  contactDisplayName,
  type Deal,
  type DealStage,
  type Contact,
} from "@/lib/types";

type DealWithContact = Deal & {
  contact: Pick<Contact, "first_name" | "last_name"> | null;
};

interface PipelineBoardProps {
  deals: DealWithContact[];
}

const pipelineStages = DEAL_STAGES.filter(
  (s) => !["closed_won", "closed_lost"].includes(s.id)
);

export function PipelineBoard({ deals: initialDeals }: PipelineBoardProps) {
  const router = useRouter();
  const [deals, setDeals] = useState(initialDeals);
  const [activeDeal, setActiveDeal] = useState<DealWithContact | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<DealStage>("lead");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  function handleDragStart(event: DragStartEvent) {
    const deal = deals.find((d) => d.id === event.active.id);
    if (deal) setActiveDeal(deal);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveDeal(null);
    const { active, over } = event;
    if (!over) return;

    const dealId = active.id as string;
    const newStage = over.id as DealStage;
    const deal = deals.find((d) => d.id === dealId);
    if (!deal || deal.stage === newStage) return;
    if (!pipelineStages.some((s) => s.id === newStage)) return;

    setDeals((prev) =>
      prev.map((d) => (d.id === dealId ? { ...d, stage: newStage } : d))
    );

    try {
      await updateDealStage(dealId, newStage);
      router.refresh();
    } catch {
      setDeals(initialDeals);
      toast.error("Failed to update deal stage");
    }
  }

  async function handleCreateDeal(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("stage", stage);
    try {
      await createDeal(formData);
      toast.success("Deal created");
      setDialogOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create deal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex justify-end">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gold-glow">
              <Plus className="mr-2 h-4 w-4" />
              New Deal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Deal</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateDeal} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="value">Value ($)</Label>
                <Input id="value" name="value" type="number" min="0" step="1000" />
              </div>
              <div className="space-y-2">
                <Label>Stage</Label>
                <Select value={stage} onValueChange={(v) => setStage(v as DealStage)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {pipelineStages.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="expected_close_date">Expected close</Label>
                <Input id="expected_close_date" name="expected_close_date" type="date" />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating..." : "Create Deal"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {pipelineStages.map((stageConfig) => {
            const stageDeals = deals.filter((d) => d.stage === stageConfig.id);
            const stageValue = stageDeals.reduce(
              (sum, d) => sum + Number(d.value),
              0
            );

            return (
              <PipelineColumn
                key={stageConfig.id}
                stageId={stageConfig.id}
                label={stageConfig.label}
                count={stageDeals.length}
                value={stageValue}
              >
                {stageDeals.map((deal) => (
                  <DealCard key={deal.id} deal={deal} />
                ))}
              </PipelineColumn>
            );
          })}
        </div>

        <DragOverlay>
          {activeDeal ? <DealCard deal={activeDeal} isDragging /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function PipelineColumn({
  stageId,
  label,
  count,
  value,
  children,
}: {
  stageId: DealStage;
  label: string;
  count: number;
  value: number;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stageId });

  return (
    <div
      className={`flex w-72 shrink-0 flex-col rounded-xl border bg-muted/20 transition-colors ${
        isOver ? "border-primary/50 bg-primary/5" : "border-border/60"
      }`}
    >
      <div className="border-b border-border/40 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">{label}</span>
          <span className="text-xs text-muted-foreground">{count}</span>
        </div>
        <p className="mt-1 text-xs text-primary">{formatCurrency(value)}</p>
      </div>
      <div ref={setNodeRef} className="flex min-h-[200px] flex-col gap-2 p-3">
        {children}
      </div>
    </div>
  );
}

function DealCard({
  deal,
  isDragging,
}: {
  deal: DealWithContact;
  isDragging?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging: dragging } =
    useDraggable({ id: deal.id });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`glass-card cursor-grab rounded-lg p-3 active:cursor-grabbing ${
        isDragging || dragging ? "shadow-xl ring-2 ring-primary/30" : ""
      }`}
    >
      <p className="text-sm font-medium">{deal.title}</p>
      {deal.contact && (
        <Link
          href={`/contacts/${deal.contact_id}`}
          className="mt-1 block text-xs text-muted-foreground hover:text-primary"
          onClick={(e) => e.stopPropagation()}
        >
          {contactDisplayName(deal.contact)}
        </Link>
      )}
      <p className="mt-2 text-lg font-semibold text-primary">
        {formatCurrency(Number(deal.value))}
      </p>
      {deal.expected_close_date && (
        <p className="mt-1 text-xs text-muted-foreground">
          Close: {new Date(deal.expected_close_date).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}
