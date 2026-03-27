"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { formatRelativeTime } from "@/lib/utils";
import type { Report } from "@/types";
import toast from "react-hot-toast";
import Link from "next/link";

interface Props {
  initialReports: Report[];
}

export function ReportList({ initialReports }: Props) {
  const [reports, setReports] = useState(initialReports);
  const [loading, setLoading] = useState<Record<string, string>>({});

  async function handle(reportId: string, status: "confirmed" | "dismissed") {
    setLoading((l) => ({ ...l, [reportId]: status }));
    const res = await fetch(`/api/admin/reports/${reportId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setLoading((l) => { const n = { ...l }; delete n[reportId]; return n; });
    if (!res.ok) { toast.error("Thao tác thất bại"); return; }
    setReports((r) => r.filter((rep) => rep.id !== reportId));
    toast.success(status === "confirmed" ? "Đã xác nhận — đã xoá viền nhà tuyển dụng" : "Đã bác bỏ report");
  }

  if (!reports.length) {
    return <p className="text-center text-muted py-12">Không có report nào chờ xử lý</p>;
  }

  return (
    <div className="space-y-3">
      {reports.map((report) => (
        <div key={report.id} className="card p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs text-muted">
            <Avatar src={report.reporter?.avatar_url} name={report.reporter?.name} size="sm" />
            <span className="font-medium text-dark">{report.reporter?.name}</span>
            <span>report bài</span>
            <Link href={`/post/${report.target_post_id}`} className="text-brand-600 hover:underline font-medium">
              {report.post?.title ?? "Xem bài"}
            </Link>
            <span className="ml-auto">{formatRelativeTime(report.created_at)}</span>
          </div>
          <div className="bg-surface rounded-lg p-3 text-sm text-dark">
            <span className="font-medium text-muted text-xs">Lý do: </span>
            {report.reason}
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="danger" loading={loading[report.id] === "confirmed"} onClick={() => handle(report.id, "confirmed")}>
              Xác nhận (xoá viền)
            </Button>
            <Button size="sm" variant="ghost" loading={loading[report.id] === "dismissed"} onClick={() => handle(report.id, "dismissed")}>
              Bác bỏ
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
