import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";

import { FILE_LIMITS } from "@/constants";
import { createAdminClient, createClient } from "@/lib/supabase/server";

const PRIMARY_BUCKET = "post-images";
const FALLBACK_BUCKET = "avatars";

const MIME_TO_EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

function getFileExtension(file: File) {
  const fromMime = MIME_TO_EXTENSION[file.type];
  if (fromMime) {
    return fromMime;
  }

  const fromName = file.name.split(".").pop()?.trim().toLowerCase();
  return fromName || "bin";
}

function getImageAltText(file: File) {
  const baseName = file.name.replace(/\.[^.]+$/, "").trim();
  return baseName || "post-image";
}

function hasUsableServiceRoleKey() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return Boolean(key && !/placeholder|demo/i.test(key));
}

function isRetryableBucketError(message: string) {
  return /(bucket.*not found|not found|row-level security|permission|not authorized)/i.test(
    message
  );
}

async function getPrivilegedStorageClient() {
  if (!hasUsableServiceRoleKey()) {
    return null;
  }

  const admin = await createAdminClient();
  const { data, error } = await admin.storage.getBucket(PRIMARY_BUCKET);

  if (!error && data) {
    return admin;
  }

  const { error: createError } = await admin.storage.createBucket(PRIMARY_BUCKET, {
    public: true,
    fileSizeLimit: `${FILE_LIMITS.POST_IMAGE_MAX_MB}MB`,
    allowedMimeTypes: [...FILE_LIMITS.POST_IMAGE_TYPES],
  });

  if (createError && !/already exists/i.test(createError.message)) {
    return null;
  }

  return admin;
}

async function saveLocally(
  fileBuffer: Buffer,
  fileName: string,
  userId: string,
  request: NextRequest
) {
  const relativeDirectory = path.join("uploads", "post-images", userId, "posts");
  const absoluteDirectory = path.join(process.cwd(), "public", relativeDirectory);
  await mkdir(absoluteDirectory, { recursive: true });

  const absoluteFilePath = path.join(absoluteDirectory, fileName);
  await writeFile(absoluteFilePath, fileBuffer);

  const publicPath = `/${relativeDirectory.replace(/\\/g, "/")}/${fileName}`;
  return new URL(publicPath, request.nextUrl.origin).toString();
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "Không tìm thấy tệp" }, { status: 400 });
  }

  if (!FILE_LIMITS.POST_IMAGE_TYPES.includes(file.type as never)) {
    return NextResponse.json(
      { error: "Chỉ chấp nhận PNG, JPG, WebP hoặc GIF" },
      { status: 400 }
    );
  }

  if (file.size > FILE_LIMITS.POST_IMAGE_MAX_MB * 1024 * 1024) {
    return NextResponse.json(
      { error: `Tệp không được lớn hơn ${FILE_LIMITS.POST_IMAGE_MAX_MB}MB` },
      { status: 413 }
    );
  }

  const extension = getFileExtension(file);
  const fileName = `${Date.now()}-${randomUUID()}.${extension}`;
  const storagePath = `${user.id}/posts/${fileName}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const admin = await getPrivilegedStorageClient();

  const targets = admin
    ? [{ bucket: PRIMARY_BUCKET, client: admin }]
    : [
        { bucket: PRIMARY_BUCKET, client: supabase },
        { bucket: FALLBACK_BUCKET, client: supabase },
      ];

  let lastErrorMessage = "";

  for (const target of targets) {
    const { error: uploadError } = await target.client.storage
      .from(target.bucket)
      .upload(storagePath, buffer, { contentType: file.type, upsert: false });

    if (!uploadError) {
      const {
        data: { publicUrl },
      } = target.client.storage.from(target.bucket).getPublicUrl(storagePath);

      return NextResponse.json({
        url: publicUrl,
        markdown: `![${getImageAltText(file)}](${publicUrl})`,
      });
    }

    lastErrorMessage = uploadError.message;

    if (target.bucket === PRIMARY_BUCKET && isRetryableBucketError(uploadError.message)) {
      continue;
    }

    break;
  }

  try {
    const localUrl = await saveLocally(buffer, fileName, user.id, request);
    return NextResponse.json({
      url: localUrl,
      markdown: `![${getImageAltText(file)}](${localUrl})`,
      storage: "local",
    });
  } catch (localError) {
    const message =
      localError instanceof Error ? localError.message : "Không thể lưu ảnh cục bộ";

    return NextResponse.json(
      {
        error:
          lastErrorMessage ||
          `${message}. Hãy tạo bucket \`post-images\` trong Supabase Storage hoặc cấu hình \`SUPABASE_SERVICE_ROLE_KEY\`.`,
      },
      { status: 500 }
    );
  }
}
