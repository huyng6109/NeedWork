"use client";

import { useState } from "react";
import { Briefcase, Mail, MapPin } from "lucide-react";
import toast from "react-hot-toast";

import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { JOB_TYPE_LABELS } from "@/constants";
import { getFirstPostContentImage, getPostContentPreview } from "@/lib/post-content";
import { resolveStorageUrl } from "@/lib/storage";
import { formatRelativeTime, formatSalary } from "@/lib/utils";
import type { Post } from "@/types";

interface Props {
  initialPosts: Post[];
}

export function PostModerationList({ initialPosts }: Props) {
  const [posts, setPosts] = useState(initialPosts);
  const [loading, setLoading] = useState<Record<string, "approved" | "rejected">>({});

  async function moderate(postId: string, status: "approved" | "rejected") {
    setLoading((current) => ({ ...current, [postId]: status }));

    const response = await fetch(`/api/admin/posts/${postId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    setLoading((current) => {
      const next = { ...current };
      delete next[postId];
      return next;
    });

    if (!response.ok) {
      toast.error("Thao tác thất bại");
      return;
    }

    setPosts((items) => items.filter((post) => post.id !== postId));
    toast.success(status === "approved" ? "Đã duyệt bài" : "Đã từ chối bài");
  }

  if (!posts.length) {
    return <p className="py-12 text-center text-muted">Không có bài nào chờ duyệt</p>;
  }

  return (
    <div className="space-y-3">
      {posts.map((post) => {
        const previewImage = getFirstPostContentImage(post.content);
        const resolvedPreviewImage = resolveStorageUrl(previewImage);
        const hasSalary = post.salary_min !== null || post.salary_max !== null;

        return (
          <div key={post.id} className="card space-y-3 p-4">
            <div className="flex items-center gap-3">
              <Avatar
                src={post.author?.avatar_url}
                name={post.author?.name}
                size="sm"
                frameColor={post.author?.frame_color}
                role={post.author?.role}
              />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-dark">{post.author?.name}</div>
                <div className="text-xs text-muted">{formatRelativeTime(post.created_at)}</div>
              </div>
              <Badge variant="pending">Chờ duyệt</Badge>
            </div>

            <h3 className="font-semibold text-dark">{post.title}</h3>

            <div className="space-y-2 text-xs text-muted">
              {post.location_name ? (
                <div className="flex items-start gap-1.5">
                  <MapPin size={11} className="mt-0.5 shrink-0" />
                  <span>{post.location_name}</span>
                </div>
              ) : null}

              {hasSalary || post.job_type || post.email ? (
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  {hasSalary ? (
                    <span className="flex items-center gap-1">
                      <Briefcase size={11} />
                      {formatSalary(post.salary_min, post.salary_max, post.salary_currency)}
                    </span>
                  ) : null}
                  {post.email ? (
                    <span className="flex items-center gap-1">
                      <Mail size={11} />
                      {post.email}
                    </span>
                  ) : null}
                  {post.job_type ? <Badge variant="gray">{JOB_TYPE_LABELS[post.job_type]}</Badge> : null}
                </div>
              ) : null}
            </div>

            <p className="line-clamp-5 whitespace-pre-line text-sm text-muted">
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

            <div className="flex gap-2 border-t border-border pt-2">
              <Button
                size="sm"
                loading={loading[post.id] === "approved"}
                onClick={() => moderate(post.id, "approved")}
              >
                Duyệt
              </Button>
              <Button
                size="sm"
                variant="danger"
                loading={loading[post.id] === "rejected"}
                onClick={() => moderate(post.id, "rejected")}
              >
                Từ chối
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
