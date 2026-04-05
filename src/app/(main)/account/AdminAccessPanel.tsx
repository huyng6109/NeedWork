import Link from "next/link";
import { Shield } from "lucide-react";

import type { UserRole } from "@/types";
import { Button } from "@/components/ui/Button";

interface AdminAccessPanelProps {
  role: UserRole;
}

export function AdminAccessPanel({ role }: AdminAccessPanelProps) {
  if (role !== "admin") {
    return null;
  }

  return (
    <div className="rounded-xl border border-border p-4 theme-surface">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-semibold text-dark">Khu vực quản trị</div>
          <p className="mt-1 text-sm text-muted">
            Tài khoản admin đăng nhập bằng tên đăng nhập <span className="font-semibold">admin</span>.
          </p>
        </div>

        <Link href="/admin">
          <Button className="gap-2">
            <Shield size={16} />
            Vào trang admin
          </Button>
        </Link>
      </div>
    </div>
  );
}
