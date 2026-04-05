import { NextRequest, NextResponse } from "next/server";
import { assertAdminUser } from "@/lib/auth/admin-server";
import { DEMO_POSTS, DEMO_REPORTS, DEMO_USERS } from "@/lib/demo-data";
import { createClient } from "@/lib/supabase/server";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { status } = await req.json();
  if (!["confirmed", "dismissed"].includes(status)) {
    return NextResponse.json({ error: "Trang thai khong hop le" }, { status: 400 });
  }

  if (DEMO_MODE) {
    const report = DEMO_REPORTS.find((item) => item.id === params.id);
    if (!report) {
      return NextResponse.json({ error: "Khong tim thay report" }, { status: 404 });
    }

    report.status = status;
    report.reviewed_by = "demo-admin";
    report.reviewed_at = new Date().toISOString();

    if (status === "confirmed") {
      const post = DEMO_POSTS.find((item) => item.id === report.target_post_id);
      const recruiter = DEMO_USERS.find((user) => user.id === post?.author_id);
      if (recruiter) {
        recruiter.frame_color = null;
        recruiter.frame_count = 0;
      }
    }

    return NextResponse.json(report);
  }

  const supabase = await createClient();
  const admin = await assertAdminUser(supabase);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: report } = await supabase
    .from("reports")
    .select(`*, post:posts!reports_target_post_id_fkey(author_id)`)
    .eq("id", params.id)
    .single();

  if (!report) return NextResponse.json({ error: "Khong tim thay report" }, { status: 404 });

  const { data, error } = await supabase
    .from("reports")
    .update({ status, reviewed_by: admin.id, reviewed_at: new Date().toISOString() })
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (status === "confirmed" && report.post?.author_id) {
    await supabase
      .from("users")
      .update({ frame_color: null, frame_count: 0 })
      .eq("id", report.post.author_id);
  }

  return NextResponse.json(data);
}
