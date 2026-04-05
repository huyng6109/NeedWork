import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

const ALLOWED_BUCKETS = new Set(["avatars", "post-images", "cvs"]);

function hasUsableServiceRoleKey() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return Boolean(key && !/placeholder|demo/i.test(key));
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const bucket = searchParams.get("bucket");
  const path = searchParams.get("path");
  const cacheControl =
    bucket === "avatars"
      ? "private, no-store, no-cache, must-revalidate"
      : "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400";

  if (!bucket || !path || !ALLOWED_BUCKETS.has(bucket) || path.startsWith("/")) {
    return NextResponse.json({ error: "Invalid storage object" }, { status: 400 });
  }

  if (!hasUsableServiceRoleKey()) {
    return NextResponse.json({ error: "Missing service role key" }, { status: 500 });
  }

  const admin = await createAdminClient();
  const { data, error } = await admin.storage.from(bucket).download(path);

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Storage object not found" }, { status: 404 });
  }

  const body = await data.arrayBuffer();

  return new NextResponse(body, {
    headers: {
      "Cache-Control": cacheControl,
      "Content-Type": data.type || "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
