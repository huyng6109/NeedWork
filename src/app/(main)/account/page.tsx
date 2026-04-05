import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PostCard } from "@/components/feed/PostCard";
import { resolveStorageUrl } from "@/lib/storage";
import { formatDate } from "@/lib/utils";
import { DEMO_POSTS, DEMO_USERS } from "@/lib/demo-data";
import { FileText, Settings } from "lucide-react";
import { AdminAccessPanel } from "./AdminAccessPanel";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

async function getAccountData() {
  if (DEMO_MODE) {
    const profile = DEMO_USERS.find((user) => user.role === "candidate") ?? DEMO_USERS[0];
    const posts = DEMO_POSTS.filter((post) => post.author_id === profile.id).slice(0, 5);
    return { profile, posts };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/account");

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login?redirect=/account");

  const { data: posts } = await supabase
    .from("posts")
    .select(
      `*, author:users!posts_author_id_fkey(id,name,title,avatar_url,frame_color,role), comment_count:comments(count)`
    )
    .eq("author_id", user.id)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(5);

  return { profile, posts: posts ?? [] };
}

function StatCard({
  value,
  label,
}: {
  value: string | number;
  label: string;
}) {
  return (
    <div className="rounded-xl border border-border p-4 theme-surface">
      <div className="text-2xl font-bold text-dark">{value}</div>
      <div className="mt-1 text-xs text-muted">{label}</div>
    </div>
  );
}

export default async function AccountPage() {
  const { profile, posts } = await getAccountData();
  const resolvedCvUrl = resolveStorageUrl(profile.cv_url);

  const normalizedPosts = (posts ?? []).map((post) => ({
    ...post,
    comment_count: Array.isArray(post.comment_count)
      ? post.comment_count?.[0]?.count ?? 0
      : post.comment_count ?? 0,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-dark">Tài khoản</h1>
          <p className="mt-1 text-sm text-muted">
            Quản lý hồ sơ và thông tin hiển thị của bạn.
          </p>
        </div>
        <Link href="/profile/edit">
          <Button variant="outline" className="gap-2">
            <Settings size={16} />
            Chỉnh sửa
          </Button>
        </Link>
      </div>

      {DEMO_MODE ? (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200">
          Demo mode đang bật. Bạn có thể test trang cá nhân bằng dữ liệu mẫu mà không cần đăng nhập thật.
        </div>
      ) : null}

      <div className="card space-y-5 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Avatar
            src={profile.avatar_url}
            name={profile.name}
            size="xl"
            frameColor={profile.frame_color}
            role={profile.role}
          />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold text-dark">
                {profile.name ?? "Chưa đặt tên"}
              </h2>
              <Badge
                variant={
                  profile.role === "recruiter"
                    ? "blue"
                    : profile.role === "admin"
                      ? "warning"
                      : "gray"
                }
              >
                {profile.role === "recruiter"
                  ? "Nhà tuyển dụng"
                  : profile.role === "admin"
                    ? "Admin"
                    : "Ứng viên"}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted">
              {profile.title ?? "Chưa có mô tả ngắn"}
            </p>
            <p className="mt-2 text-xs text-muted">
              {profile.email} · Tham gia {formatDate(profile.created_at)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard value={normalizedPosts.length} label="Bài đăng hiển thị" />
          <StatCard value={profile.warning_count} label="Cảnh báo" />
          <StatCard value={profile.warning_count === 0 ? "On" : "Off"} label="Trust frame" />
          <StatCard
            value={
              profile.role === "recruiter"
                ? "HR"
                : profile.role === "admin"
                  ? "ADMIN"
                  : "CV"
            }
            label="Chế độ tài khoản"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href={`/profile/${profile.id}`}>
            <Button>Trang cá nhân công khai</Button>
          </Link>
          {resolvedCvUrl ? (
            <a href={resolvedCvUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="gap-2">
                <FileText size={16} />
                Xem CV
              </Button>
            </a>
          ) : null}
        </div>
      </div>

      <AdminAccessPanel role={profile.role} />

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-dark">Bài đăng gần đây</h2>
        {normalizedPosts.length === 0 ? (
          <div className="card p-6 text-center text-sm text-muted">
            Bạn chưa có bài đăng nào đã được hiển thị trên newsfeed.
          </div>
        ) : (
          normalizedPosts.map((post) => (
            <PostCard key={post.id} post={post} currentUser={profile} />
          ))
        )}
      </div>
    </div>
  );
}
