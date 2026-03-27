"use client";

import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatRelativeTime } from "@/lib/utils";
import type { Comment } from "@/types";
import { useState } from "react";
import toast from "react-hot-toast";

interface CommentItemProps {
  comment: Comment;
  isPostAuthor: boolean;
  currentUserId?: string;
}

export function CommentItem({ comment, isPostAuthor, currentUserId }: CommentItemProps) {
  const [status, setStatus] = useState(comment.status);
  const [loading, setLoading] = useState<"approved" | "rejected" | null>(null);

  const isApplied = comment.type === "applied";
  const canRespond = isPostAuthor && isApplied && status === null;

  async function respond(newStatus: "approved" | "rejected") {
    setLoading(newStatus);
    const res = await fetch(`/api/comments/${comment.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setLoading(null);
    if (!res.ok) {
      toast.error("Phản hồi thất bại");
      return;
    }
    setStatus(newStatus);
    toast.success(newStatus === "approved" ? "Đã duyệt" : "Đã từ chối");
  }

  return (
    <div className="flex gap-3">
      <Avatar
        src={comment.author?.avatar_url}
        name={comment.author?.name}
        size="sm"
        frameColor={comment.author?.frame_color}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center flex-wrap gap-2 mb-1">
          <span className="text-sm font-medium text-dark">
            {comment.author?.name ?? "Ẩn danh"}
          </span>
          {isApplied && comment.has_applied && (
            <Badge variant="applied">Đã nộp CV</Badge>
          )}
          {status === "approved" && <Badge variant="approved">Đã duyệt</Badge>}
          {status === "rejected" && <Badge variant="rejected">Từ chối</Badge>}
          <span className="text-xs text-muted">
            {formatRelativeTime(comment.created_at)}
          </span>
        </div>
        <p className="text-sm text-dark">{comment.content}</p>

        {canRespond && (
          <div className="flex gap-2 mt-2">
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
          </div>
        )}
      </div>
    </div>
  );
}
