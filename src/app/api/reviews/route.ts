import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { TRUST_RING } from "@/constants";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { target_id, post_id, rating, comment } = await req.json();

  if (!target_id || !post_id || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Thông tin không hợp lệ" }, { status: 400 });
  }

  // Verify reviewer applied to this recruiter's post
  const { data: app } = await supabase
    .from("applications")
    .select("id")
    .eq("post_id", post_id)
    .eq("candidate_id", user.id)
    .single();

  if (!app) {
    return NextResponse.json(
      { error: "Bạn chưa ứng tuyển bài đăng này nên không thể đánh giá" },
      { status: 403 }
    );
  }

  // Prevent duplicate
  const { data: existing } = await supabase
    .from("reviews")
    .select("id")
    .eq("reviewer_id", user.id)
    .eq("target_id", target_id)
    .eq("post_id", post_id)
    .single();

  if (existing) {
    return NextResponse.json({ error: "Bạn đã đánh giá nhà tuyển dụng này rồi" }, { status: 409 });
  }

  const { data: review, error } = await supabase
    .from("reviews")
    .insert({ reviewer_id: user.id, target_id, post_id, rating, comment })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Increment frame_count if rating >= 4 (positive review)
  if (rating >= 4) {
    const { data: recruiter } = await supabase
      .from("users")
      .select("frame_count, frame_color")
      .eq("id", target_id)
      .single();

    if (recruiter) {
      const newCount = recruiter.frame_count + 1;
      const shouldRestore =
        recruiter.frame_color === null &&
        newCount >= TRUST_RING.REVIEWS_TO_RESTORE;

      await supabase
        .from("users")
        .update({
          frame_count: shouldRestore ? 0 : newCount,
          frame_color: shouldRestore ? "blue" : recruiter.frame_color,
        })
        .eq("id", target_id);
    }
  }

  return NextResponse.json(review, { status: 201 });
}
