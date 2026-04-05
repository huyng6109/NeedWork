import { NextRequest, NextResponse } from "next/server";
import { APPLICATION_AUTO_COMMENT } from "@/constants";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { DEMO_POSTS, DEMO_USERS } from "@/lib/demo-data";
import { NOTIFICATION_TYPES } from "@/lib/notifications";
import type { Comment } from "@/types";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

const getDemoUser = (id: string) =>
  DEMO_USERS.find((user) => user.id === id) ?? null;

const DEMO_COMMENTS: Record<string, Comment[]> = {
  "demo-post-1": [
    {
      id: "c1",
      post_id: "demo-post-1",
      author_id: "demo-candidate-1",
      author: getDemoUser("demo-candidate-1") ?? undefined,
      content: APPLICATION_AUTO_COMMENT,
      type: "applied",
      status: "approved",
      has_applied: true,
      responded_at: new Date().toISOString(),
      created_at: new Date(Date.now() - 3600000).toISOString(),
      reply_to_comment_id: null,
      reply_to_author_name: null,
    },
    {
      id: "c2",
      post_id: "demo-post-1",
      author_id: "demo-candidate-2",
      author: getDemoUser("demo-candidate-2") ?? undefined,
      content: APPLICATION_AUTO_COMMENT,
      type: "applied",
      status: "rejected",
      has_applied: true,
      responded_at: new Date().toISOString(),
      created_at: new Date(Date.now() - 1800000).toISOString(),
      reply_to_comment_id: null,
      reply_to_author_name: null,
    },
    {
      id: "c3",
      post_id: "demo-post-1",
      author_id: "demo-candidate-1",
      author: getDemoUser("demo-candidate-1") ?? undefined,
      content: "Cho mình hỏi công ty có hỗ trợ visa không ạ?",
      type: "normal",
      status: null,
      has_applied: false,
      responded_at: null,
      created_at: new Date(Date.now() - 900000).toISOString(),
      reply_to_comment_id: null,
      reply_to_author_name: null,
    },
    {
      id: "c11",
      post_id: "demo-post-1",
      author_id: "demo-recruiter-1",
      author: getDemoUser("demo-recruiter-1") ?? undefined,
      content:
        "Bên anh có hỗ trợ visa cho ứng viên phù hợp, em có thể inbox thêm CV chi tiết.",
      type: "normal",
      status: null,
      has_applied: false,
      responded_at: null,
      created_at: new Date(Date.now() - 600000).toISOString(),
      reply_to_comment_id: "c3",
      reply_to_author_name: "Lê Quang Huy",
    },
  ],
  "demo-post-2": [
    {
      id: "c4",
      post_id: "demo-post-2",
      author_id: "demo-candidate-2",
      author: getDemoUser("demo-candidate-2") ?? undefined,
      content: APPLICATION_AUTO_COMMENT,
      type: "applied",
      status: "rejected",
      has_applied: true,
      responded_at: new Date().toISOString(),
      created_at: new Date(Date.now() - 7200000).toISOString(),
      reply_to_comment_id: null,
      reply_to_author_name: null,
    },
    {
      id: "c5",
      post_id: "demo-post-2",
      author_id: "demo-candidate-1",
      author: getDemoUser("demo-candidate-1") ?? undefined,
      content: "Vị trí này remote được không anh/chị?",
      type: "normal",
      status: null,
      has_applied: false,
      responded_at: null,
      created_at: new Date(Date.now() - 3600000).toISOString(),
      reply_to_comment_id: null,
      reply_to_author_name: null,
    },
    {
      id: "c12",
      post_id: "demo-post-2",
      author_id: "demo-recruiter-2",
      author: getDemoUser("demo-recruiter-2") ?? undefined,
      content:
        "Vị trí này hybrid 3 ngày tại văn phòng, chưa hỗ trợ remote full-time em nhé.",
      type: "normal",
      status: null,
      has_applied: false,
      responded_at: null,
      created_at: new Date(Date.now() - 3000000).toISOString(),
      reply_to_comment_id: "c5",
      reply_to_author_name: "Lê Quang Huy",
    },
  ],
  "demo-post-3": [
    {
      id: "c6",
      post_id: "demo-post-3",
      author_id: "demo-candidate-1",
      author: getDemoUser("demo-candidate-1") ?? undefined,
      content: APPLICATION_AUTO_COMMENT,
      type: "applied",
      status: "rejected",
      has_applied: true,
      responded_at: new Date().toISOString(),
      created_at: new Date(Date.now() - 5400000).toISOString(),
      reply_to_comment_id: null,
      reply_to_author_name: null,
    },
    {
      id: "c7",
      post_id: "demo-post-3",
      author_id: "demo-candidate-2",
      author: getDemoUser("demo-candidate-2") ?? undefined,
      content: APPLICATION_AUTO_COMMENT,
      type: "applied",
      status: null,
      has_applied: true,
      responded_at: null,
      created_at: new Date(Date.now() - 2400000).toISOString(),
      reply_to_comment_id: null,
      reply_to_author_name: null,
    },
    {
      id: "c13",
      post_id: "demo-post-3",
      author_id: "demo-recruiter-3",
      author: getDemoUser("demo-recruiter-3") ?? undefined,
      content:
        "Chị đã nhận được hồ sơ, trong hôm nay team sẽ phản hồi lịch trao đổi vòng đầu.",
      type: "normal",
      status: null,
      has_applied: false,
      responded_at: null,
      created_at: new Date(Date.now() - 1800000).toISOString(),
      reply_to_comment_id: "c7",
      reply_to_author_name: "Phạm Thị Lan",
    },
  ],
  "demo-post-4": [
    {
      id: "c8",
      post_id: "demo-post-4",
      author_id: "demo-candidate-1",
      author: getDemoUser("demo-candidate-1") ?? undefined,
      content: APPLICATION_AUTO_COMMENT,
      type: "applied",
      status: "rejected",
      has_applied: true,
      responded_at: new Date().toISOString(),
      created_at: new Date(Date.now() - 4600000).toISOString(),
      reply_to_comment_id: null,
      reply_to_author_name: null,
    },
  ],
  "demo-post-10": [
    {
      id: "c9",
      post_id: "demo-post-10",
      author_id: "demo-candidate-2",
      author: getDemoUser("demo-candidate-2") ?? undefined,
      content: APPLICATION_AUTO_COMMENT,
      type: "applied",
      status: "approved",
      has_applied: true,
      responded_at: new Date().toISOString(),
      created_at: new Date(Date.now() - 8600000).toISOString(),
      reply_to_comment_id: null,
      reply_to_author_name: null,
    },
    {
      id: "c10",
      post_id: "demo-post-10",
      author_id: "demo-candidate-1",
      author: getDemoUser("demo-candidate-1") ?? undefined,
      content: APPLICATION_AUTO_COMMENT,
      type: "applied",
      status: "rejected",
      has_applied: true,
      responded_at: new Date().toISOString(),
      created_at: new Date(Date.now() - 6600000).toISOString(),
      reply_to_comment_id: null,
      reply_to_author_name: null,
    },
    {
      id: "c14",
      post_id: "demo-post-10",
      author_id: "demo-recruiter-4",
      author: getDemoUser("demo-recruiter-4") ?? undefined,
      content:
        "Anh cảm ơn em đã apply, hiện team đang ưu tiên ứng viên có kinh nghiệm AWS production sâu hơn.",
      type: "normal",
      status: null,
      has_applied: false,
      responded_at: null,
      created_at: new Date(Date.now() - 6200000).toISOString(),
      reply_to_comment_id: "c10",
      reply_to_author_name: "Lê Quang Huy",
    },
  ],
};

