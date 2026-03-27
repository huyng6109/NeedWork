"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import type { Post, User } from "@/types";
import toast from "react-hot-toast";
import { Flag, Send } from "lucide-react";

interface PostActionsProps {
  post: Post;
  currentUser: User | null;
  isOwner: boolean;
}

export function PostActions({ post, currentUser, isOwner }: PostActionsProps) {
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reporting, setReporting] = useState(false);

  const isCandidate = currentUser?.role === "candidate";
  const isJobOffer = post.type === "job_offer";

  async function handleApply() {
    setApplying(true);
    const res = await fetch(`/api/posts/${post.id}/apply`, { method: "POST" });
    setApplying(false);
    if (res.status === 409) {
      toast("Bạn đã nộp CV rồi", { icon: "ℹ️" });
      return;
    }
    if (!res.ok) {
      toast.error("Nộp CV thất bại");
      return;
    }
    setApplied(true);
    toast.success("Đã nộp CV thành công!");
  }

  async function handleReport() {
    if (!reportReason.trim()) {
      toast.error("Vui lòng nhập lý do report");
      return;
    }
    setReporting(true);
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ post_id: post.id, reason: reportReason }),
    });
    setReporting(false);
    if (!res.ok) {
      toast.error("Report thất bại");
      return;
    }
    setReportOpen(false);
    setReportReason("");
    toast.success("Đã gửi report thành công, admin sẽ xem xét");
  }

  if (!currentUser) return null;
  if (isOwner) return null;

  return (
    <div className="flex gap-2 pt-2 border-t border-border">
      {isJobOffer && isCandidate && (
        <Button
          onClick={handleApply}
          loading={applying}
          disabled={applied}
          className="gap-1.5"
        >
          <Send size={14} />
          {applied ? "Đã nộp CV" : "Nộp CV"}
        </Button>
      )}

      {isJobOffer && isCandidate && (
        <>
          <Button
            variant="ghost"
            size="md"
            className="gap-1.5 text-muted hover:text-red-600"
            onClick={() => setReportOpen(true)}
          >
            <Flag size={14} />
            Report
          </Button>

          <Modal
            open={reportOpen}
            onClose={() => setReportOpen(false)}
            title="Report bài đăng"
          >
            <div className="space-y-4">
              <p className="text-sm text-muted">
                Mô tả lý do bạn cho rằng bài đăng này không trung thực.
              </p>
              <Textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Vd: Thông tin lương không khớp với thực tế..."
                rows={4}
              />
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" onClick={() => setReportOpen(false)}>
                  Huỷ
                </Button>
                <Button
                  variant="danger"
                  loading={reporting}
                  onClick={handleReport}
                >
                  Gửi report
                </Button>
              </div>
            </div>
          </Modal>
        </>
      )}
    </div>
  );
}
