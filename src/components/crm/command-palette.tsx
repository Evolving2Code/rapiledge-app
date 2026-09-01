"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

type SearchResult = {
  contacts: { id: string; name: string; company?: string | null; email?: string | null }[];
  companies: { id: string; name: string }[];
  deals: { id: string; title: string; stage: string }[];
};

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult>({
    contacts: [],
    companies: [],
    deals: [],
  });

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handle = window.setTimeout(async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (res.ok) setResults(await res.json());
    }, 120);
    return () => window.clearTimeout(handle);
  }, [open, query]);

  function go(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-2 text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        <Search className="size-3.5" />
        <span className="hidden sm:inline">Search</span>
        <kbd className="hidden rounded border bg-muted px-1 text-[10px] lg:inline">⌘K</kbd>
      </Button>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search the ledger"
        description="Jump to a contact, company, or deal"
      >
        <Command shouldFilter={false} className="rounded-none bg-transparent p-0">
          <CommandInput
            placeholder="Name, email, company, deal…"
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <CommandEmpty>Nothing matches. The ledger is picky.</CommandEmpty>
            <CommandGroup heading="Contacts">
              {results.contacts.map((contact) => (
                <CommandItem
                  key={contact.id}
                  value={`contact ${contact.name} ${contact.email ?? ""} ${contact.company ?? ""}`}
                  onSelect={() => go(`/contacts/${contact.id}`)}
                >
                  {contact.name}
                  {contact.company ? (
                    <span className="text-muted-foreground"> · {contact.company}</span>
                  ) : null}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading="Companies">
              {results.companies.map((company) => (
                <CommandItem
                  key={company.id}
                  value={`company ${company.name}`}
                  onSelect={() => go(`/companies/${company.id}`)}
                >
                  {company.name}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading="Deals">
              {results.deals.map((deal) => (
                <CommandItem
                  key={deal.id}
                  value={`deal ${deal.title} ${deal.stage}`}
                  onSelect={() => go(`/pipeline/${deal.id}`)}
                >
                  {deal.title}
                  <span className="text-muted-foreground"> · {deal.stage}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
