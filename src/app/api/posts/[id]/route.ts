import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DEMO_POSTS } from "@/lib/demo-data";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (DEMO_MODE) {
    const post = DEMO_POSTS.find((p) => p.id === params.id);
    if (!post) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });
    return NextResponse.json(post);
  }

  const supabase = await createClient();

  const { data: post, error } = await supabase
    .from("posts")
    .select(
      `*, author:users!posts_author_id_fkey(id,name,title,avatar_url,frame_color,role,warning_count)`
    )
    .eq("id", params.id)
    .single();

  if (error || !post)
    return NextResponse.json({ error: "Không tìm thấy bài đăng" }, { status: 404 });

  return NextResponse.json(post);
}
