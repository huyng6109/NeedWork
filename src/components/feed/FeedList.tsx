"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { PostCard } from "./PostCard";
import { PostCardSkeleton } from "@/components/ui/Skeleton";
import type { Post, PostType } from "@/types";

interface FeedListProps {
  type: PostType;
  lat: number | null;
  lng: number | null;
  radius: number;
}

export function FeedList({ type, lat, lng, radius }: FeedListProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadPosts = useCallback(
    async (reset = false) => {
      if (loading) return;
      setLoading(true);

      const params = new URLSearchParams({ type, limit: "20" });
      if (!reset && cursor) params.set("cursor", cursor);
      if (lat !== null) params.set("lat", String(lat));
      if (lng !== null) params.set("lng", String(lng));
      if (lat !== null) params.set("radius", String(radius));

      const res = await fetch(`/api/posts?${params.toString()}`);
      if (!res.ok) {
        setLoading(false);
        return;
      }
      const json = await res.json();

      setPosts((prev) => (reset ? json.data : [...prev, ...json.data]));
      setCursor(json.next_cursor);
      setHasMore(json.next_cursor !== null);
      setLoading(false);
      setInitialLoad(false);
    },
    [type, lat, lng, radius, cursor, loading]
  );

  // Reset and reload when filters change
  useEffect(() => {
    setPosts([]);
    setCursor(null);
    setHasMore(true);
    setInitialLoad(true);
    loadPosts(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, lat, lng, radius]);

  // Infinite scroll sentinel
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        loadPosts();
      }
    });
    if (sentinelRef.current) observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current?.disconnect();
  }, [hasMore, loading, loadPosts]);

  if (initialLoad) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <PostCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!posts.length) {
    return (
      <div className="text-center py-16 text-muted">
        <p className="text-lg">Chưa có bài đăng nào</p>
        <p className="text-sm mt-1">
          {type === "job_offer"
            ? "Hãy là người đầu tiên đăng tuyển dụng!"
            : "Hãy là người đầu tiên tìm việc!"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
      <div ref={sentinelRef} className="h-4" />
      {loading && !initialLoad && (
        <div className="space-y-3">
          <PostCardSkeleton />
          <PostCardSkeleton />
        </div>
      )}
      {!hasMore && posts.length > 0 && (
        <p className="text-center text-xs text-muted py-4">Đã xem hết bài đăng</p>
      )}
    </div>
  );
}
