import { AppHeader } from "@/components/layout/app-header";
import { PipelineBoard } from "@/components/pipeline/pipeline-board";
import { createClient } from "@/lib/supabase/server";
import type { Deal, Contact } from "@/lib/types";

export default async function PipelinePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: deals } = await supabase
    .from("deals")
    .select("*, contact:contacts(first_name, last_name)")
    .not("stage", "in", '("closed_won","closed_lost")')
    .order("updated_at", { ascending: false });

  return (
    <>
      <AppHeader
        title="Pipeline"
        subtitle="Drag deals to update stages"
        email={user?.email}
      />
      <main className="flex-1 overflow-y-auto p-6">
        <PipelineBoard
          deals={
            (deals ?? []) as (Deal & {
              contact: Pick<Contact, "first_name" | "last_name"> | null;
            })[]
          }
        />
      </main>
    </>
  );
}
