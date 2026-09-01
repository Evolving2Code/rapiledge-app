"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  Calendar,
  Kanban,
  LayoutDashboard,
  Settings,
  SquareCheckBig,
  Users,
} from "lucide-react";
import { Wordmark } from "@/components/brand/wordmark";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/companies", label: "Companies", icon: Building2 },
  { href: "/pipeline", label: "Pipeline", icon: Kanban },
  { href: "/tasks", label: "Tasks", icon: SquareCheckBig },
  { href: "/meetings", label: "Meetings", icon: Calendar },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppSidebar({
  email,
  onNavigate,
}: {
  email?: string | null;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  return (
    <aside className="flex h-full w-60 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="px-5 py-6">
        <Wordmark />
        <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
          Walk in knowing everything.
        </p>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 px-3">
        {NAV.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/70",
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border px-4 py-4 text-xs text-muted-foreground">
        {email ?? "Signed in"}
      </div>
    </aside>
  );
}
