"use client";

import Link from "next/link";
import { useMemo, useOptimistic, useTransition } from "react";
import {
  DndContext,
  PointerSensor,
  closestCorners,
  useDroppable,
  useDraggable,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { updateDealStage } from "@/app/actions/crm";
import { DEAL_STAGES } from "@/lib/constants";
import { fullName, money, when } from "@/lib/format";
import type { Deal, DealStage } from "@/lib/types";
import { cn } from "@/lib/utils";

function DealCard({ deal }: { deal: Deal }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: deal.id,
    data: { stage: deal.stage },
  });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      {...listeners}
      {...attributes}
      className={cn(
        "cursor-grab rounded-xl bg-card p-3 ring-1 ring-foreground/10",
        isDragging && "opacity-60",
      )}
    >
      <p className="text-sm font-medium">{deal.title}</p>
      <p className="mt-1 text-lg font-heading">{money(Number(deal.value), deal.currency)}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {deal.contact ? fullName(deal.contact) : "No contact"}
        {deal.contact?.last_contact_at
          ? ` · ${when(deal.contact.last_contact_at)}`
          : ""}
      </p>
      <Link
        href={`/pipeline/${deal.id}`}
        className="mt-2 inline-block text-xs text-primary hover:underline"
        onPointerDown={(event) => event.stopPropagation()}
      >
        Open
      </Link>
    </div>
  );
}

function Column({
  stage,
  label,
  deals,
}: {
  stage: DealStage;
  label: string;
  deals: Deal[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const total = deals.reduce((sum, d) => sum + Number(d.value || 0), 0);
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-[320px] min-w-[220px] flex-1 flex-col rounded-2xl bg-muted/50 p-3",
        isOver && "ring-2 ring-primary/40",
      )}
    >
      <div className="mb-3 flex items-baseline justify-between px-1">
        <h3 className="text-sm font-medium">{label}</h3>
        <span className="text-xs text-muted-foreground">{money(total)}</span>
      </div>
      <div className="flex flex-col gap-2">
        {deals.map((deal) => (
          <DealCard key={deal.id} deal={deal} />
        ))}
      </div>
    </div>
  );
}

export function KanbanBoard({ deals }: { deals: Deal[] }) {
  const [items, setItems] = useOptimistic(deals);
  const [, start] = useTransition();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const grouped = useMemo(() => {
    const map = Object.fromEntries(DEAL_STAGES.map((s) => [s.id, [] as Deal[]])) as Record<
      DealStage,
      Deal[]
    >;
    for (const deal of items) {
      map[deal.stage]?.push(deal);
    }
    return map;
  }, [items]);

  function onDragEnd(event: DragEndEvent) {
    const overId = event.over?.id as DealStage | undefined;
    const dealId = String(event.active.id);
    if (!overId || !DEAL_STAGES.some((s) => s.id === overId)) return;
    const current = items.find((d) => d.id === dealId);
    if (!current || current.stage === overId) return;
    start(async () => {
      setItems((prev) => prev.map((d) => (d.id === dealId ? { ...d, stage: overId } : d)));
      await updateDealStage(dealId, overId);
    });
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={onDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4">
        {DEAL_STAGES.map((stage) => (
          <Column
            key={stage.id}
            stage={stage.id}
            label={stage.label}
            deals={grouped[stage.id] ?? []}
          />
        ))}
      </div>
    </DndContext>
  );
}
