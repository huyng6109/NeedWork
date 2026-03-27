import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "candidate") {
    return NextResponse.json({ error: "Chỉ ứng viên mới có thể report" }, { status: 403 });
  }

  const { post_id, reason } = await req.json();
  if (!post_id || !reason?.trim()) {
    return NextResponse.json({ error: "Thiếu thông tin" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("reports")
    .insert({ reporter_id: user.id, target_post_id: post_id, reason })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}
