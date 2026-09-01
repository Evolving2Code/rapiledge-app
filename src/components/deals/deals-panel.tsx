import Link from "next/link";
import { formatCurrency, type Deal, DEAL_STAGES } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface DealsPanelProps {
  contactId: string;
  deals: Deal[];
}

export function DealsPanel({ contactId, deals }: DealsPanelProps) {
  const activeDeals = deals.filter(
    (d) => !["closed_won", "closed_lost"].includes(d.stage)
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Deals</h3>
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/pipeline?contact=${contactId}`}>
            <Plus className="h-3 w-3" />
          </Link>
        </Button>
      </div>

      <div className="space-y-2">
        {activeDeals.map((deal) => {
          const stage = DEAL_STAGES.find((s) => s.id === deal.stage);
          return (
            <div
              key={deal.id}
              className="rounded-lg border border-border/40 p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium">{deal.title}</p>
                <Badge variant="outline" className={stage?.color}>
                  {stage?.label}
                </Badge>
              </div>
              <p className="mt-1 text-lg font-semibold text-primary">
                {formatCurrency(Number(deal.value))}
              </p>
              {deal.expected_close_date && (
                <p className="text-xs text-muted-foreground">
                  Close:{" "}
                  {new Date(deal.expected_close_date).toLocaleDateString()}
                </p>
              )}
            </div>
          );
        })}
        {activeDeals.length === 0 && (
          <p className="text-xs text-muted-foreground">No active deals</p>
        )}
      </div>
    </div>
  );
}
