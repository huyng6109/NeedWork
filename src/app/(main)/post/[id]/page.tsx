import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { DEMO_POSTS } from "@/lib/demo-data";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { formatDate, formatSalary } from "@/lib/utils";
import { JOB_TYPE_LABELS } from "@/constants";
import { MapPin, Briefcase, Clock, Mail } from "lucide-react";
import { PostActions } from "./PostActions";
import { CommentSection } from "./CommentSection";

interface Props {
  params: { id: string };
}

export default async function PostDetailPage({ params }: Props) {
  let post = null;
  let currentProfile = null;

  if (DEMO_MODE) {
    post = DEMO_POSTS.find((p) => p.id === params.id) ?? null;
  } else {
    const supabase = await createClient();
    const { data } = await supabase
      .from("posts")
      .select(`*, author:users!posts_author_id_fkey(id,name,title,avatar_url,frame_color,warning_count)`)
      .eq("id", params.id)
      .single();
    post = data;
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: p } = await supabase.from("users").select("*").eq("id", user.id).single();
      currentProfile = p;
    }
  }

  if (!post) notFound();

  const isOwner = false;
  const isJobOffer = post.type === "job_offer";

  return (
    <div className="space-y-6">
      {/* Post card */}
      <div className="card p-5 space-y-4">
        {/* Author */}
        <div className="flex items-center gap-3">
          <Avatar
            src={post.author?.avatar_url}
            name={post.author?.name}
            size="lg"
            frameColor={post.author?.frame_color}
          />
          <div>
            <div className="font-semibold text-dark">{post.author?.name ?? "Ẩn danh"}</div>
            {post.author?.title && (
              <div className="text-sm text-muted">{post.author.title}</div>
            )}
            <div className="text-xs text-muted">{formatDate(post.created_at)}</div>
          </div>
          <div className="ml-auto">
            <Badge variant={isJobOffer ? "blue" : "gray"}>
              {isJobOffer ? "Tuyển dụng" : "Tìm việc"}
            </Badge>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-xl font-bold text-dark">{post.title}</h1>

        {/* Meta (job_offer only) */}
        {isJobOffer && (
          <div className="grid grid-cols-2 gap-2 text-sm text-muted">
            {post.location_name && (
              <span className="flex items-center gap-1.5">
                <MapPin size={14} className="text-brand-500" />
                {post.location_name}
              </span>
            )}
            {(post.salary_min || post.salary_max) && (
              <span className="flex items-center gap-1.5">
                <Briefcase size={14} className="text-brand-500" />
                {formatSalary(post.salary_min, post.salary_max)}
              </span>
            )}
            {post.job_type && (
              <span className="flex items-center gap-1.5">
                <Clock size={14} className="text-brand-500" />
                {JOB_TYPE_LABELS[post.job_type]}
              </span>
            )}
            {post.email && (
              <span className="flex items-center gap-1.5">
                <Mail size={14} className="text-brand-500" />
                <a href={`mailto:${post.email}`} className="text-brand-600 hover:underline">
                  {post.email}
                </a>
              </span>
            )}
          </div>
        )}

        {/* Content */}
        <div className="text-sm text-dark whitespace-pre-wrap leading-relaxed">
          {post.content}
        </div>

        {/* Actions (Apply, Report) */}
        <PostActions
          post={post}
          currentUser={currentProfile}
          isOwner={isOwner}
        />
      </div>

      {/* Comments */}
      <CommentSection
        postId={params.id}
        isPostAuthor={isOwner}
        currentUserId={undefined}
        currentUserProfile={currentProfile}
      />
    </div>
  );
}
