import Link from "next/link";
import { Clock, MapPin, MessageCircle, Wallet } from "lucide-react";

import { ApplyPostButton } from "@/components/post/ApplyPostButton";
import { PinPostButton } from "@/components/post/PinPostButton";
import { ReportPostButton } from "@/components/post/ReportPostButton";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { JOB_TYPE_LABELS } from "@/constants";
import { getFirstPostContentImage, getPostContentPreview } from "@/lib/post-content";
import { resolveStorageUrl } from "@/lib/storage";
import { formatRelativeTime, formatSalary } from "@/lib/utils";
import type { Post, User } from "@/types";

interface PostCardProps {
  post: Post;
  currentUser?: User | null;
  onPinChange?: (postId: string, pinned: boolean) => void;
}

export function PostCard({ post, currentUser, onPinChange }: PostCardProps) {
  const isJobOffer = post.type === "job_offer";
  const hasSalary = post.salary_min !== null || post.salary_max !== null;
  const previewImage = getFirstPostContentImage(post.content);
  const resolvedPreviewImage = resolveStorageUrl(previewImage);

  return (
    <article className="card space-y-3 p-4 transition-shadow hover:shadow-card-hover">
      <div className="flex items-center gap-3">
        <Link
          href={`/profile/${post.author_id}`}
          className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          aria-label={`Xem trang cá nhân của ${post.author?.name ?? "người dùng"}`}
        >
          <Avatar
            src={post.author?.avatar_url}
            name={post.author?.name}
            size="md"
            frameColor={post.author?.frame_color}
            role={post.author?.role}
          />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Link
              href={`/profile/${post.author_id}`}
              className="truncate text-sm font-medium theme-text transition hover:text-brand-500"
            >
              {post.author?.name ?? "Ẩn danh"}
            </Link>
            {post.author?.title ? (
              <span className="hidden truncate text-xs theme-text-muted sm:block">
                · {post.author.title}
              </span>
            ) : null}
          </div>
          <span className="text-xs theme-text-muted">{formatRelativeTime(post.created_at)}</span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {currentUser ? (
            <PinPostButton
              postId={post.id}
              onPinnedChange={(pinned) => onPinChange?.(post.id, pinned)}
            />
          ) : null}
          <Badge variant={isJobOffer ? "blue" : "gray"}>
            {isJobOffer ? "Tuyển dụng" : "Tìm việc"}
          </Badge>
          {isJobOffer ? <ReportPostButton postId={post.id} mode="icon" /> : null}
        </div>
      </div>

      <Link href={`/post/${post.id}`} className="block space-y-3">
        <h2 className="font-semibold leading-snug theme-text">{post.title}</h2>

        {isJobOffer || hasSalary ? (
          <div className="space-y-2 text-xs theme-text-muted">
            {post.location_name ? (
              <div className="flex items-start gap-1.5">
                <MapPin size={12} className="mt-0.5 shrink-0" />
                <span>{post.location_name}</span>
              </div>
            ) : null}

            {hasSalary || post.job_type ? (
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {hasSalary ? (
                  <span className="flex items-center gap-1">
                    <Wallet size={12} />
                    {formatSalary(post.salary_min, post.salary_max, post.salary_currency)}
                  </span>
                ) : null}
                {post.job_type ? (
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {JOB_TYPE_LABELS[post.job_type]}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

        <p className="line-clamp-5 whitespace-pre-line text-sm theme-text-secondary">
          {getPostContentPreview(post.content)}
        </p>

        {previewImage ? (
          <figure className="overflow-hidden rounded-2xl border border-border bg-[var(--card-bg)]">
            <img
              src={resolvedPreviewImage ?? previewImage}
              alt={post.title}
              className="block max-h-80 w-full object-cover"
              loading="lazy"
            />
          </figure>
        ) : null}
      </Link>

      <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
        <div className="flex items-center gap-1 text-xs theme-text-muted">
          <MessageCircle size={12} />
          <span>{post.comment_count ?? 0} bình luận</span>
        </div>

        {isJobOffer ? <ApplyPostButton postId={post.id} size="sm" className="shrink-0" /> : null}
      </div>
    </article>
  );
}
