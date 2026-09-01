import Link from "next/link";
import { format } from "date-fns";
import { Mail, Phone, Building2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { contactDisplayName, type Contact, type Company } from "@/lib/types";

interface ContactCardProps {
  contact: Contact & { company?: Company | null };
}

export function ContactCard({ contact }: ContactCardProps) {
  const name = contactDisplayName(contact);
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Link
      href={`/contacts/${contact.id}`}
      className="glass-card group block rounded-xl p-4 transition-all hover:border-primary/30 hover:shadow-primary/5"
    >
      <div className="flex items-start gap-4">
        <Avatar className="h-12 w-12 border border-border/60">
          <AvatarFallback className="bg-primary/10 text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold group-hover:text-primary transition-colors">
            {name}
          </h3>
          {contact.title && (
            <p className="text-sm text-muted-foreground">{contact.title}</p>
          )}
          {contact.company && (
            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <Building2 className="h-3 w-3" />
              {contact.company.name}
            </p>
          )}
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
            {contact.email && (
              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {contact.email}
              </span>
            )}
            {contact.phone && (
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {contact.phone}
              </span>
            )}
          </div>
          {contact.tags?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {contact.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          {contact.last_contact_at && (
            <p className="mt-2 text-xs text-muted-foreground/70">
              Last contact {format(new Date(contact.last_contact_at), "MMM d, yyyy")}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
