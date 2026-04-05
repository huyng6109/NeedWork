import { createClient } from "@/lib/supabase/server";
import { isStrictAdmin } from "./admin";

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

export async function assertAdminUser(supabase: ServerSupabaseClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role, username")
    .eq("id", user.id)
    .maybeSingle();

  return isStrictAdmin(profile) ? user : null;
}
