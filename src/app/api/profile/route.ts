import { NextRequest, NextResponse } from "next/server";

import { TRUST_RING } from "@/constants";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const updates: Record<string, unknown> = {};

  for (const key of ["name", "title", "avatar_url", "cv_url"]) {
    if (key in body) {
      updates[key] = body[key];
    }
  }

  const { data: currentProfile } = await supabase
    .from("users")
    .select("warning_count, role")
    .eq("id", user.id)
    .single();

  if (body.role !== undefined && body.role !== null && body.role !== "") {
    updates.role = body.role;
  }

  if (updates.role && !["candidate", "recruiter"].includes(String(updates.role))) {
    return NextResponse.json({ error: "Vai trò không hợp lệ" }, { status: 400 });
  }

  if (currentProfile?.role === "admin" && "role" in updates) {
    return NextResponse.json(
      { error: "Tài khoản admin không thể đổi loại tài khoản ở trang này" },
      { status: 400 }
    );
  }

  updates.frame_color =
    (currentProfile?.warning_count ?? 0) === 0 ? TRUST_RING.FRAME_COLOR : null;

  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
