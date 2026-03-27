import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { PostCard } from "@/components/feed/PostCard";
import { formatDate } from "@/lib/utils";
import { FileText, AlertTriangle, Link as LinkIcon } from "lucide-react";

interface Props {
  params: { id: string };
}

export default async function ProfilePage({ params }: Props) {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!profile) notFound();

  const { data: posts } = await supabase
    .from("posts")
    .select(`*, author:users!posts_author_id_fkey(id,name,title,avatar_url,frame_color), comment_count:comments(count)`)
    .eq("author_id", params.id)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(10);

  const normalizedPosts = (posts ?? []).map((p) => ({
    ...p,
    comment_count: p.comment_count?.[0]?.count ?? 0,
  }));

  return (
    <div className="space-y-6">
      {/* Profile header */}
      <div className="card p-6">
        <div className="flex items-start gap-4">
          <Avatar
            src={profile.avatar_url}
            name={profile.name}
            size="xl"
            frameColor={profile.frame_color}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-dark">{profile.name ?? "Chưa đặt tên"}</h1>
              {profile.frame_color === "blue" && (
                <Badge variant="blue">Nhà tuyển dụng uy tín</Badge>
              )}
              {profile.role === "recruiter" && profile.frame_color === null && (
                <Badge variant="warning">Đang bị đánh giá lại</Badge>
              )}
            </div>
            {profile.title && (
              <p className="text-muted mt-0.5">{profile.title}</p>
            )}
            <p className="text-xs text-muted mt-1">
              Tham gia {formatDate(profile.created_at)}
            </p>

            {profile.warning_count > 0 && (
              <div className="flex items-center gap-1 mt-2 text-orange-600 text-xs">
                <AlertTriangle size={12} />
                {profile.warning_count} lần bị cảnh báo
              </div>
            )}

            {profile.cv_url && (
              <a
                href={profile.cv_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-3 text-sm text-brand-600 hover:underline"
              >
                <FileText size={14} />
                Xem CV
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-3">
        <h2 className="font-semibold text-dark">
          Bài đăng ({normalizedPosts.length})
        </h2>
        {normalizedPosts.length === 0 ? (
          <p className="text-muted text-sm text-center py-8">Chưa có bài đăng nào</p>
        ) : (
          normalizedPosts.map((post) => <PostCard key={post.id} post={post} />)
        )}
      </div>
    </div>
  );
}
