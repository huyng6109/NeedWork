import { createClient } from "@/lib/supabase/server";
import { ReportList } from "./ReportList";

export default async function AdminReportsPage() {
  const supabase = await createClient();

  const { data: reports } = await supabase
    .from("reports")
    .select(`
      *,
      reporter:users!reports_reporter_id_fkey(id,name,avatar_url,frame_color,role),
      post:posts!reports_target_post_id_fkey(id,title,author_id,
        author:users!posts_author_id_fkey(id,name,frame_color,role))
    `)
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-dark">Reports chờ xử lý ({reports?.length ?? 0})</h2>
      <ReportList initialReports={reports ?? []} />
    </div>
  );
}
