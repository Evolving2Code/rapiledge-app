import { format, formatDistanceToNow, isPast, isToday, parseISO } from "date-fns";

export function fullName(contact: {
  first_name: string;
  last_name: string;
}) {
  return `${contact.first_name} ${contact.last_name}`.trim();
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function money(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: value >= 1000 ? 0 : 2,
  }).format(value || 0);
}

export function when(value: string | null | undefined) {
  if (!value) return "—";
  const date = parseISO(value);
  return formatDistanceToNow(date, { addSuffix: true });
}

export function whenAbsolute(value: string | null | undefined) {
  if (!value) return "—";
  return format(parseISO(value), "MMM d, yyyy");
}

export function whenDatetime(value: string | null | undefined) {
  if (!value) return "—";
  return format(parseISO(value), "MMM d, yyyy · h:mm a");
}

export function dueLabel(value: string | null | undefined) {
  if (!value) return "No due date";
  const date = parseISO(value);
  if (isToday(date)) return "Due today";
  if (isPast(date)) return `Overdue · ${format(date, "MMM d")}`;
  return format(date, "MMM d, yyyy");
}

export function isOverdue(value: string | null | undefined, completed: boolean) {
  if (!value || completed) return false;
  const date = parseISO(value);
  return isPast(date) && !isToday(date);
}
