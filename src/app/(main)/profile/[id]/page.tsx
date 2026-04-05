import { notFound } from "next/navigation";
import { FileText, Mail } from "lucide-react";

import { PostCard } from "@/components/feed/PostCard";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DEMO_POSTS, DEMO_USERS } from "@/lib/demo-data";
import { resolveStorageUrl } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import type { Post, User } from "@/types";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

interface Props {
  params: { id: string };
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

async function getProfileData(id: string): Promise<{
  profile: User | null;
  posts: Post[];
  currentUser: User | null;
}> {
  if (DEMO_MODE) {
    const profile = DEMO_USERS.find((user) => user.id === id) ?? null;
    const posts = DEMO_POSTS.filter((post) => post.author_id === id).slice(0, 10);
    return { profile, posts, currentUser: null };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .single();

  const { data: posts } = await supabase
    .from("posts")
    .select(
      `*, author:users!posts_author_id_fkey(id,name,title,avatar_url,frame_color,role), comment_count:comments(count)`
    )
    .eq("author_id", id)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(10);

  let currentUser: User | null = null;

  if (user) {
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    currentUser = data;
  }

  return { profile, posts: posts ?? [], currentUser };
}

export default async function ProfilePage({ params }: Props) {
  const { profile, posts, currentUser } = await getProfileData(params.id);

  if (!profile) notFound();

  const isOwnProfile = currentUser?.id === profile.id;
  const resolvedCvUrl = resolveStorageUrl(profile.cv_url);
  const normalizedPosts = (posts ?? []).map((post) => ({
    ...post,
    comment_count: Array.isArray(post.comment_count)
      ? post.comment_count?.[0]?.count ?? 0
      : post.comment_count ?? 0,
  }));

  return (
    <div className="space-y-6">
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
              <h1 className="text-xl font-semibold text-dark">
                {profile.name ?? "Chưa đặt tên"}
              </h1>
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
              {isOwnProfile && profile.email ? `${profile.email} · ` : ""}
              Tham gia {formatDate(profile.created_at)}
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
          {isOwnProfile && profile.email ? (
            <a href={`mailto:${profile.email}`}>
              <Button className="gap-2">
                <Mail size={16} />
                Liên hệ
              </Button>
            </a>
          ) : null}
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

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-dark">Bài đăng gần đây</h2>
        {normalizedPosts.length === 0 ? (
          <div className="card p-6 text-center text-sm text-muted">
            Tài khoản này chưa có bài đăng nào hiển thị trên newsfeed.
          </div>
        ) : (
          normalizedPosts.map((post) => (
            <PostCard key={post.id} post={post} currentUser={currentUser} />
          ))
        )}
      </div>
    </div>
  );
}
