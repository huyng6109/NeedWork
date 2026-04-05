"use client";

import { ApplyPostButton } from "@/components/post/ApplyPostButton";
import { ReportPostButton } from "@/components/post/ReportPostButton";
import { canActAsCandidate } from "@/lib/roles";
import type { Post, User } from "@/types";

interface PostActionsProps {
  post: Post;
  currentUser: User | null;
  isOwner: boolean;
}

export function PostActions({ post, currentUser, isOwner }: PostActionsProps) {
  const isJobOffer = post.type === "job_offer";
  const canReportPost = canActAsCandidate(currentUser?.role);

  if (!isJobOffer) return null;

  return (
    <div className="flex gap-2 border-t border-border pt-2">
      <ApplyPostButton postId={post.id} className="gap-1.5" />
      {canReportPost && !isOwner ? <ReportPostButton postId={post.id} /> : null}
    </div>
  );
}
