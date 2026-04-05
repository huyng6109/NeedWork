import type { EmailOtpType } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

import { TRUST_RING } from "@/constants";
import { createClient } from "@/lib/supabase/server";

function toDisplayName(email: string) {
  const localPart = email.split("@")[0]?.trim();
  return localPart || null;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next =
    searchParams.get("next") && /^\/(?!\/)/.test(searchParams.get("next")!)
      ? searchParams.get("next")!
      : "/";

  const redirectTo = new URL(next, origin);

  if (!tokenHash || !type) {
    redirectTo.searchParams.set("auth_error", "missing_confirmation_token");
    return NextResponse.redirect(redirectTo);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type,
  });

  if (error) {
    redirectTo.searchParams.set("auth_error", error.message);
    return NextResponse.redirect(redirectTo);
  }

  if (data.user?.id && data.user.email) {
    await supabase.from("users").upsert(
      {
        id: data.user.id,
        email: data.user.email,
        name: toDisplayName(data.user.email),
        role: "candidate",
        frame_color: TRUST_RING.FRAME_COLOR,
      },
      { onConflict: "id", ignoreDuplicates: true }
    );
  }

  redirectTo.searchParams.set("auth_confirmed", "1");
  return NextResponse.redirect(redirectTo);
}
