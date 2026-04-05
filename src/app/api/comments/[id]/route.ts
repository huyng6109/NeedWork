import { NextRequest, NextResponse } from "next/server";
import { NOTIFICATION_TYPES } from "@/lib/notifications";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const admin = await createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { status } = await req.json();
  if (!["approved", "rejected"].includes(status)) {
    return NextResponse.json({ error: "Trạng thái không hợp lệ" }, { status: 400 });
  }

  // Get comment + post
  const { data: comment } = await supabase
    .from("comments")
    .select(`*, post:posts!comments_post_id_fkey(id,title,author_id)`)
    .eq("id", params.id)
    .single();

  if (!comment) return NextResponse.json({ error: "Không tìm thấy bình luận" }, { status: 404 });

  if (comment.post?.author_id !== user.id) {
    return NextResponse.json({ error: "Bạn không có quyền phản hồi bình luận này" }, { status: 403 });
  }

  if (comment.status !== null) {
    return NextResponse.json({ error: "Bình luận đã được phản hồi rồi" }, { status: 409 });
  }

  if (status === "approved" && comment.type === "applied") {
    const { data: applicant } = await supabase
      .from("users")
      .select("cv_url")
      .eq("id", comment.author_id)
      .maybeSingle();

    if (!applicant?.cv_url?.trim()) {
      return NextResponse.json(
        { error: "Ứng viên chưa có CV để xem trước khi duyệt." },
        { status: 400 }
      );
    }
  }

  const { data, error } = await admin
    .from("comments")
    .update({ status, responded_at: new Date().toISOString() })
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Also update application status
  const { data: application, error: applicationError } = await admin
    .from("applications")
    .update({ status })
    .eq("comment_id", params.id)
    .select("id")
    .maybeSingle();

  if (applicationError) {
    return NextResponse.json({ error: applicationError.message }, { status: 500 });
  }

  await admin.from("notifications").insert({
    user_id: comment.author_id,
    actor_id: user.id,
    type:
      status === "approved"
        ? NOTIFICATION_TYPES.APPLICATION_APPROVED
        : NOTIFICATION_TYPES.APPLICATION_REJECTED,
    title:
      status === "approved"
        ? "CV của bạn đã được chấp nhận"
        : "CV của bạn đã bị từ chối",
    body: comment.post?.title ?? null,
    post_id: comment.post?.id ?? comment.post_id,
    comment_id: comment.id,
    application_id: application?.id ?? null,
  });

  return NextResponse.json(data);
}
