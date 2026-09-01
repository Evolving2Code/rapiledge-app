import Link from "next/link";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Wordmark({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-baseline gap-0.5", className)}>
      <span className="font-heading text-xl tracking-tight">Rapi</span>
      <span className="font-heading text-xl italic tracking-tight text-primary">
        Ledge
      </span>
      <span className="sr-only">{APP_NAME}</span>
    </Link>
  );
}
