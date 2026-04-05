"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { PostCard } from "./PostCard";
import { PostCardSkeleton } from "@/components/ui/Skeleton";
import type { Post, PostType, User } from "@/types";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

interface FeedListProps {
  type: PostType;
  search: string;
  lat: number | null;
  lng: number | null;
  radius: number;
}

export function FeedList({ type, search, lat, lng, radius }: FeedListProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentProfile, setCurrentProfile] = useState<User | null>(null);
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
      if (search.trim()) params.set("search", search.trim());
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
    [type, search, lat, lng, radius, cursor, loading]
  );

  useEffect(() => {
    if (DEMO_MODE) return;

    let cancelled = false;

    async function loadCurrentProfile() {
      try {
        const res = await fetch("/api/profile", { cache: "no-store" });

        if (cancelled) return;

        if (!res.ok) {
          setCurrentProfile(null);
          return;
        }

        const profile = (await res.json()) as User;
        if (!cancelled) {
          setCurrentProfile(profile);
        }
      } catch {
        if (!cancelled) {
          setCurrentProfile(null);
        }
      }
    }

    loadCurrentProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setPosts([]);
    setCursor(null);
    setHasMore(true);
    setInitialLoad(true);
    loadPosts(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, search, lat, lng, radius]);

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
        {Array.from({ length: 5 }).map((_, index) => (
          <PostCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (!posts.length) {
    return (
      <div className="py-16 text-center text-muted">
        <p className="text-lg">
          {search.trim() ? "Không tìm thấy bài viết phù hợp" : "Chưa có bài đăng nào"}
        </p>
        <p className="mt-1 text-sm">
          {search.trim()
            ? "Thử đổi từ khóa khác hoặc bỏ bớt bộ lọc vị trí."
            : type === "job_offer"
              ? "Hãy là người đầu tiên đăng tuyển dụng!"
              : "Hãy là người đầu tiên tìm việc!"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} currentUser={currentProfile} />
      ))}
      <div ref={sentinelRef} className="h-4" />
      {loading && !initialLoad ? (
        <div className="space-y-3">
          <PostCardSkeleton />
          <PostCardSkeleton />
        </div>
      ) : null}
      {!hasMore && posts.length > 0 ? (
        <p className="py-4 text-center text-xs text-muted">Đã xem hết bài đăng</p>
      ) : null}
    </div>
  );
}
