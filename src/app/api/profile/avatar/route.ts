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
  if (!FILE_LIMITS.AVATAR_TYPES.includes(file.type as never)) {
    return NextResponse.json({ error: "Chỉ chấp nhận PNG, JPG, WebP" }, { status: 400 });
  }
  if (file.size > FILE_LIMITS.AVATAR_MAX_MB * 1024 * 1024) {
    return NextResponse.json(
      { error: `File không được lớn hơn ${FILE_LIMITS.AVATAR_MAX_MB}MB` },
      { status: 413 }
    );
  }

  const ext = file.name.split(".").pop();
  const path = `${user.id}/avatar.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, buffer, { contentType: file.type, upsert: true });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);

  await supabase.from("users").update({ avatar_url: publicUrl }).eq("id", user.id);

  return NextResponse.json({ url: publicUrl });
}
