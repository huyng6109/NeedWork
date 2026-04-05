import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_SALARY_CURRENCY, SALARY_CURRENCY_OPTIONS } from "@/constants";
import { DEMO_POSTS } from "@/lib/demo-data";
import { moderateContent } from "@/lib/moderation";
import { canActAsCandidate, canActAsRecruiter } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";
import type { SalaryCurrency } from "@/types";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

type ContactType = "email" | "phone" | "other";

interface NormalizedContact {
  type: ContactType;
  value: string;
}

const ALLOWED_SALARY_CURRENCIES = new Set<SalaryCurrency>(
  SALARY_CURRENCY_OPTIONS.map((option) => option.value)
);

function normalizeContacts(value: unknown): NormalizedContact[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];

    const type =
      item.type === "email" || item.type === "phone" || item.type === "other"
        ? item.type
        : null;
    const contactValue = typeof item.value === "string" ? item.value.trim() : "";

    if (!type || !contactValue) return [];

    return [{ type, value: contactValue }];
  });
}

function parseNullableNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (DEMO_MODE) {
    const post = DEMO_POSTS.find((p) => p.id === params.id);
    if (!post) return NextResponse.json({ error: "Khong tim thay" }, { status: 404 });
    return NextResponse.json(post);
  }

  const supabase = await createClient();

  const { data: post, error } = await supabase
    .from("posts")
    .select(
      `*, author:users!posts_author_id_fkey(id,name,title,avatar_url,frame_color,role,warning_count)`
    )
    .eq("id", params.id)
    .single();

  if (error || !post) {
    return NextResponse.json({ error: "Khong tim thay bai dang" }, { status: 404 });
  }

  return NextResponse.json(post);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const {
    type,
    title,
    content,
    email,
    contacts,
    location_name,
    lat,
    lng,
    salary_min,
    salary_max,
    salary_currency,
    job_type,
  } = body;

  if (!type || !title || !content) {
    return NextResponse.json({ error: "Thieu thong tin bat buoc" }, { status: 400 });
  }

  const normalizedContacts = normalizeContacts(contacts);
  const normalizedEmail = typeof email === "string" ? email.trim() : "";
  const primaryEmail =
    normalizedEmail || normalizedContacts.find((item) => item.type === "email")?.value || null;
  const latitude = parseNullableNumber(lat);
  const longitude = parseNullableNumber(lng);
  const salaryMin = parseNullableNumber(salary_min);
  const salaryMax = parseNullableNumber(salary_max);
  const normalizedSalaryCurrency =
    typeof salary_currency === "string" &&
    ALLOWED_SALARY_CURRENCIES.has(salary_currency as SalaryCurrency)
      ? (salary_currency as SalaryCurrency)
      : DEFAULT_SALARY_CURRENCY;

  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return NextResponse.json({ error: "Dia diem khong hop le" }, { status: 400 });
  }

  if (Number.isNaN(salaryMin) || Number.isNaN(salaryMax)) {
    return NextResponse.json({ error: "Muc luong khong hop le" }, { status: 400 });
  }

  if (
    typeof salary_currency === "string" &&
    !ALLOWED_SALARY_CURRENCIES.has(salary_currency as SalaryCurrency)
  ) {
    return NextResponse.json({ error: "Tien te luong khong hop le" }, { status: 400 });
  }

  if (
    salaryMin !== null &&
    salaryMax !== null &&
    (salaryMin < 0 || salaryMax < 0 || salaryMax < salaryMin)
  ) {
    return NextResponse.json({ error: "Khoang luong khong hop le" }, { status: 400 });
  }

  let status = type === "job_offer" ? "pending" : "approved";
  if (type === "job_offer") {
    if (!location_name || latitude === null || longitude === null) {
      return NextResponse.json(
        { error: "Bai tuyen dung can dia diem lam viec" },
        { status: 400 }
      );
    }

    if (normalizedContacts.length === 0) {
      return NextResponse.json(
        { error: "Bai tuyen dung can it nhat mot thong tin lien lac" },
        { status: 400 }
      );
    }

    if (salaryMin === null || salaryMax === null) {
      return NextResponse.json(
        { error: "Bai tuyen dung can muc luong toi thieu va toi da" },
        { status: 400 }
      );
    }

    const modResult = await moderateContent(`${title}\n${content}`);
    if (modResult.flagged) {
      status = "rejected";
    }
  }

  if (DEMO_MODE) {
    const post = DEMO_POSTS.find((item) => item.id === params.id);
    if (!post) {
      return NextResponse.json({ error: "Khong tim thay bai dang" }, { status: 404 });
    }

    if (post.type !== type) {
      return NextResponse.json({ error: "Khong the doi loai bai dang" }, { status: 400 });
    }

    Object.assign(post, {
      title,
      content,
      email: primaryEmail,
      location_name: typeof location_name === "string" ? location_name : null,
      lat: latitude,
      lng: longitude,
      salary_min: salaryMin,
      salary_max: salaryMax,
      salary_currency: normalizedSalaryCurrency,
      job_type: type === "job_offer" ? job_type ?? null : null,
      status,
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json(post);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [{ data: profile }, { data: existingPost }] = await Promise.all([
    supabase.from("users").select("role").eq("id", user.id).single(),
    supabase.from("posts").select("id, author_id, type").eq("id", params.id).single(),
  ]);

  if (!existingPost) {
    return NextResponse.json({ error: "Khong tim thay bai dang" }, { status: 404 });
  }

  if (existingPost.author_id !== user.id) {
    return NextResponse.json({ error: "Ban khong co quyen sua bai dang nay" }, { status: 403 });
  }

  if (existingPost.type !== type) {
    return NextResponse.json({ error: "Khong the doi loai bai dang" }, { status: 400 });
  }

  if (type === "job_offer" && !canActAsRecruiter(profile?.role)) {
    return NextResponse.json(
      { error: "Chi nha tuyen dung moi co the cap nhat bai tuyen dung" },
      { status: 403 }
    );
  }

  if (type === "job_seeking" && !canActAsCandidate(profile?.role)) {
    return NextResponse.json(
      { error: "Chi ung vien moi co the cap nhat bai tim viec" },
      { status: 403 }
    );
  }

  const { data: post, error } = await supabase
    .from("posts")
    .update({
      title,
      content,
      email: primaryEmail,
      location_name: typeof location_name === "string" ? location_name : null,
      lat: latitude,
      lng: longitude,
      salary_min: salaryMin,
      salary_max: salaryMax,
      salary_currency: normalizedSalaryCurrency,
      job_type: type === "job_offer" ? job_type ?? null : null,
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(post);
}
