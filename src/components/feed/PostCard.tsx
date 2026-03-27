import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { MapPin, Briefcase, Clock, MessageCircle } from "lucide-react";
import { formatRelativeTime, formatSalary } from "@/lib/utils";
import { JOB_TYPE_LABELS } from "@/constants";
import type { Post } from "@/types";

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const isJobOffer = post.type === "job_offer";

  return (
    <Link href={`/post/${post.id}`}>
      <article className="card p-4 hover:shadow-card-hover transition-shadow cursor-pointer space-y-3">
        {/* Author row */}
        <div className="flex items-center gap-3">
          <Avatar
            src={post.author?.avatar_url}
            name={post.author?.name}
            size="md"
            frameColor={post.author?.frame_color}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-dark text-sm truncate">
                {post.author?.name ?? "Ẩn danh"}
              </span>
              {post.author?.title && (
                <span className="text-xs text-muted truncate hidden sm:block">
                  · {post.author.title}
                </span>
              )}
            </div>
            <span className="text-xs text-muted">
              {formatRelativeTime(post.created_at)}
            </span>
          </div>
          <Badge variant={isJobOffer ? "blue" : "gray"}>
            {isJobOffer ? "Tuyển dụng" : "Tìm việc"}
          </Badge>
        </div>

        {/* Title */}
        <h2 className="font-semibold text-dark leading-snug">{post.title}</h2>

        {/* Content preview */}
        <p className="text-sm text-muted line-clamp-2">{post.content}</p>

        {/* Meta row */}
        {isJobOffer && (
          <div className="flex flex-wrap gap-2 text-xs text-muted">
            {post.location_name && (
              <span className="flex items-center gap-1">
                <MapPin size={12} />
                {post.location_name}
              </span>
            )}
            {(post.salary_min || post.salary_max) && (
              <span className="flex items-center gap-1">
                <Briefcase size={12} />
                {formatSalary(post.salary_min, post.salary_max)}
              </span>
            )}
            {post.job_type && (
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {JOB_TYPE_LABELS[post.job_type]}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center gap-1 text-xs text-muted pt-1 border-t border-border">
          <MessageCircle size={12} />
          <span>{post.comment_count ?? 0} bình luận</span>
        </div>
      </article>
    </Link>
  );
}
