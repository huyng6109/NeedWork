import { supabaseUrl } from "@/lib/supabase/config";

const STORAGE_PUBLIC_PATH_PREFIX = "/storage/v1/object/public/";

const PROXIED_STORAGE_BUCKETS = new Set(["avatars", "post-images", "cvs"]);

export function resolveStorageUrl(src?: string | null): string | null {
  if (!src) {
    return null;
  }

  if (src.startsWith("/")) {
    return src;
  }

  try {
    const assetUrl = new URL(src);
    const supabaseHost = new URL(supabaseUrl).host;

    if (assetUrl.host !== supabaseHost) {
      return src;
    }

    if (!assetUrl.pathname.startsWith(STORAGE_PUBLIC_PATH_PREFIX)) {
      return src;
    }

    const objectRef = assetUrl.pathname.slice(STORAGE_PUBLIC_PATH_PREFIX.length);
    const separatorIndex = objectRef.indexOf("/");

    if (separatorIndex <= 0) {
      return src;
    }

    const bucket = objectRef.slice(0, separatorIndex);
    const path = decodeURIComponent(objectRef.slice(separatorIndex + 1));

    if (!path || !PROXIED_STORAGE_BUCKETS.has(bucket)) {
      return src;
    }

    const params = new URLSearchParams({ bucket, path });

    assetUrl.searchParams.forEach((value, key) => {
      if (key === "bucket" || key === "path") {
        return;
      }

      params.set(key, value);
    });

    return `/api/storage/object?${params.toString()}`;
  } catch {
    return src;
  }
}
