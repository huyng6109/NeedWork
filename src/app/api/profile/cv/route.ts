import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { FILE_LIMITS } from "@/constants";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "Không tìm thấy file" }, { status: 400 });
  if (!FILE_LIMITS.CV_TYPES.includes(file.type as never)) {
    return NextResponse.json({ error: "Chỉ chấp nhận file PDF" }, { status: 400 });
  }
  if (file.size > FILE_LIMITS.CV_MAX_MB * 1024 * 1024) {
    return NextResponse.json(
      { error: `File không được lớn hơn ${FILE_LIMITS.CV_MAX_MB}MB` },
      { status: 413 }
    );
  }

  const path = `${user.id}/cv.pdf`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from("cvs")
    .upload(path, buffer, { contentType: "application/pdf", upsert: true });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: { publicUrl } } = supabase.storage.from("cvs").getPublicUrl(path);

  await supabase.from("users").update({ cv_url: publicUrl }).eq("id", user.id);

  return NextResponse.json({ url: publicUrl });
}
