"use client";

import { useState } from "react";

import { PostCard } from "@/components/feed/PostCard";
import { PINNED_POST_LIMIT } from "@/constants";
import type { Post, User } from "@/types";

interface PinnedPostsPageClientProps {
  currentUser: User;
  initialPosts: Post[];
}

export function PinnedPostsPageClient({
  currentUser,
  initialPosts,
}: PinnedPostsPageClientProps) {
  const [posts, setPosts] = useState(initialPosts);

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <h1 className="text-xl font-bold text-dark">Bài viết đã ghim</h1>
        <p className="mt-1 text-sm text-muted">
          Bạn có thể ghim tối đa {PINNED_POST_LIMIT} bài viết để xem lại nhanh.
        </p>
      </div>

      {posts.length === 0 ? (
        <div className="card p-6 text-center text-sm text-muted">
          Bạn chưa ghim bài viết nào.
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUser={currentUser}
              onPinChange={(postId, pinned) => {
                if (!pinned) {
                  setPosts((current) => current.filter((item) => item.id !== postId));
                }
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
