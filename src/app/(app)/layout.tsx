import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { isSupabaseConfigured } from "@/lib/constants";
import { requireUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }
  const { claims } = await requireUser();
  const email =
    (claims?.email as string | undefined) ??
    (claims?.user_metadata as { email?: string } | undefined)?.email;
  return <AppShell email={email}>{children}</AppShell>;
}
