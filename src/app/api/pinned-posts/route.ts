import { NextRequest, NextResponse } from "next/server";

import { PINNED_POST_LIMIT } from "@/constants";
import { createClient } from "@/lib/supabase/server";
import type { Post } from "@/types";

async function getAuthenticatedProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: "Vui lòng đăng nhập" }, { status: 401 }) };
  }

  return { supabase, user };
}

async function getPinnedPostIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  const { data, error } = await supabase
    .from("pinned_posts")
    .select("post_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((item) => item.post_id);
}

async function getPinnedPosts(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  const { data, error } = await supabase
    .from("pinned_posts")
    .select(
      `post_id, post:posts!inner(*, author:users!posts_author_id_fkey(id,name,title,avatar_url,frame_color,role), comment_count:comments(count))`
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return ((data as Array<{ post?: unknown }> | null) ?? []).flatMap((item) => {
    const rawPost = Array.isArray(item.post) ? item.post[0] : item.post;

    if (!rawPost || typeof rawPost !== "object") {
      return [];
    }

    const post = rawPost as Post & {
      comment_count?: Array<{ count: number }> | number | null;
    };

    return [
      {
        ...post,
        comment_count: Array.isArray(post.comment_count)
          ? post.comment_count?.[0]?.count ?? 0
          : post.comment_count ?? 0,
      },
    ];
  });
}

export async function GET() {
  const session = await getAuthenticatedProfile();
  if ("error" in session) {
    return session.error;
  }

  try {
    const [postIds, posts] = await Promise.all([
      getPinnedPostIds(session.supabase, session.user.id),
      getPinnedPosts(session.supabase, session.user.id),
    ]);
    return NextResponse.json({ count: postIds.length, post_ids: postIds, posts });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không thể tải danh sách ghim";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getAuthenticatedProfile();
  if ("error" in session) {
    return session.error;
  }

  const { postId } = await req.json();

  if (typeof postId !== "string" || !postId.trim()) {
    return NextResponse.json({ error: "Thiếu postId" }, { status: 400 });
  }

  const normalizedPostId = postId.trim();
  const { supabase, user } = session;

  const [{ data: existingPin }, { data: post }] = await Promise.all([
    supabase
      .from("pinned_posts")
      .select("id")
      .eq("user_id", user.id)
      .eq("post_id", normalizedPostId)
      .maybeSingle(),
    supabase
      .from("posts")
      .select("id, status, author_id")
      .eq("id", normalizedPostId)
      .maybeSingle(),
  ]);

  if (!post || (post.status !== "approved" && post.author_id !== user.id)) {
    return NextResponse.json({ error: "Không tìm thấy bài viết để ghim" }, { status: 404 });
  }

  if (existingPin) {
    const postIds = await getPinnedPostIds(supabase, user.id);
    return NextResponse.json({ count: postIds.length, pinned: true, post_ids: postIds });
  }

  const currentPinnedIds = await getPinnedPostIds(supabase, user.id);

  if (currentPinnedIds.length >= PINNED_POST_LIMIT) {
    return NextResponse.json(
      { error: `Chỉ được ghim tối đa ${PINNED_POST_LIMIT} bài viết`, count: currentPinnedIds.length },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("pinned_posts").insert({
    post_id: normalizedPostId,
    user_id: user.id,
  });

  if (error) {
    const message =
      error.message.includes("Pinned posts limit")
        ? `Chỉ được ghim tối đa ${PINNED_POST_LIMIT} bài viết`
        : error.message;

    return NextResponse.json({ error: message }, { status: 400 });
  }

  const postIds = await getPinnedPostIds(supabase, user.id);
  return NextResponse.json({ count: postIds.length, pinned: true, post_ids: postIds });
}

export async function DELETE(req: NextRequest) {
  const session = await getAuthenticatedProfile();
  if ("error" in session) {
    return session.error;
  }

  const { postId } = await req.json();

  if (typeof postId !== "string" || !postId.trim()) {
    return NextResponse.json({ error: "Thiếu postId" }, { status: 400 });
  }

  const normalizedPostId = postId.trim();
  const { supabase, user } = session;

  const { error } = await supabase
    .from("pinned_posts")
    .delete()
    .eq("user_id", user.id)
    .eq("post_id", normalizedPostId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const postIds = await getPinnedPostIds(supabase, user.id);
  return NextResponse.json({ count: postIds.length, pinned: false, post_ids: postIds });
}
