import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isStrictAdmin } from "@/lib/auth/admin";
import { supabasePublishableKey, supabaseUrl } from "@/lib/supabase/config";

const PROTECTED_ROUTES = ["/profile/edit", "/post/create", "/account"];
const ADMIN_ROUTES = ["/admin"];
const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export async function middleware(request: NextRequest) {
  if (DEMO_MODE) return NextResponse.next({ request });
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    supabaseUrl,
    supabasePublishableKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r));
  const isAdmin = ADMIN_ROUTES.some((r) => pathname.startsWith(r));

  if ((isProtected || isAdmin) && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdmin && user) {
    const { data: profile } = await supabase
      .from("users")
      .select("role, username")
      .eq("id", user.id)
      .single();

    if (!isStrictAdmin(profile)) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js|map|ico|txt|xml)$).*)",
  ],
};
