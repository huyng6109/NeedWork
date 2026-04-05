import { NextRequest, NextResponse } from "next/server";

import { APPLICATION_AUTO_COMMENT } from "@/constants";
import { NOTIFICATION_TYPES } from "@/lib/notifications";
import { canActAsCandidate } from "@/lib/roles";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role, name, cv_url")
    .eq("id", user.id)
    .single();

  if (!canActAsCandidate(profile?.role)) {
    return NextResponse.json(
      { error: "Chỉ ứng viên mới có thể nộp CV" },
      { status: 403 }
    );
  }

  if (!profile?.cv_url?.trim()) {
    return NextResponse.json(
      { error: "Bạn cần tải CV trong hồ sơ trước khi nộp." },
      { status: 400 }
    );
  }

  const { data: post } = await supabase
    .from("posts")
    .select("id, title, author_id, type, status")
    .eq("id", params.id)
    .single();

  if (!post || post.type !== "job_offer" || post.status !== "approved") {
    return NextResponse.json({ error: "Bài đăng không hợp lệ" }, { status: 400 });
  }

  if (post.author_id === user.id) {
    return NextResponse.json(
      { error: "Không thể tự apply bài viết của mình" },
      { status: 403 }
    );
  }

  const { data: existing } = await supabase
    .from("applications")
    .select("id")
    .eq("post_id", params.id)
    .eq("candidate_id", user.id)
    .single();

  if (existing) {
    return NextResponse.json(
      { error: "Bạn đã nộp CV cho bài đăng này rồi 😉" },
      { status: 409 }
    );
  }

  const { data: comment, error: commentError } = await supabase
    .from("comments")
    .insert({
      post_id: params.id,
      author_id: user.id,
      content: APPLICATION_AUTO_COMMENT,
      type: "applied",
    })
    .select()
    .single();

  if (commentError) {
    return NextResponse.json({ error: commentError.message }, { status: 500 });
  }

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

  const actorName = profile?.name?.trim() || "Một ứng viên";
  const admin = await createAdminClient();
  const notifications: Array<{
    user_id: string;
    actor_id: string | null;
    type: string;
    title: string;
    body: string | null;
    post_id: string;
    comment_id: string;
    application_id: string;
  }> = [
    {
      user_id: user.id,
      actor_id: null,
      type: NOTIFICATION_TYPES.APPLICATION_SUBMITTED,
      title: "CV của bạn đã được gửi",
      body: `Đang chờ nhà tuyển dụng phản hồi ở bài viết: ${post.title}`,
      post_id: post.id,
      comment_id: comment.id,
      application_id: application.id,
    },
  ];

  if (post.author_id !== user.id) {
    notifications.push({
      user_id: post.author_id,
      actor_id: user.id,
      type: NOTIFICATION_TYPES.APPLICATION_SUBMITTED,
      title: `${actorName} đã nộp CV cho bài viết của bạn`,
      body: post.title,
      post_id: post.id,
      comment_id: comment.id,
      application_id: application.id,
    });
  }

  await admin.from("notifications").insert(notifications);

  return NextResponse.json(
    { application_id: application.id, comment_id: comment.id },
    { status: 201 }
  );
}
