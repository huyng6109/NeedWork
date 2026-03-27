import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { moderateContent } from "@/lib/moderation";
import { FEED_PAGE_SIZE } from "@/constants";
import { DEMO_POSTS } from "@/lib/demo-data";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const type = searchParams.get("type") ?? "job_offer";

  if (DEMO_MODE) {
    const filtered = DEMO_POSTS.filter((p) => p.type === type);
    return NextResponse.json({ data: filtered, next_cursor: null });
  }

  const supabase = await createClient();

  const cursor = searchParams.get("cursor");
  const limit = Math.min(Number(searchParams.get("limit") ?? FEED_PAGE_SIZE), 50);
  const lat = searchParams.get("lat") ? Number(searchParams.get("lat")) : null;
  const lng = searchParams.get("lng") ? Number(searchParams.get("lng")) : null;
  const radius = Number(searchParams.get("radius") ?? 10);

  let query = supabase
    .from("posts")
    .select(
      `*, author:users!posts_author_id_fkey(id,name,title,avatar_url,frame_color),
       comment_count:comments(count)`
    )
    .eq("type", type)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(limit + 1);

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Location filter (Haversine) — applied in JS since Supabase free tier lacks PostGIS
  let posts = data ?? [];
  if (lat !== null && lng !== null) {
    posts = posts.filter((p) => {
      if (p.lat == null || p.lng == null) return false;
      const R = 6371;
      const dLat = ((p.lat - lat) * Math.PI) / 180;
      const dLng = ((p.lng - lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat * Math.PI) / 180) *
          Math.cos((p.lat * Math.PI) / 180) *
          Math.sin(dLng / 2) ** 2;
      const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return dist <= radius;
    });
  }

  const hasMore = posts.length > limit;
  const page = posts.slice(0, limit);
  const next_cursor = hasMore ? page[page.length - 1].created_at : null;

  // Flatten comment_count
  const normalized = page.map((p) => ({
    ...p,
    comment_count: p.comment_count?.[0]?.count ?? 0,
  }));

  return NextResponse.json({ data: normalized, next_cursor });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  const body = await req.json();
  const { type, title, content, email, location_name, lat, lng, salary_min, salary_max, job_type } = body;

  if (!type || !title || !content) {
    return NextResponse.json({ error: "Thiếu thông tin bắt buộc" }, { status: 400 });
  }

  if (type === "job_offer" && profile?.role !== "recruiter") {
    return NextResponse.json({ error: "Chỉ nhà tuyển dụng mới có thể đăng tuyển dụng" }, { status: 403 });
  }
  if (type === "job_seeking" && profile?.role !== "candidate") {
    return NextResponse.json({ error: "Chỉ ứng viên mới có thể đăng tìm việc" }, { status: 403 });
  }
  if (type === "job_offer" && (!email || !location_name || lat == null || lng == null)) {
    return NextResponse.json({ error: "Bài tuyển dụng cần email và địa điểm" }, { status: 400 });
  }

  // AI moderation for job_offer
  let status = type === "job_offer" ? "pending" : "approved";
  if (type === "job_offer") {
    const modResult = await moderateContent(`${title}\n${content}`);
    if (modResult.flagged) {
      status = "rejected";
    }
  }

  const { data: post, error } = await supabase
    .from("posts")
    .insert({
      author_id: user.id,
      type,
      title,
      content,
      email: email ?? null,
      location_name: location_name ?? null,
      lat: lat ?? null,
      lng: lng ?? null,
      salary_min: salary_min ?? null,
      salary_max: salary_max ?? null,
      job_type: job_type ?? null,
      status,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(post, { status: 201 });
}
