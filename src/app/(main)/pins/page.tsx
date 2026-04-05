import { redirect } from "next/navigation";

import { PinnedPostsPageClient } from "./PinnedPostsPageClient";
import { createClient } from "@/lib/supabase/server";
import type { Post, User } from "@/types";

interface PinnedPostRow {
  post: (Post & { comment_count?: Array<{ count: number }> | number | null }) | null;
}

export default async function PinnedPostsPage() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect("/login?redirect=/pins");
  }

  const [{ data: currentUser }, { data: pinnedRows }] = await Promise.all([
    supabase.from("users").select("*").eq("id", authUser.id).single(),
    supabase
      .from("pinned_posts")
      .select(
        `post:posts!inner(*, author:users!posts_author_id_fkey(id,name,title,avatar_url,frame_color,role), comment_count:comments(count))`
      )
      .eq("user_id", authUser.id)
      .order("created_at", { ascending: false }),
  ]);

  const posts = ((pinnedRows as PinnedPostRow[] | null) ?? [])
    .map((row) => row.post)
    .filter(Boolean)
    .map((post) => ({
      ...(post as Post & { comment_count?: Array<{ count: number }> | number | null }),
      comment_count: Array.isArray(post?.comment_count)
        ? post.comment_count?.[0]?.count ?? 0
        : post?.comment_count ?? 0,
    }));

  return <PinnedPostsPageClient currentUser={currentUser as User} initialPosts={posts} />;
}
