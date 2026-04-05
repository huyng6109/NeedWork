import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_LIMIT = 12;

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limitParam = Number(req.nextUrl.searchParams.get("limit") ?? DEFAULT_LIMIT);
  const limit = Number.isFinite(limitParam)
    ? Math.min(Math.max(Math.floor(limitParam), 1), 30)
    : DEFAULT_LIMIT;

  const [{ data, error }, { count, error: unreadError }] = await Promise.all([
    supabase
      .from("notifications")
      .select(
        `id,user_id,actor_id,type,title,body,post_id,comment_id,application_id,is_read,read_at,created_at,actor:users!notifications_actor_id_fkey(id,name,avatar_url,frame_color,role)`
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false),
  ]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (unreadError) {
    return NextResponse.json({ error: unreadError.message }, { status: 500 });
  }

  return NextResponse.json({
    data: data ?? [],
    unread_count: count ?? 0,
  });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, readAll } = await req.json();
  const readAt = new Date().toISOString();

  if (readAll === true) {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true, read_at: readAt })
      .eq("user_id", user.id)
      .eq("is_read", false);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  if (typeof id !== "string" || !id) {
    return NextResponse.json({ error: "Thiếu id thông báo" }, { status: 400 });
  }

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true, read_at: readAt })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
