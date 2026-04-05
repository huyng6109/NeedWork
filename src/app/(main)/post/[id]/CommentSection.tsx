"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { CommentItem } from "@/components/post/CommentItem";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Comment, User } from "@/types";

interface CommentSectionProps {
  postId: string;
  isPostAuthor: boolean;
  currentUserId?: string;
  currentUserProfile: User | null;
}

function sortByCreatedAt(a: Comment, b: Comment) {
  return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
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
      .then((res) => res.json())
      .then((json) => setComments(json.data ?? []))
      .finally(() => setLoading(false));
  }, [postId]);

  const { rootComments, repliesByParent } = useMemo(() => {
    const sortedComments = [...comments].sort(sortByCreatedAt);
    const rootItems: Comment[] = [];
    const replyMap = new Map<string, Comment[]>();
    const allIds = new Set(sortedComments.map((comment) => comment.id));

    sortedComments.forEach((comment) => {
      const parentId = comment.reply_to_comment_id;
      if (!parentId || !allIds.has(parentId)) {
        rootItems.push(comment);
        return;
      }

      const currentReplies = replyMap.get(parentId) ?? [];
      currentReplies.push(comment);
      currentReplies.sort(sortByCreatedAt);
      replyMap.set(parentId, currentReplies);
    });

    return { rootComments: rootItems, repliesByParent: replyMap };
  }, [comments]);

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

  function handleReplyCreated(newComment: Comment) {
    setComments((prev) => [...prev, newComment]);
  }

  function renderCommentThread(comment: Comment, depth = 0) {
    const replies = repliesByParent.get(comment.id) ?? [];

    return (
      <div key={comment.id} className={depth === 0 ? "pt-4 first:pt-0" : ""}>
        <CommentItem
          comment={comment}
          postId={postId}
          isPostAuthor={isPostAuthor}
          currentUserId={currentUserId}
          currentUserProfile={currentUserProfile}
          replyCount={replies.length}
          onReplyCreated={handleReplyCreated}
        />

        {replies.length ? (
          <div className="ml-4 mt-3 border-l border-border pl-4 sm:ml-6 sm:pl-5">
            <div className="space-y-4">
              {replies.map((reply) => renderCommentThread(reply, depth + 1))}
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="card space-y-4 p-5">
      <h2 className="font-semibold theme-text">Bình luận ({rootComments.length})</h2>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((index) => (
            <div key={index} className="flex gap-3">
              <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4 divide-y divide-border">
          {rootComments.map((comment) => renderCommentThread(comment))}
          {!rootComments.length ? (
            <p className="py-4 text-center text-sm theme-text-muted">
              Chưa có bình luận nào
            </p>
          ) : null}
        </div>
      )}

      {currentUserProfile && !isPostAuthor ? (
        <form
          onSubmit={handleComment}
          className="flex gap-3 border-t border-border pt-2"
        >
          <Avatar
            src={currentUserProfile.avatar_url}
            name={currentUserProfile.name}
            size="sm"
            frameColor={currentUserProfile.frame_color}
            role={currentUserProfile.role}
          />
          <div className="flex flex-1 gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Viết bình luận..."
              className="flex-1 rounded-lg border border-border px-3 py-2 text-sm theme-input theme-text placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <Button
              type="submit"
              size="sm"
              loading={submitting}
              disabled={!text.trim()}
            >
              Gửi
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
