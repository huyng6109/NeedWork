"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Flag } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import { cn } from "@/lib/utils";

interface ReportPostButtonProps {
  postId: string;
  mode?: "icon" | "button";
  className?: string;
}

export function ReportPostButton({
  postId,
  mode = "button",
  className,
}: ReportPostButtonProps) {
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [checking, setChecking] = useState(false);
  const [reporting, setReporting] = useState(false);

  async function handleOpen() {
    setChecking(true);

    try {
      const response = await fetch(`/api/reports?post_id=${encodeURIComponent(postId)}`, {
        method: "GET",
        cache: "no-store",
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        toast.error(payload?.error ?? "Bạn không thể report bài viết này");
        return;
      }

      setReportOpen(true);
    } finally {
      setChecking(false);
    }
  }

  async function handleReport() {
    if (!reportReason.trim()) {
      toast.error("Vui lòng nhập lý do report");
      return;
    }

    setReporting(true);

    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: postId, reason: reportReason }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        toast.error(payload?.error ?? "Report thất bại");
        return;
      }

      setReportOpen(false);
      setReportReason("");
      toast.success("Đã gửi report thành công, admin sẽ xem xét");
    } finally {
      setReporting(false);
    }
  }

  return (
    <>
      {mode === "icon" ? (
        <button
          type="button"
          aria-label="Report"
          title="Report"
          disabled={checking}
          onClick={() => void handleOpen()}
          className={cn(
            "inline-flex h-8 w-8 items-center justify-center rounded-full border border-border theme-input theme-text-muted transition-colors",
            "hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-60",
            className
          )}
        >
          <Flag size={14} />
        </button>
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="md"
          disabled={checking}
          className={cn("gap-1.5 text-muted hover:text-red-600", className)}
          onClick={() => void handleOpen()}
        >
          <Flag size={14} />
          Report
        </Button>
      )}

      <Modal open={reportOpen} onClose={() => setReportOpen(false)} title="Report bài đăng">
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Mô tả lý do bạn cho rằng bài đăng này không trung thực hoặc có dấu hiệu bất thường.
          </p>
          <Textarea
            value={reportReason}
            onChange={(event) => setReportReason(event.target.value)}
            placeholder="Ví dụ: Thông tin trao đổi thực tế không khớp với nội dung tuyển dụng..."
            rows={4}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setReportOpen(false)}>
              Huỷ
            </Button>
            <Button type="button" variant="danger" loading={reporting} onClick={() => void handleReport()}>
              Gửi report
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
