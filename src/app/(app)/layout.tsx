import { AppSidebar } from "@/components/layout/app-sidebar";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        {children}
      </div>
      {/* Pass user email via context would be cleaner; for now header fetches client-side */}
      <span className="hidden" data-user-email={user?.email} />
    </div>
  );
}
