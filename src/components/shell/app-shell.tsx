"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { CommandPalette } from "@/components/crm/command-palette";
import { AppSidebar } from "@/components/shell/app-sidebar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Wordmark } from "@/components/brand/wordmark";

export function AppShell({
  email,
  children,
}: {
  email?: string | null;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden lg:block">
        <div className="sticky top-0 h-screen">
          <AppSidebar email={email} />
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b px-4 py-3 lg:hidden">
          <Wordmark />
          <div className="flex items-center gap-2">
            <CommandPalette />
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon-sm" aria-label="Open menu">
                  <Menu />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0">
                <AppSidebar email={email} onNavigate={() => setOpen(false)} />
              </SheetContent>
            </Sheet>
          </div>
        </header>
        <header className="hidden items-center justify-end border-b px-8 py-3 lg:flex">
          <CommandPalette />
        </header>
        <main className="flex-1 px-4 py-6 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
