"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Clock, MapPin, Wallet } from "lucide-react";

import { PinPostButton } from "@/components/post/PinPostButton";
import { usePinnedPosts } from "@/components/post/PinnedPostsProvider";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { JOB_TYPE_LABELS, PINNED_POST_LIMIT } from "@/constants";
import { getPostContentPreview } from "@/lib/post-content";
import { formatRelativeTime, formatSalary } from "@/lib/utils";
import type { Post } from "@/types";

interface PinnedPostsResponse {
  posts?: Post[];
}

function PinOutlineIcon() {
  return (
    <svg
      className="h-6 w-6"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M9 4.75h6l-.65 4.56 2.4 2.69v1H7.25v-1l2.4-2.69L9 4.75Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 13v6.25"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PinnedPostCompactCard({
  onClose,
  onRemoved,
  post,
}: {
  onClose: () => void;
  onRemoved: (postId: string) => void;
  post: Post;
}) {
  const isJobOffer = post.type === "job_offer";
  const hasSalary = post.salary_min !== null || post.salary_max !== null;

  return (
    <div className="rounded-2xl border border-border bg-black/25 p-3">
      <div className="flex items-start gap-3">
        <Link href={`/profile/${post.author_id}`} onClick={onClose} className="shrink-0">
          <Avatar
            src={post.author?.avatar_url}
            name={post.author?.name}
            size="sm"
            frameColor={post.author?.frame_color}
            role={post.author?.role}
          />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <Link
                href={`/post/${post.id}`}
                onClick={onClose}
                className="line-clamp-1 text-sm font-semibold text-dark transition hover:text-brand-400"
              >
                {post.title}
              </Link>
              <div className="mt-0.5 line-clamp-1 text-xs text-muted">
                {post.author?.name ?? "Ẩn danh"} · {formatRelativeTime(post.created_at)}
              </div>
            </div>

            <PinPostButton
              postId={post.id}
              onPinnedChange={(pinned) => {
                if (!pinned) {
                  onRemoved(post.id);
                }
              }}
            />
          </div>

          <p className="mt-2 line-clamp-3 whitespace-pre-line text-xs leading-5 text-muted">
            {getPostContentPreview(post.content)}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-muted">
            <Badge variant={isJobOffer ? "blue" : "gray"}>
              {isJobOffer ? "Tuyển dụng" : "Tìm việc"}
            </Badge>

            {post.location_name ? (
              <span className="inline-flex max-w-full items-center gap-1 truncate">
                <MapPin size={11} />
                <span className="truncate">{post.location_name}</span>
              </span>
            ) : null}

            {hasSalary ? (
              <span className="inline-flex items-center gap-1">
                <Wallet size={11} />
                {formatSalary(post.salary_min, post.salary_max, post.salary_currency)}
              </span>
            ) : null}

            {post.job_type ? (
              <span className="inline-flex items-center gap-1">
                <Clock size={11} />
                {JOB_TYPE_LABELS[post.job_type]}
              </span>
            ) : null}
          </div>

          <div className="mt-3 flex justify-end">
            <Link href={`/post/${post.id}`} onClick={onClose}>
              <Button size="sm">Xem bài viết</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PinnedPostsQuickButton() {
  const { count } = usePinnedPosts();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadPinnedPosts() {
      if (!open) {
        return;
      }

      setLoading(true);

      try {
        const response = await fetch("/api/pinned-posts", {
          cache: "no-store",
        });

        if (!response.ok) {
          if (!cancelled) {
            setPosts([]);
          }
          return;
        }

        const payload = (await response.json()) as PinnedPostsResponse | null;

        if (!cancelled) {
          setPosts(Array.isArray(payload?.posts) ? payload.posts : []);
        }
      } catch {
        if (!cancelled) {
          setPosts([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadPinnedPosts();

    return () => {
      cancelled = true;
    };
  }, [count, open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-40 right-6 z-30 inline-flex h-14 w-14 items-center justify-center rounded-full border border-border bg-white text-dark shadow-card transition-transform transition-shadow hover:-translate-y-0.5 hover:shadow-card-hover md:right-8"
        aria-label="Bài viết đã ghim"
        title="Bài viết đã ghim"
      >
        <PinOutlineIcon />
        {count > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-w-6 items-center justify-center rounded-full bg-brand-500 px-1.5 py-0.5 text-[11px] font-semibold text-white">
            {count}
          </span>
        ) : null}
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Bài viết đã ghim"
        overlayClassName="items-end justify-end px-4 pb-24 pt-4 md:px-8 md:pb-8"
        className="mx-0 w-full max-w-sm rounded-[28px] p-4"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Ghim tối đa {PINNED_POST_LIMIT} bài viết để mở lại nhanh ngay trên màn hình này.
          </p>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: Math.max(count, 1) }).map((_, index) => (
                <div
                  key={index}
                  className="h-36 animate-pulse rounded-2xl border border-border bg-white/5"
                />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted">
              Chưa có bài viết nào được ghim.
            </div>
          ) : (
            <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
              {posts.map((post) => (
                <PinnedPostCompactCard
                  key={post.id}
                  post={post}
                  onClose={() => setOpen(false)}
                  onRemoved={(postId) => {
                    setPosts((current) => current.filter((item) => item.id !== postId));
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
