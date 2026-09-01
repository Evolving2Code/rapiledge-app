import { createBrowserClient } from "@supabase/ssr";
import { supabasePublishableKey } from "@/lib/constants";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = supabasePublishableKey();
  if (!url || !key) {
    throw new Error("Supabase is not configured.");
  }
  return createBrowserClient(url, key);
}
