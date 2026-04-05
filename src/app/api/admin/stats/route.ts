import { NextResponse } from "next/server";
import { assertAdminUser } from "@/lib/auth/admin-server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  if (!await assertAdminUser(supabase)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [users, newUsers, pendingPosts, pendingReports, totalPosts, totalApps] =
    await Promise.all([
      supabase.from("users").select("id", { count: "exact", head: true }),
      supabase.from("users").select("id", { count: "exact", head: true }).gte("created_at", today.toISOString()),
      supabase.from("posts").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("reports").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("posts").select("id", { count: "exact", head: true }),
      supabase.from("applications").select("id", { count: "exact", head: true }),
    ]);

  return NextResponse.json({
    total_users: users.count ?? 0,
    new_users_today: newUsers.count ?? 0,
    pending_posts: pendingPosts.count ?? 0,
    pending_reports: pendingReports.count ?? 0,
    total_posts: totalPosts.count ?? 0,
    total_applications: totalApps.count ?? 0,
  });
}
