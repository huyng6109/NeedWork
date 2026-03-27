import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "candidate") {
    return NextResponse.json({ error: "Chỉ ứng viên mới có thể nộp CV" }, { status: 403 });
  }

  const { data: post } = await supabase
    .from("posts")
    .select("id, type, status")
    .eq("id", params.id)
    .single();

  if (!post || post.type !== "job_offer" || post.status !== "approved") {
    return NextResponse.json({ error: "Bài đăng không hợp lệ" }, { status: 400 });
  }

  // Check duplicate
  const { data: existing } = await supabase
    .from("applications")
    .select("id")
    .eq("post_id", params.id)
    .eq("candidate_id", user.id)
    .single();

  if (existing) {
    return NextResponse.json({ error: "Bạn đã nộp CV cho bài đăng này rồi" }, { status: 409 });
  }

  // Create auto-comment
  const { data: comment, error: commentError } = await supabase
    .from("comments")
    .insert({
      post_id: params.id,
      author_id: user.id,
      content: "Em đã apply.",
      type: "applied",
    })
    .select()
    .single();

  if (commentError) {
    return NextResponse.json({ error: commentError.message }, { status: 500 });
  }

  // Create application
  const { data: application, error: appError } = await supabase
    .from("applications")
    .insert({
      post_id: params.id,
      candidate_id: user.id,
      comment_id: comment.id,
    })
    .select()
    .single();

  if (appError) {
    return NextResponse.json({ error: appError.message }, { status: 500 });
  }

  return NextResponse.json(
    { application_id: application.id, comment_id: comment.id },
    { status: 201 }
  );
}
