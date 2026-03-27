import { createClient } from "@/lib/supabase/server";
import { PostModerationList } from "./PostModerationList";

export default async function AdminPostsPage() {
  const supabase = await createClient();

  const { data: posts } = await supabase
    .from("posts")
    .select(`*, author:users!posts_author_id_fkey(id,name,avatar_url,frame_color)`)
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-dark">
          Bài chờ duyệt ({posts?.length ?? 0})
        </h2>
      </div>
      <PostModerationList initialPosts={posts ?? []} />
    </div>
  );
}