Object.assign(DEMO_COMMENTS, {
  "demo-post-17": [
    {
      id: "c17a",
      post_id: "demo-post-17",
      author_id: "demo-candidate-3",
      author: getDemoUser("demo-candidate-3") ?? undefined,
      content: APPLICATION_AUTO_COMMENT,
      type: "applied",
      status: null,
      has_applied: true,
      application_cv_url: "/mock-cvs/nguyen-huu-phuc-backend.txt",
      responded_at: null,
      created_at: new Date(Date.now() - 3 * 3600000).toISOString(),
      reply_to_comment_id: null,
      reply_to_author_name: null,
    },
    {
      id: "c17b",
      post_id: "demo-post-17",
      author_id: "demo-candidate-4",
      author: getDemoUser("demo-candidate-4") ?? undefined,
      content: "Cho minh hoi team support hien dang lam theo khung gio nao?",
      type: "normal",
      status: null,
      has_applied: false,
      responded_at: null,
      created_at: new Date(Date.now() - 150 * 60000).toISOString(),
      reply_to_comment_id: null,
      reply_to_author_name: null,
    },
  ],
  "demo-post-18": [
    {
      id: "c18a",
      post_id: "demo-post-18",
      author_id: "demo-candidate-4",
      author: getDemoUser("demo-candidate-4") ?? undefined,
      content: APPLICATION_AUTO_COMMENT,
      type: "applied",
      status: "approved",
      has_applied: true,
      application_cv_url: "/mock-cvs/tran-thu-trang-qa.txt",
      responded_at: new Date(Date.now() - 7 * 3600000).toISOString(),
      created_at: new Date(Date.now() - 8 * 3600000).toISOString(),
      reply_to_comment_id: null,
      reply_to_author_name: null,
    },
    {
      id: "c18b",
      post_id: "demo-post-18",
      author_id: "demo-recruiter-8",
      author: getDemoUser("demo-recruiter-8") ?? undefined,
      content: "Team da gui lich trao doi vong 1 qua email, em kiem tra giup chi nhe.",
      type: "normal",
      status: null,
      has_applied: false,
      responded_at: null,
      created_at: new Date(Date.now() - 6 * 3600000).toISOString(),
      reply_to_comment_id: "c18a",
      reply_to_author_name: "Tran Thu Trang",
    },
  ],
  "demo-post-19": [
    {
      id: "c19a",
      post_id: "demo-post-19",
      author_id: "demo-candidate-5",
      author: getDemoUser("demo-candidate-5") ?? undefined,
      content: APPLICATION_AUTO_COMMENT,
      type: "applied",
      status: "rejected",
      has_applied: true,
      application_cv_url: "/mock-cvs/le-gia-han-marketing.txt",
      responded_at: new Date(Date.now() - 10 * 3600000).toISOString(),
      created_at: new Date(Date.now() - 11 * 3600000).toISOString(),
      reply_to_comment_id: null,
      reply_to_author_name: null,
    },
  ],
  "demo-post-20": [
    {
      id: "c20a",
      post_id: "demo-post-20",
      author_id: "demo-candidate-1",
      author: getDemoUser("demo-candidate-1") ?? undefined,
      content: APPLICATION_AUTO_COMMENT,
      type: "applied",
      status: "approved",
      has_applied: true,
      application_cv_url: "/mock-cvs/le-quang-huy-frontend.txt",
      responded_at: new Date(Date.now() - 13 * 3600000).toISOString(),
      created_at: new Date(Date.now() - 14 * 3600000).toISOString(),
      reply_to_comment_id: null,
      reply_to_author_name: null,
    },
    {
      id: "c20b",
      post_id: "demo-post-20",
      author_id: "demo-recruiter-3",
      author: getDemoUser("demo-recruiter-3") ?? undefined,
      content: "Ben chi da chia se JD chi tiet va bai test nho, em xem mail giup chi.",
      type: "normal",
      status: null,
      has_applied: false,
      responded_at: null,
      created_at: new Date(Date.now() - 12 * 3600000).toISOString(),
      reply_to_comment_id: "c20a",
      reply_to_author_name: "LÃª Quang Huy",
    },
  ],
  "demo-post-21": [
    {
      id: "c21a",
      post_id: "demo-post-21",
      author_id: "demo-candidate-2",
      author: getDemoUser("demo-candidate-2") ?? undefined,
      content: APPLICATION_AUTO_COMMENT,
      type: "applied",
      status: null,
      has_applied: true,
      application_cv_url: "/mock-cvs/pham-thi-lan-designer.txt",
      responded_at: null,
      created_at: new Date(Date.now() - 19 * 3600000).toISOString(),
      reply_to_comment_id: null,
      reply_to_author_name: null,
    },
    {
      id: "c21b",
      post_id: "demo-post-21",
      author_id: "demo-candidate-3",
      author: getDemoUser("demo-candidate-3") ?? undefined,
      content: APPLICATION_AUTO_COMMENT,
      type: "applied",
      status: "approved",
      has_applied: true,
      application_cv_url: "/mock-cvs/nguyen-huu-phuc-backend.txt",
      responded_at: new Date(Date.now() - 17 * 3600000).toISOString(),
      created_at: new Date(Date.now() - 18 * 3600000).toISOString(),
      reply_to_comment_id: null,
      reply_to_author_name: null,
    },
    {
      id: "c21c",
      post_id: "demo-post-21",
      author_id: "demo-candidate-4",
      author: getDemoUser("demo-candidate-4") ?? undefined,
      content: APPLICATION_AUTO_COMMENT,
      type: "applied",
      status: "rejected",
      has_applied: true,
      application_cv_url: "/mock-cvs/tran-thu-trang-qa.txt",
      responded_at: new Date(Date.now() - 16 * 3600000).toISOString(),
      created_at: new Date(Date.now() - 17 * 3600000).toISOString(),
      reply_to_comment_id: null,
      reply_to_author_name: null,
    },
  ],
  "demo-post-22": [
    {
      id: "c22a",
      post_id: "demo-post-22",
      author_id: "demo-candidate-5",
      author: getDemoUser("demo-candidate-5") ?? undefined,
      content: APPLICATION_AUTO_COMMENT,
      type: "applied",
      status: "approved",
      has_applied: true,
      application_cv_url: "/mock-cvs/le-gia-han-marketing.txt",
      responded_at: new Date(Date.now() - 21 * 3600000).toISOString(),
      created_at: new Date(Date.now() - 22 * 3600000).toISOString(),
      reply_to_comment_id: null,
      reply_to_author_name: null,
    },
  ],
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (DEMO_MODE) {
    const comments = DEMO_COMMENTS[params.id] ?? [];
    return NextResponse.json({ data: comments, next_cursor: null });
  }

  const supabase = await createClient();
  const { searchParams } = req.nextUrl;
  const cursor = searchParams.get("cursor");
  const limit = 20;
  const [
    {
      data: { user },
    },
    { data: post },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("posts").select("author_id").eq("id", params.id).maybeSingle(),
  ]);
  const isPostAuthor = post?.author_id === user?.id;

  let query = supabase
    .from("comments")
    .select(
      `*, author:users!comments_author_id_fkey(id,name,avatar_url,frame_color,role)`
    )
    .eq("post_id", params.id)
    .order("created_at", { ascending: true })
    .limit(limit + 1);

  if (cursor) query = query.gt("created_at", cursor);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const hasMore = (data?.length ?? 0) > limit;
  const page = (data ?? []).slice(0, limit);
  const next_cursor = hasMore ? page[page.length - 1].created_at : null;

  let myApplications: string[] = [];
  if (user) {
    const { data: apps } = await supabase
      .from("applications")
      .select("candidate_id")
      .eq("post_id", params.id);
    myApplications = (apps ?? []).map((application) => application.candidate_id);
  }

  const appliedAuthorIds = Array.from(
    new Set(
      page
        .filter((comment) => comment.type === "applied")
        .map((comment) => comment.author_id)
    )
  );

  let cvUrlByAuthor = new Map<string, string | null>();
  if (isPostAuthor && appliedAuthorIds.length) {
    const { data: applicants } = await supabase
      .from("users")
      .select("id, cv_url")
      .in("id", appliedAuthorIds);

    cvUrlByAuthor = new Map(
      (applicants ?? []).map((applicant) => [applicant.id, applicant.cv_url ?? null])
    );
  }

  const normalized = page.map((comment) => ({
    ...comment,
    has_applied: comment.type === "applied" || myApplications.includes(comment.author_id),
    application_cv_url:
      isPostAuthor && comment.type === "applied"
        ? cvUrlByAuthor.get(comment.author_id) ?? null
        : null,
  }));

  return NextResponse.json({ data: normalized, next_cursor });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { content, replyToCommentId, replyToAuthorName } = await req.json();

  if (!content?.trim()) {
    return NextResponse.json(
      { error: "Nội dung không được trống" },
      { status: 400 }
    );
  }

  if (DEMO_MODE) {
    const post = DEMO_POSTS.find((item) => item.id === params.id);
    const author = post ? getDemoUser(post.author_id) : null;

    if (!post || !author) {
      return NextResponse.json({ error: "Không tìm thấy bài viết" }, { status: 404 });
    }

    const newComment: Comment = {
      id: `demo-reply-${Date.now()}`,
      post_id: params.id,
      author_id: author.id,
      author: author ?? undefined,
      content: content.trim(),
      type: "normal",
      status: null,
      responded_at: null,
      created_at: new Date().toISOString(),
      has_applied: false,
      reply_to_comment_id: replyToCommentId ?? null,
      reply_to_author_name: replyToAuthorName ?? null,
    };

    DEMO_COMMENTS[params.id] = [...(DEMO_COMMENTS[params.id] ?? []), newComment];
    return NextResponse.json(newComment, { status: 201 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [{ data: authorProfile }, { data: post }, { data: replyTarget }] = await Promise.all([
    supabase.from("users").select("name").eq("id", user.id).single(),
    supabase
      .from("posts")
      .select("id, title, author_id")
      .eq("id", params.id)
      .single(),
    replyToCommentId
      ? supabase
          .from("comments")
          .select("id, author_id")
          .eq("id", replyToCommentId)
          .single()
      : Promise.resolve({ data: null, error: null }),
  ]);

  const { data, error } = await supabase
    .from("comments")
    .insert({
      post_id: params.id,
      author_id: user.id,
      content: content.trim(),
      reply_to_comment_id: replyToCommentId ?? null,
      reply_to_author_name: replyToAuthorName ?? null,
    })
    .select(
      `*, author:users!comments_author_id_fkey(id,name,avatar_url,frame_color,role)`
    )
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const actorName = authorProfile?.name?.trim() || "Một người dùng";
  const notifications = [];

  if (replyTarget?.author_id && replyTarget.author_id !== user.id) {
    notifications.push({
      user_id: replyTarget.author_id,
      actor_id: user.id,
      type: NOTIFICATION_TYPES.COMMENT_REPLY,
      title: `${actorName} đã trả lời bình luận của bạn`,
      body: content.trim(),
      post_id: params.id,
      comment_id: data.id,
      application_id: null,
    });
  }

  if (
    post?.author_id &&
    post.author_id !== user.id &&
    post.author_id !== replyTarget?.author_id
  ) {
    notifications.push({
      user_id: post.author_id,
      actor_id: user.id,
      type: NOTIFICATION_TYPES.POST_COMMENT,
      title: `${actorName} đã bình luận bài viết của bạn`,
      body: content.trim(),
      post_id: params.id,
      comment_id: data.id,
      application_id: null,
    });
  }

  if (notifications.length) {
    const admin = await createAdminClient();
    await admin.from("notifications").insert(notifications);
  }

  return NextResponse.json(data, { status: 201 });
}
