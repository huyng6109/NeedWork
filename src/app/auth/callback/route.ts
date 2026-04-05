import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { TRUST_RING } from "@/constants";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirect = searchParams.get("redirect") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Upsert user profile on first OAuth login
      await supabase.from("users").upsert(
        {
          id: data.user.id,
          email: data.user.email,
          name:
            data.user.user_metadata?.full_name ??
            data.user.user_metadata?.name ??
            null,
          avatar_url: data.user.user_metadata?.avatar_url ?? null,
          role: "candidate",
          frame_color: TRUST_RING.FRAME_COLOR,
        },
        { onConflict: "id", ignoreDuplicates: true }
      );
    }
  }

  return NextResponse.redirect(`${origin}${redirect}`);
}
