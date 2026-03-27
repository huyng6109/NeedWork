import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const { data: users } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-dark">Người dùng ({users?.length ?? 0})</h2>

      <div className="card divide-y divide-border">
        {(users ?? []).map((user) => (
          <div key={user.id} className="flex items-center gap-3 p-4">
            <Avatar src={user.avatar_url} name={user.name} size="sm" frameColor={user.frame_color} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm text-dark truncate">{user.name ?? "Chưa đặt tên"}</span>
                <Badge variant={user.role === "recruiter" ? "blue" : user.role === "admin" ? "warning" : "gray"}>
                  {user.role === "recruiter" ? "Tuyển dụng" : user.role === "admin" ? "Admin" : "Ứng viên"}
                </Badge>
                {user.warning_count > 0 && (
                  <span className="flex items-center gap-0.5 text-orange-600 text-xs">
                    <AlertTriangle size={11} />
                    {user.warning_count} cảnh báo
                  </span>
                )}
              </div>
              <div className="text-xs text-muted">{user.email} · {formatDate(user.created_at)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
