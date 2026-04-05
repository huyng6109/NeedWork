import { DEMO_APPLICATIONS, DEMO_POSTS, DEMO_REPORTS, DEMO_USERS } from "@/lib/demo-data";
import { createClient } from "@/lib/supabase/server";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

async function getStats(supabase: Awaited<ReturnType<typeof createClient>>) {
  if (DEMO_MODE) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return {
      total_users: DEMO_USERS.length,
      new_users_today: DEMO_USERS.filter(
        (user) => new Date(user.created_at).getTime() >= today.getTime()
      ).length,
      pending_posts: DEMO_POSTS.filter((post) => post.status === "pending").length,
      pending_reports: DEMO_REPORTS.filter((report) => report.status === "pending").length,
      total_posts: DEMO_POSTS.length,
      total_applications: DEMO_APPLICATIONS.length,
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [users, newUsers, pendingPosts, pendingReports, totalPosts, totalApps] =
    await Promise.all([
      supabase.from("users").select("id", { count: "exact", head: true }),
      supabase
        .from("users")
        .select("id", { count: "exact", head: true })
        .gte("created_at", today.toISOString()),
      supabase.from("posts").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase
        .from("reports")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase.from("posts").select("id", { count: "exact", head: true }),
      supabase.from("applications").select("id", { count: "exact", head: true }),
    ]);

  return {
    total_users: users.count ?? 0,
    new_users_today: newUsers.count ?? 0,
    pending_posts: pendingPosts.count ?? 0,
    pending_reports: pendingReports.count ?? 0,
    total_posts: totalPosts.count ?? 0,
    total_applications: totalApps.count ?? 0,
  };
}

export default async function AdminDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!DEMO_MODE && !user) return <p>Khong co quyen truy cap</p>;

  const stats = await getStats(supabase);

  const cards = [
    { label: "Tong nguoi dung", value: stats.total_users, color: "text-brand-600" },
    { label: "Moi hom nay", value: stats.new_users_today, color: "text-green-600" },
    { label: "Bai cho duyet", value: stats.pending_posts, color: "text-yellow-600" },
    { label: "Report cho xu ly", value: stats.pending_reports, color: "text-red-600" },
    { label: "Tong bai dang", value: stats.total_posts, color: "text-dark" },
    { label: "Tong ung tuyen", value: stats.total_applications, color: "text-dark" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {cards.map((card) => (
        <div key={card.label} className="card p-4">
          <div className={`text-3xl font-bold ${card.color}`}>{card.value}</div>
          <div className="mt-1 text-sm text-muted">{card.label}</div>
        </div>
      ))}
    </div>
  );
}
