import Link from "next/link";
import { notFound } from "next/navigation";
import { Wallet, Clock, Mail, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { DEMO_POSTS, DEMO_USERS } from "@/lib/demo-data";
import { PinPostButton } from "@/components/post/PinPostButton";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { formatDate, formatSalary } from "@/lib/utils";
import { JOB_TYPE_LABELS } from "@/constants";
import { PostActions } from "./PostActions";
import { CommentSection } from "./CommentSection";
import { BackButton } from "./BackButton";
import type { Post, User } from "@/types";
import { PostContentBody } from "@/components/post/PostContentBody";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

interface Props {
  params: { id: string };
}

export default async function PostDetailPage({ params }: Props) {
  let post: Post | null = null;
  let currentProfile: User | null = null;

  if (DEMO_MODE) {
    post = DEMO_POSTS.find((item) => item.id === params.id) ?? null;
    currentProfile = DEMO_USERS.find((user) => user.id === post?.author_id) ?? null;
  } else {
    const supabase = await createClient();
    const { data } = await supabase
      .from("posts")
      .select(
        `*, author:users!posts_author_id_fkey(id,name,title,avatar_url,frame_color,role,warning_count)`
      )
      .eq("id", params.id)
      .single();
    post = data;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();
      currentProfile = profile;
    }
  }

  if (!post) notFound();

  const isOwner = currentProfile?.id === post.author_id;
  const isJobOffer = post.type === "job_offer";
  const hasSalary = post.salary_min !== null || post.salary_max !== null;

  return (
    <div className="space-y-6">
      <BackButton />

      <div className="card space-y-4 p-5">
        <div className="flex items-center gap-3">
          <Link
            href={`/profile/${post.author_id}`}
            className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            aria-label={`Xem trang cá nhân của ${post.author?.name ?? "người dùng"}`}
          >
            <Avatar
              src={post.author?.avatar_url}
              name={post.author?.name}
              size="lg"
              frameColor={post.author?.frame_color}
              role={post.author?.role}
            />
          </Link>

          <div>
            <Link
              href={`/profile/${post.author_id}`}
              className="font-semibold theme-text transition hover:text-brand-500"
            >
              {post.author?.name ?? "Ẩn danh"}
            </Link>
            {post.author?.title ? (
              <div className="text-sm theme-text-muted">{post.author.title}</div>
            ) : null}
            <div className="text-xs theme-text-muted">{formatDate(post.created_at)}</div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {currentProfile ? <PinPostButton postId={post.id} /> : null}
            <Badge variant={isJobOffer ? "blue" : "gray"}>
              {isJobOffer ? "Tuyển dụng" : "Tìm việc"}
            </Badge>
          </div>
        </div>

        <h1 className="text-xl font-bold theme-text">{post.title}</h1>

        {isJobOffer || hasSalary ? (
          <div className="grid grid-cols-2 gap-2 text-sm theme-text-muted">
            {post.location_name ? (
              <span className="flex items-center gap-1.5">
                <MapPin size={14} className="text-brand-400" />
                {post.location_name}
              </span>
            ) : null}
            {hasSalary ? (
              <span className="flex items-center gap-1.5">
                <Wallet size={14} className="text-brand-400" />
                {formatSalary(post.salary_min, post.salary_max, post.salary_currency)}
              </span>
            ) : null}
            {post.job_type ? (
              <span className="flex items-center gap-1.5">
                <Clock size={14} className="text-brand-400" />
                {JOB_TYPE_LABELS[post.job_type]}
              </span>
            ) : null}
            {post.email ? (
              <span className="flex items-center gap-1.5">
                <Mail size={14} className="text-brand-400" />
                <a
                  href={`mailto:${post.email}`}
                  className="text-brand-500 transition hover:text-brand-600 hover:underline"
                >
                  {post.email}
                </a>
              </span>
            ) : null}
          </div>
        ) : null}

        <PostContentBody content={post.content} />

        <PostActions post={post} currentUser={currentProfile} isOwner={isOwner} />
      </div>

      <CommentSection
        postId={params.id}
        isPostAuthor={isOwner}
        currentUserId={currentProfile?.id}
        currentUserProfile={currentProfile}
      />
    </div>
  );
}
