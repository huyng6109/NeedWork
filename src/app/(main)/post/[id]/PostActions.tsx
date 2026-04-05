"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import { ApplyPostButton } from "@/components/post/ApplyPostButton";
import { ReportPostButton } from "@/components/post/ReportPostButton";
import { Button } from "@/components/ui/Button";
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

  if (!isJobOffer && !isOwner) return null;

  return (
    <div className="flex gap-2 border-t border-border pt-2">
      {isOwner ? (
        <Link href={`/post/${post.id}/edit`}>
          <Button variant="outline" className="gap-1.5">
            <Pencil size={14} />
            Chỉnh sửa
          </Button>
        </Link>
      ) : null}

      {isJobOffer && !isOwner ? (
        <ApplyPostButton postId={post.id} className="gap-1.5" />
      ) : null}

      {isJobOffer && canReportPost && !isOwner ? (
        <ReportPostButton postId={post.id} />
      ) : null}
    </div>
  );
}
