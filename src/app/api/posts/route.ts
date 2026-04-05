import { NextRequest, NextResponse } from "next/server";

import { DEFAULT_SALARY_CURRENCY, FEED_PAGE_SIZE, SALARY_CURRENCY_OPTIONS } from "@/constants";
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

function normalizeSearch(value: string | null) {
  return value?.trim().toLowerCase() ?? "";
}

function matchesSearch(
  post: {
    title?: string | null;
    content?: string | null;
    location_name?: string | null;
    author?: { name?: string | null; title?: string | null } | null;
  },
  search: string
) {
  if (!search) return true;

  const haystack = [
    post.title,
    post.content,
    post.location_name,
    post.author?.name,
    post.author?.title,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(search);
}

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

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const type = searchParams.get("type") ?? "job_offer";
  const search = normalizeSearch(searchParams.get("search"));

  if (DEMO_MODE) {
    const filtered = DEMO_POSTS.filter(
      (post) => post.type === type && matchesSearch(post, search)
    );
    return NextResponse.json({ data: filtered, next_cursor: null });
  }

  const supabase = await createClient();

  const cursor = searchParams.get("cursor");
  const limit = Math.min(Number(searchParams.get("limit") ?? FEED_PAGE_SIZE), 50);
  const lat = searchParams.get("lat") ? Number(searchParams.get("lat")) : null;
  const lng = searchParams.get("lng") ? Number(searchParams.get("lng")) : null;
  const radius = Number(searchParams.get("radius") ?? 10);

  let query = supabase
    .from("posts")
    .select(
      `*, author:users!posts_author_id_fkey(id,name,title,avatar_url,frame_color,role),
       comment_count:comments(count)`
    )
    .eq("type", type)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(limit + 1);

  if (search) {
    const searchPattern = `%${search.replace(/[,%_]/g, " ").trim()}%`;
    query = query.or(
      `title.ilike.${searchPattern},content.ilike.${searchPattern},location_name.ilike.${searchPattern}`
    );
  }

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let posts = data ?? [];
  if (lat !== null && lng !== null) {
    posts = posts.filter((p) => {
      if (p.lat == null || p.lng == null) return false;
      const R = 6371;
      const dLat = ((p.lat - lat) * Math.PI) / 180;
      const dLng = ((p.lng - lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat * Math.PI) / 180) *
          Math.cos((p.lat * Math.PI) / 180) *
          Math.sin(dLng / 2) ** 2;
      const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return dist <= radius;
    });
  }

  if (search) {
    posts = posts.filter((post) => matchesSearch(post, search));
  }

  const hasMore = posts.length > limit;
  const page = posts.slice(0, limit);
  const next_cursor = hasMore ? page[page.length - 1].created_at : null;

  const normalized = page.map((p) => ({
    ...p,
    comment_count: p.comment_count?.[0]?.count ?? 0,
  }));

  return NextResponse.json({ data: normalized, next_cursor });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

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
    return NextResponse.json({ error: "Thiếu thông tin bắt buộc" }, { status: 400 });
  }

  if (type === "job_offer" && !canActAsRecruiter(profile?.role)) {
    return NextResponse.json(
      { error: "Chỉ nhà tuyển dụng mới có thể đăng tuyển dụng" },
      { status: 403 }
    );
  }

  if (type === "job_seeking" && !canActAsCandidate(profile?.role)) {
    return NextResponse.json(
      { error: "Chỉ ứng viên mới có thể đăng tìm việc" },
      { status: 403 }
    );
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
    typeof salary_currency === "string" && ALLOWED_SALARY_CURRENCIES.has(salary_currency as SalaryCurrency)
      ? (salary_currency as SalaryCurrency)
      : DEFAULT_SALARY_CURRENCY;

  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return NextResponse.json({ error: "Địa điểm không hợp lệ" }, { status: 400 });
  }

  if (Number.isNaN(salaryMin) || Number.isNaN(salaryMax)) {
    return NextResponse.json({ error: "Mức lương không hợp lệ" }, { status: 400 });
  }

  if (
    typeof salary_currency === "string" &&
    !ALLOWED_SALARY_CURRENCIES.has(salary_currency as SalaryCurrency)
  ) {
    return NextResponse.json({ error: "Tiền tệ lương không hợp lệ" }, { status: 400 });
  }

  if (
    salaryMin !== null &&
    salaryMax !== null &&
    (salaryMin < 0 || salaryMax < 0 || salaryMax < salaryMin)
  ) {
    return NextResponse.json(
      { error: "Khoảng lương không hợp lệ" },
      { status: 400 }
    );
  }

  if (type === "job_offer") {
    if (!location_name || latitude === null || longitude === null) {
      return NextResponse.json(
        { error: "Bài tuyển dụng cần địa điểm làm việc" },
        { status: 400 }
      );
    }

    if (normalizedContacts.length === 0) {
      return NextResponse.json(
        { error: "Bài tuyển dụng cần ít nhất một thông tin liên lạc" },
        { status: 400 }
      );
    }

    if (salaryMin === null || salaryMax === null) {
      return NextResponse.json(
        { error: "Bài tuyển dụng cần mức lương tối thiểu và tối đa" },
        { status: 400 }
      );
    }
  }

  let status = type === "job_offer" ? "pending" : "approved";
  if (type === "job_offer") {
    const modResult = await moderateContent(`${title}\n${content}`);
    if (modResult.flagged) {
      status = "rejected";
    }
  }

  const { data: post, error } = await supabase
    .from("posts")
    .insert({
      author_id: user.id,
      type,
      title,
      content,
      email: primaryEmail,
      location_name: typeof location_name === "string" ? location_name : null,
      lat: latitude,
      lng: longitude,
      salary_min: salaryMin,
      salary_max: salaryMax,
      salary_currency: normalizedSalaryCurrency,
      job_type: job_type ?? null,
      status,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(post, { status: 201 });
}
