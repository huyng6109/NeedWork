import { createClient } from "@/lib/supabase/server";

async function getStats() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/admin/stats`,
    { cache: "no-store" }
  );
  if (!res.ok) return null;
  return res.json();
}

export default async function AdminDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return <p>Không có quyền truy cập</p>;

  const stats = await getStats();

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
