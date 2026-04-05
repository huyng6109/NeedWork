import { createClient } from "@/lib/supabase/server";

async function getStats(supabase: Awaited<ReturnType<typeof createClient>>) {
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
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return <p>Không có quyền truy cập</p>;

  const stats = await getStats(supabase);

  const cards = [
    { label: "Tổng người dùng", value: stats?.total_users ?? 0, color: "text-brand-600" },
    { label: "Mới hôm nay", value: stats?.new_users_today ?? 0, color: "text-green-600" },
    { label: "Bài chờ duyệt", value: stats?.pending_posts ?? 0, color: "text-yellow-600" },
    { label: "Report chờ xử lý", value: stats?.pending_reports ?? 0, color: "text-red-600" },
    { label: "Tổng bài đăng", value: stats?.total_posts ?? 0, color: "text-dark" },
    { label: "Tổng ứng tuyển", value: stats?.total_applications ?? 0, color: "text-dark" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {cards.map((card) => (
        <div key={card.label} className="card p-4">
          <div className={`text-3xl font-bold ${card.color}`}>{card.value}</div>
          <div className="text-sm text-muted mt-1">{card.label}</div>
        </div>
      ))}
    </div>
  );
}
