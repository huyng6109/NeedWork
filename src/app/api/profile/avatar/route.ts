import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

import { FILE_LIMITS } from "@/constants";
import { createAdminClient, createClient } from "@/lib/supabase/server";

const BUCKET = "avatars";
const AVATAR_FILE_NAME = "avatar";
const AVATAR_MAX_DIMENSION = 640;
const AVATAR_WEBP_QUALITY = 82;
const AVATAR_SOURCE_MAX_MB = 15;

function hasUsableServiceRoleKey() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return Boolean(key && !/placeholder|demo/i.test(key));
}

async function getAvatarStorageClient() {
  if (!hasUsableServiceRoleKey()) {
    return null;
  }

  const admin = await createAdminClient();
  const { data, error } = await admin.storage.getBucket(BUCKET);

  if (error || !data) {
    const { error: createError } = await admin.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: `${FILE_LIMITS.AVATAR_MAX_MB}MB`,
      allowedMimeTypes: [...FILE_LIMITS.AVATAR_TYPES],
    });

    if (createError && !/already exists/i.test(createError.message)) {
      return null;
    }

    return admin;
  }

  await admin.storage.updateBucket(BUCKET, {
    public: true,
    fileSizeLimit: `${FILE_LIMITS.AVATAR_MAX_MB}MB`,
    allowedMimeTypes: [...FILE_LIMITS.AVATAR_TYPES],
  });

  return admin;
}

async function cleanupLegacyAvatarFiles(userId: string, currentPath: string) {
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
    .filter(
      (file) =>
        file.name.startsWith(AVATAR_FILE_NAME) && `${userId}/${file.name}` !== currentPath
    )
    .map((file) => `${userId}/${file.name}`);

  if (!filesToDelete.length) {
    return;
  }

  await admin.storage.from(BUCKET).remove(filesToDelete);
}

async function optimizeAvatar(file: File) {
  const inputBuffer = Buffer.from(await file.arrayBuffer());

  const optimizedBuffer = await sharp(inputBuffer)
    .rotate()
    .resize({
      width: AVATAR_MAX_DIMENSION,
      height: AVATAR_MAX_DIMENSION,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({
      quality: AVATAR_WEBP_QUALITY,
      effort: 4,
    })
    .toBuffer();

  return {
    buffer: optimizedBuffer,
    contentType: "image/webp",
  };
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

  if (!file) {
    return NextResponse.json({ error: "Khong tim thay file" }, { status: 400 });
  }

  if (!FILE_LIMITS.AVATAR_TYPES.includes(file.type as never)) {
    return NextResponse.json({ error: "Chi chap nhan PNG, JPG, WebP" }, { status: 400 });
  }

  if (file.size > AVATAR_SOURCE_MAX_MB * 1024 * 1024) {
    return NextResponse.json(
      { error: `File goc khong duoc lon hon ${AVATAR_SOURCE_MAX_MB}MB` },
      { status: 413 }
    );
  }

  const path = `${user.id}/${AVATAR_FILE_NAME}`;

  let optimizedAvatar: { buffer: Buffer; contentType: string };

  try {
    optimizedAvatar = await optimizeAvatar(file);
  } catch {
    return NextResponse.json({ error: "Khong the xu ly anh tai len" }, { status: 400 });
  }

  const { buffer, contentType } = optimizedAvatar;

  if (buffer.length > FILE_LIMITS.AVATAR_MAX_MB * 1024 * 1024) {
    return NextResponse.json(
      { error: `Anh sau khi nen van lon hon ${FILE_LIMITS.AVATAR_MAX_MB}MB` },
      { status: 413 }
    );
  }

  const admin = await getAvatarStorageClient();
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
    .update({ avatar_url: versionedPublicUrl })
    .eq("id", user.id);

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  await cleanupLegacyAvatarFiles(user.id, path);

  return NextResponse.json({ url: versionedPublicUrl });
}
