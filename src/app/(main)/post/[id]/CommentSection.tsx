"use client";

import { useState, useEffect } from "react";
import { CommentItem } from "@/components/post/CommentItem";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Comment, User } from "@/types";
import toast from "react-hot-toast";

interface CommentSectionProps {
  postId: string;
  isPostAuthor: boolean;
  currentUserId?: string;
  currentUserProfile: User | null;
}

export function CommentSection({
  postId,
  isPostAuthor,
  currentUserId,
  currentUserProfile,
}: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/posts/${postId}/comments`)
      .then((r) => r.json())
      .then((j) => setComments(j.data ?? []))
      .finally(() => setLoading(false));
  }, [postId]);

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    const res = await fetch(`/api/posts/${postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text }),
    });
    setSubmitting(false);
    if (!res.ok) {
      toast.error("Gửi bình luận thất bại");
      return;
    }
    const newComment = await res.json();
    setComments((prev) => [...prev, newComment]);
    setText("");
  }

  return (
    <div className="card p-5 space-y-4">
      <h2 className="font-semibold text-dark">Bình luận ({comments.length})</h2>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="w-8 h-8 rounded-full shrink-0" />
              <div className="space-y-1 flex-1">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4 divide-y divide-border">
          {comments.map((c) => (
            <div key={c.id} className="pt-4 first:pt-0">
              <CommentItem
                comment={c}
                isPostAuthor={isPostAuthor}
                currentUserId={currentUserId}
              />
            </div>
          ))}
          {!comments.length && (
            <p className="text-sm text-muted text-center py-4">
              Chưa có bình luận nào
            </p>
          )}
        </div>
      )}

      {currentUserProfile && !isPostAuthor && (
        <form onSubmit={handleComment} className="flex gap-3 pt-2 border-t border-border">
          <Avatar
            src={currentUserProfile.avatar_url}
            name={currentUserProfile.name}
            size="sm"
            frameColor={currentUserProfile.frame_color}
          />
          <div className="flex-1 flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Viết bình luận..."
              className="flex-1 text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <Button type="submit" size="sm" loading={submitting} disabled={!text.trim()}>
              Gửi
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
