import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { WARNING } from "@/constants";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createAdminClient();

  const deadline = new Date();
  deadline.setDate(deadline.getDate() - WARNING.RESPONSE_DEADLINE_DAYS);

  // Find unresponded application comments older than 7 days
  const { data: overdueComments, error } = await supabase
    .from("comments")
    .select(`post_id, posts!comments_post_id_fkey(author_id)`)
    .eq("type", "applied")
    .is("status", null)
    .lt("created_at", deadline.toISOString());

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Group by recruiter (post author)
  const recruiterCounts = new Map<string, number>();
  for (const c of overdueComments ?? []) {
    const post = c.posts as unknown as { author_id: string } | null;
    const authorId = post?.author_id;
    if (authorId) {
      recruiterCounts.set(authorId, (recruiterCounts.get(authorId) ?? 0) + 1);
    }
  }

  // Increment warning_count for each recruiter
  const updates = await Promise.all(
    Array.from(recruiterCounts.keys()).map(async (recruiterId) => {
      const { data } = await supabase
        .from("users")
        .select("warning_count, email")
        .eq("id", recruiterId)
        .single();

      if (!data) return null;

      await supabase
        .from("users")
        .update({ warning_count: data.warning_count + 1 })
        .eq("id", recruiterId);

      // TODO: Send email notification via Supabase Edge Function or Resend
      // For now, log it
      console.log(`Warning sent to recruiter ${recruiterId} (${data.email})`);

      return recruiterId;
    })
  );

  return NextResponse.json({ processed: updates.filter(Boolean).length });
}
