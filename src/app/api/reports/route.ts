import { NextRequest, NextResponse } from "next/server";
import { canActAsCandidate } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";

async function getReportEligibility(
  postId: string,
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false as const, status: 401, error: "Vui lòng đăng nhập để report bài viết" };
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!canActAsCandidate(profile?.role)) {
    return {
      ok: false as const,
      status: 403,
      error: "Chỉ ứng viên mới có thể report bài viết tuyển dụng",
    };
  }

  const { data: post } = await supabase
    .from("posts")
    .select("id, type, status")
    .eq("id", postId)
    .single();

  if (!post || post.type !== "job_offer" || post.status !== "approved") {
    return {
      ok: false as const,
      status: 400,
      error: "Chỉ có thể report bài tuyển dụng đang hiển thị trên bảng tin",
    };
  }

  const { data: application } = await supabase
    .from("applications")
    .select("id, status")
    .eq("post_id", postId)
    .eq("candidate_id", user.id)
    .maybeSingle();

  if (!application) {
    return {
      ok: false as const,
      status: 403,
      error: "Bạn không thể report vì chưa nộp CV ở bài viết này.",
    };
  }

  if (application.status !== "approved") {
    return {
      ok: false as const,
      status: 403,
      error: "Bạn không thể report vì CV ở bài viết này chưa được duyệt.",
    };
  }

  const { data: existingReport } = await supabase
    .from("reports")
    .select("id")
    .eq("reporter_id", user.id)
    .eq("target_post_id", postId)
    .maybeSingle();

  if (existingReport) {
    return {
      ok: false as const,
      status: 409,
      error: "Bạn đã report bài viết này rồi",
    };
  }

  return { ok: true as const, userId: user.id };
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const postId = req.nextUrl.searchParams.get("post_id");

  if (!postId) {
    return NextResponse.json({ error: "Thiếu post_id" }, { status: 400 });
  }

  const eligibility = await getReportEligibility(postId, supabase);

  if (!eligibility.ok) {
    return NextResponse.json({ error: eligibility.error, can_report: false }, { status: eligibility.status });
  }

  return NextResponse.json({ can_report: true });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { post_id, reason } = await req.json();

  if (!post_id || !reason?.trim()) {
    return NextResponse.json({ error: "Thiếu thông tin" }, { status: 400 });
  }

  const eligibility = await getReportEligibility(post_id, supabase);

  if (!eligibility.ok) {
    return NextResponse.json({ error: eligibility.error }, { status: eligibility.status });
  }

  const { data, error } = await supabase
    .from("reports")
    .insert({ reporter_id: eligibility.userId, target_post_id: post_id, reason: reason.trim() })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}
