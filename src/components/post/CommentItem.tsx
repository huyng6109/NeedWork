"use client";

import Link from "next/link";
import { useState } from "react";
import { FileText } from "lucide-react";
import toast from "react-hot-toast";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import { resolveStorageUrl } from "@/lib/storage";
import { formatRelativeTime } from "@/lib/utils";
import type { Comment, User } from "@/types";

interface CommentItemProps {
  comment: Comment;
  postId: string;
  isPostAuthor: boolean;
  currentUserId?: string;
  currentUserProfile: User | null;
  replyCount?: number;
  onReplyCreated: (comment: Comment) => void;
}

function ReplyBubbleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6.25 6.25h11.5a2 2 0 0 1 2 2v7.5a2 2 0 0 1-2 2H10l-3.75 2.5V17.75a2 2 0 0 1-2-2v-7.5a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CommentItem({
  comment,
  postId,
  isPostAuthor,
  currentUserId,
  currentUserProfile,
  replyCount = 0,
  onReplyCreated,
}: CommentItemProps) {
  const [status, setStatus] = useState(comment.status);
  const [loading, setLoading] = useState<"approved" | "rejected" | null>(null);
  const [pendingStatus, setPendingStatus] = useState<"approved" | "rejected" | null>(null);
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);

  const isApplied = comment.type === "applied";
  const canRespondStatus = isPostAuthor && isApplied && status === null;
  const resolvedCvUrl = resolveStorageUrl(comment.application_cv_url);
  const canViewCv = isPostAuthor && isApplied && Boolean(resolvedCvUrl);
  const canReply = Boolean(currentUserProfile);
  const replyLabel = replyCount > 0 ? `${replyCount} trả lời` : "Trả lời";
  const confirmationTitle =
    pendingStatus === "approved" ? "Xác nhận duyệt CV" : "Xác nhận từ chối CV";
  const confirmationMessage =
    pendingStatus === "approved"
      ? "Bạn đã chắc chắn đọc CV của ứng viên"
      : "Hãy chắc chắn CV của ứng viên chưa phù hợp với công việc hiện tại.";

  function respond(newStatus: "approved" | "rejected") {
    setPendingStatus(newStatus);
  }

  async function confirmRespond() {
    if (!pendingStatus) {
      return;
    }

    const nextStatus = pendingStatus;
    setLoading(nextStatus);

    const res = await fetch(`/api/comments/${comment.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    setLoading(null);

    if (!res.ok) {
      let message = "Phản hồi thất bại";

      try {
        const json = await res.json();
        if (typeof json?.error === "string" && json.error.trim()) {
          message = json.error;
        }
      } catch {
        // Keep the fallback message.
      }

      toast.error(message);
      return;
    }

    setPendingStatus(null);
    setStatus(nextStatus);
    toast.success(nextStatus === "approved" ? "Đã duyệt" : "Đã từ chối");
  }

  async function handleReply() {
    const normalizedReply = replyText.trim();
    if (!normalizedReply) return;

    setReplyLoading(true);
    const res = await fetch(`/api/posts/${postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: normalizedReply,
        replyToCommentId: comment.id,
        replyToAuthorName: comment.author?.name ?? null,
      }),
    });
    setReplyLoading(false);

    if (!res.ok) {
      toast.error("Gửi trả lời thất bại");
      return;
    }

    const newComment = await res.json();
    onReplyCreated(newComment);
    setReplyText("");
    setIsReplying(false);
    toast.success("Đã gửi trả lời");
  }

  return (
    <>
      <div className="flex gap-3">
        <Link
          href={`/profile/${comment.author_id}`}
          className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          aria-label={`Xem trang cá nhân của ${comment.author?.name ?? "người dùng"}`}
        >
          <Avatar
            src={comment.author?.avatar_url}
            name={comment.author?.name}
            size="sm"
            frameColor={comment.author?.frame_color}
            role={comment.author?.role}
          />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <Link
              href={`/profile/${comment.author_id}`}
              className="text-sm font-medium theme-text transition hover:text-brand-500"
            >
              {comment.author?.name ?? "Ẩn danh"}
            </Link>
            {isApplied && comment.has_applied ? (
              <Badge variant="applied">Đã nộp CV</Badge>
            ) : null}
            {status === "approved" ? <Badge variant="approved">Đã duyệt</Badge> : null}
            {status === "rejected" ? <Badge variant="rejected">Từ chối</Badge> : null}
            <span className="text-xs theme-text-muted">
              {formatRelativeTime(comment.created_at)}
            </span>
          </div>

          <p className="text-sm theme-text-secondary">{comment.content}</p>

          {(canRespondStatus || canViewCv || canReply) ? (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {canViewCv && resolvedCvUrl ? (
                <a href={resolvedCvUrl} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline">
                    <FileText size={14} />
                    Xem CV
                  </Button>
                </a>
              ) : null}

              {canRespondStatus ? (
                <>
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={loading === "approved"}
                    onClick={() => respond("approved")}
                  >
                    Duyệt
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    loading={loading === "rejected"}
                    onClick={() => respond("rejected")}
                  >
                    Từ chối
                  </Button>
                </>
              ) : null}

              {canReply ? (
                <button
                  type="button"
                  onClick={() => setIsReplying((current) => !current)}
                  className="theme-reply-button inline-flex items-center gap-1.5 rounded-md px-1 py-1 text-xs font-medium transition"
                  aria-label={isReplying ? "Ẩn trả lời" : "Trả lời bình luận"}
                  title={isReplying ? "Ẩn trả lời" : "Trả lời bình luận"}
                >
                  <ReplyBubbleIcon />
                  <span>{replyLabel}</span>
                </button>
              ) : null}
            </div>
          ) : null}

          {isReplying && currentUserProfile ? (
            <div className="mt-3 flex gap-3 rounded-xl border border-border p-3 theme-surface">
              <Avatar
                src={currentUserProfile.avatar_url}
                name={currentUserProfile.name}
                size="sm"
                frameColor={currentUserProfile.frame_color}
                role={currentUserProfile.role}
              />
              <div className="min-w-0 flex-1 space-y-2">
                <Textarea
                  value={replyText}
                  onChange={(event) => setReplyText(event.target.value)}
                  placeholder={`Trả lời ${comment.author?.name ?? "người dùng"}...`}
                  className="min-h-[84px] resize-none focus:border-border focus:ring-0"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setIsReplying(false);
                      setReplyText("");
                    }}
                  >
                    Hủy
                  </Button>
                  <Button
                    size="sm"
                    loading={replyLoading}
                    disabled={!replyText.trim()}
                    onClick={handleReply}
                  >
                    Gửi trả lời
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <Modal
        open={pendingStatus !== null}
        onClose={() => {
          if (!loading) {
            setPendingStatus(null);
          }
        }}
        title={confirmationTitle}
      >
        <div className="space-y-4">
          <p className="text-sm theme-text-secondary">{confirmationMessage}</p>
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="ghost"
              disabled={Boolean(loading)}
              onClick={() => setPendingStatus(null)}
            >
              Hủy
            </Button>
            <Button
              size="sm"
              variant={pendingStatus === "rejected" ? "danger" : "primary"}
              loading={loading === pendingStatus}
              onClick={confirmRespond}
            >
              Xác nhận
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
