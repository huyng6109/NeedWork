"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface TogglePinnedPostResult {
  count: number;
  error?: string;
  pinned: boolean;
  requiresAuth?: boolean;
}

interface PinnedPostsContextValue {
  count: number;
  isAuthenticated: boolean;
  isPinned: (postId: string) => boolean;
  loading: boolean;
  pinnedIds: string[];
  togglePin: (postId: string) => Promise<TogglePinnedPostResult>;
}

const PinnedPostsContext = createContext<PinnedPostsContextValue | null>(null);

interface PinnedPostsProviderProps {
  children: ReactNode;
  enabled: boolean;
}

export function PinnedPostsProvider({ children, enabled }: PinnedPostsProviderProps) {
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(enabled);

  useEffect(() => {
    let cancelled = false;

    async function loadPinnedPosts() {
      if (!enabled) {
        setPinnedIds([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const response = await fetch("/api/pinned-posts", {
          cache: "no-store",
        });

        if (!response.ok) {
          if (!cancelled) {
            setPinnedIds([]);
          }
          return;
        }

        const payload = (await response.json()) as { post_ids?: string[] } | null;

        if (!cancelled) {
          setPinnedIds(Array.isArray(payload?.post_ids) ? payload.post_ids : []);
        }
      } catch {
        if (!cancelled) {
          setPinnedIds([]);
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
  }, [enabled]);

  const isPinned = useCallback(
    (postId: string) => pinnedIds.includes(postId),
    [pinnedIds]
  );

  const togglePin = useCallback(
    async (postId: string): Promise<TogglePinnedPostResult> => {
      if (!enabled) {
        return {
          count: 0,
          error: "Vui lòng đăng nhập để ghim bài viết",
          pinned: false,
          requiresAuth: true,
        };
      }

      const pinned = pinnedIds.includes(postId);
      const method = pinned ? "DELETE" : "POST";

      try {
        const response = await fetch("/api/pinned-posts", {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postId }),
        });

        const payload = (await response.json().catch(() => null)) as
          | { count?: number; error?: string; pinned?: boolean; post_ids?: string[] }
          | null;

        if (response.status === 401) {
          return {
            count: pinnedIds.length,
            error: payload?.error ?? "Vui lòng đăng nhập để ghim bài viết",
            pinned,
            requiresAuth: true,
          };
        }

        if (!response.ok) {
          return {
            count: typeof payload?.count === "number" ? payload.count : pinnedIds.length,
            error: payload?.error ?? "Không thể cập nhật danh sách ghim",
            pinned,
          };
        }

        const nextPinned = Boolean(payload?.pinned);
        const nextPinnedIds = Array.isArray(payload?.post_ids)
          ? payload.post_ids
          : nextPinned
            ? Array.from(new Set([...pinnedIds, postId]))
            : pinnedIds.filter((id) => id !== postId);

        setPinnedIds(nextPinnedIds);

        return {
          count:
            typeof payload?.count === "number" ? payload.count : nextPinnedIds.length,
          pinned: nextPinned,
        };
      } catch {
        return {
          count: pinnedIds.length,
          error: "Không thể cập nhật danh sách ghim",
          pinned,
        };
      }
    },
    [enabled, pinnedIds]
  );

  const value = useMemo<PinnedPostsContextValue>(
    () => ({
      count: pinnedIds.length,
      isAuthenticated: enabled,
      isPinned,
      loading,
      pinnedIds,
      togglePin,
    }),
    [enabled, isPinned, loading, pinnedIds, togglePin]
  );

  return (
    <PinnedPostsContext.Provider value={value}>
      {children}
    </PinnedPostsContext.Provider>
  );
}

export function usePinnedPosts() {
  const context = useContext(PinnedPostsContext);

  if (!context) {
    throw new Error("usePinnedPosts must be used within PinnedPostsProvider");
  }

  return context;
}
