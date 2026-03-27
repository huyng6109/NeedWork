import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DEMO_USERS } from "@/lib/demo-data";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

const DEMO_COMMENTS: Record<string, object[]> = {
  "demo-post-1": [
    { id: "c1", post_id: "demo-post-1", author_id: "demo-candidate-1", author: DEMO_USERS[2], content: "Em đã apply.", type: "applied", status: "approved", has_applied: true, responded_at: new Date().toISOString(), created_at: new Date(Date.now() - 3600000).toISOString() },
    { id: "c2", post_id: "demo-post-1", author_id: "demo-candidate-2", author: DEMO_USERS[3], content: "Em đã apply.", type: "applied", status: null, has_applied: true, responded_at: null, created_at: new Date(Date.now() - 1800000).toISOString() },
    { id: "c3", post_id: "demo-post-1", author_id: "demo-candidate-1", author: DEMO_USERS[2], content: "Cho mình hỏi công ty có hỗ trợ visa không ạ?", type: "normal", status: null, has_applied: false, responded_at: null, created_at: new Date(Date.now() - 900000).toISOString() },
  ],
  "demo-post-2": [
    { id: "c4", post_id: "demo-post-2", author_id: "demo-candidate-2", author: DEMO_USERS[3], content: "Em đã apply.", type: "applied", status: null, has_applied: true, responded_at: null, created_at: new Date(Date.now() - 7200000).toISOString() },
    { id: "c5", post_id: "demo-post-2", author_id: "demo-candidate-1", author: DEMO_USERS[2], content: "Vị trí này remote được không anh/chị?", type: "normal", status: null, has_applied: false, responded_at: null, created_at: new Date(Date.now() - 3600000).toISOString() },
  ],
};

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (DEMO_MODE) {
    const comments = DEMO_COMMENTS[params.id] ?? [];
    return NextResponse.json({ data: comments, next_cursor: null });
  }

  const supabase = await createClient();
  const { searchParams } = req.nextUrl;
  const cursor = searchParams.get("cursor");
  const limit = 20;

  let query = supabase
    .from("comments")
    .select(`*, author:users!comments_author_id_fkey(id,name,avatar_url,frame_color)`)
    .eq("post_id", params.id)
    .order("created_at", { ascending: true })
    .limit(limit + 1);

  if (cursor) query = query.gt("created_at", cursor);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const hasMore = (data?.length ?? 0) > limit;
  const page = (data ?? []).slice(0, limit);
  const next_cursor = hasMore ? page[page.length - 1].created_at : null;

  // Check which authors have applied (for badge)
  const { data: { user } } = await supabase.auth.getUser();
  let myApplications: string[] = [];
  if (user) {
    const { data: apps } = await supabase
      .from("applications")
      .select("candidate_id")
      .eq("post_id", params.id);
    myApplications = (apps ?? []).map((a) => a.candidate_id);
  }

  const normalized = page.map((c) => ({
    ...c,
    has_applied: myApplications.includes(c.author_id),
  }));

  return NextResponse.json({ data: normalized, next_cursor });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { content } = await req.json();
  if (!content?.trim()) {
    return NextResponse.json({ error: "Nội dung không được trống" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("comments")
    .insert({ post_id: params.id, author_id: user.id, content })
    .select(`*, author:users!comments_author_id_fkey(id,name,avatar_url,frame_color)`)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}
