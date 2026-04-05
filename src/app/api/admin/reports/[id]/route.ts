import { NextRequest, NextResponse } from "next/server";
import { assertAdminUser } from "@/lib/auth/admin-server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const admin = await assertAdminUser(supabase);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { status } = await req.json();
  if (!["confirmed", "dismissed"].includes(status)) {
    return NextResponse.json({ error: "Trạng thái không hợp lệ" }, { status: 400 });
  }

  // Get report to find recruiter
  const { data: report } = await supabase
    .from("reports")
    .select(`*, post:posts!reports_target_post_id_fkey(author_id)`)
    .eq("id", params.id)
    .single();

  if (!report) return NextResponse.json({ error: "Không tìm thấy report" }, { status: 404 });

  const { data, error } = await supabase
    .from("reports")
    .update({ status, reviewed_by: admin.id, reviewed_at: new Date().toISOString() })
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // If confirmed → remove recruiter's trust ring
  if (status === "confirmed" && report.post?.author_id) {
    await supabase
      .from("users")
      .update({ frame_color: null, frame_count: 0 })
      .eq("id", report.post.author_id);
  }

  return NextResponse.json(data);
}
