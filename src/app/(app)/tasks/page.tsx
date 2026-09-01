import { createClient } from "@/lib/supabase/server";
import { TasksPageClient } from "@/components/tasks/tasks-page";
import type { Contact, Task } from "@/lib/types";

export default async function TasksPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*, contact:contacts(id, first_name, last_name)")
    .order("completed", { ascending: true })
    .order("due_date", { ascending: true });

  return (
    <TasksPageClient
      tasks={
        (tasks ?? []) as (Task & {
          contact: Pick<Contact, "first_name" | "last_name" | "id"> | null;
        })[]
      }
      email={user?.email}
    />
  );
}
