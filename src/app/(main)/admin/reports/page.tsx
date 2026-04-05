import { DEMO_REPORTS } from "@/lib/demo-data";
import { createClient } from "@/lib/supabase/server";
import { ReportList } from "./ReportList";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export default async function AdminReportsPage() {
  const reports = DEMO_MODE
    ? DEMO_REPORTS.filter((report) => report.status === "pending")
    : await (async () => {
        const supabase = await createClient();
        const { data } = await supabase
          .from("reports")
          .select(`
            *,
            reporter:users!reports_reporter_id_fkey(id,name,avatar_url,frame_color,role),
            post:posts!reports_target_post_id_fkey(id,title,author_id,
              author:users!posts_author_id_fkey(id,name,frame_color,role))
          `)
          .eq("status", "pending")
          .order("created_at", { ascending: true });

        return data ?? [];
      })();

  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-dark">Reports cho xu ly ({reports.length})</h2>
      <ReportList initialReports={reports} />
    </div>
  );
}
