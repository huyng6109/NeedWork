import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { status } = await req.json();
  if (!["approved", "rejected"].includes(status)) {
    return NextResponse.json({ error: "Trạng thái không hợp lệ" }, { status: 400 });
  }

  // Get comment + post
  const { data: comment } = await supabase
    .from("comments")
    .select(`*, post:posts!comments_post_id_fkey(author_id)`)
    .eq("id", params.id)
    .single();

  if (!comment) return NextResponse.json({ error: "Không tìm thấy bình luận" }, { status: 404 });

  if (comment.post?.author_id !== user.id) {
    return NextResponse.json({ error: "Bạn không có quyền phản hồi bình luận này" }, { status: 403 });
  }

  if (comment.status !== null) {
    return NextResponse.json({ error: "Bình luận đã được phản hồi rồi" }, { status: 409 });
  }

  const { data, error } = await supabase
    .from("comments")
    .update({ status, responded_at: new Date().toISOString() })
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Also update application status
  await supabase
    .from("applications")
    .update({ status })
    .eq("comment_id", params.id);

  return NextResponse.json(data);
}
