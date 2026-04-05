import { NextRequest, NextResponse } from "next/server";

import { FILE_LIMITS } from "@/constants";
import { createAdminClient, createClient } from "@/lib/supabase/server";

const BUCKET = "cvs";
const CV_FILE_NAME = "cv";
const CV_EXTENSION_TO_MIME: Record<string, (typeof FILE_LIMITS.CV_TYPES)[number]> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

function hasUsableServiceRoleKey() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return Boolean(key && !/placeholder|demo/i.test(key));
}

function getFileExtension(filename: string) {
  const segments = filename.toLowerCase().split(".");
  return segments.length > 1 ? segments.at(-1) ?? "" : "";
}

function normalizeCvMimeType(file: File) {
  const mimeType = file.type.toLowerCase();

  if (mimeType === "image/jpg") {
    return "image/jpeg";
  }

  if (FILE_LIMITS.CV_TYPES.includes(mimeType as never)) {
    return mimeType as (typeof FILE_LIMITS.CV_TYPES)[number];
  }

  if (!mimeType || mimeType === "application/octet-stream") {
    return CV_EXTENSION_TO_MIME[getFileExtension(file.name)] ?? null;
  }

  return null;
}

async function getCvStorageClient() {
  if (!hasUsableServiceRoleKey()) {
    return null;
  }

  const admin = await createAdminClient();
  const { data, error } = await admin.storage.getBucket(BUCKET);

  if (error || !data) {
    const { error: createError } = await admin.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: `${FILE_LIMITS.CV_MAX_MB}MB`,
      allowedMimeTypes: [...FILE_LIMITS.CV_TYPES],
    });

    if (createError && !/already exists/i.test(createError.message)) {
      return null;
    }

    return admin;
  }

  await admin.storage.updateBucket(BUCKET, {
    public: true,
    fileSizeLimit: `${FILE_LIMITS.CV_MAX_MB}MB`,
    allowedMimeTypes: [...FILE_LIMITS.CV_TYPES],
  });

  return admin;
}

async function cleanupLegacyCvFiles(userId: string, currentPath: string) {
  if (!hasUsableServiceRoleKey()) {
    return;
  }

  const admin = await createAdminClient();
  const { data, error } = await admin.storage.from(BUCKET).list(userId, {
    limit: 100,
  });

  if (error || !data?.length) {
    return;
  }

  const filesToDelete = data
    .filter((file) => file.name.startsWith(CV_FILE_NAME) && `${userId}/${file.name}` !== currentPath)
    .map((file) => `${userId}/${file.name}`);

  if (!filesToDelete.length) {
    return;
  }

  await admin.storage.from(BUCKET).remove(filesToDelete);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const contentType = file ? normalizeCvMimeType(file) : null;

  if (!file) {
    return NextResponse.json({ error: "Không tìm thấy tệp" }, { status: 400 });
  }

  if (!contentType) {
    return NextResponse.json(
      { error: "Chỉ chấp nhận PDF hoặc ảnh JPG, PNG, WebP" },
      { status: 400 }
    );
  }

  if (file.size > FILE_LIMITS.CV_MAX_MB * 1024 * 1024) {
    return NextResponse.json(
      { error: `Tệp không được lớn hơn ${FILE_LIMITS.CV_MAX_MB}MB` },
      { status: 413 }
    );
  }

  const path = `${user.id}/${CV_FILE_NAME}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const admin = await getCvStorageClient();
  const storageClient = admin ?? supabase;

  const { error: uploadError } = await storageClient.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType, upsert: true });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = storageClient.storage.from(BUCKET).getPublicUrl(path);
  const versionedPublicUrl = `${publicUrl}?v=${Date.now()}`;

  const { error: profileError } = await supabase
    .from("users")
    .update({ cv_url: versionedPublicUrl })
    .eq("id", user.id);

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  await cleanupLegacyCvFiles(user.id, path);

  return NextResponse.json({ url: versionedPublicUrl });
}
