"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Send } from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/Button";

interface ApplyPostButtonProps {
  postId: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ApplyPostButton({
  postId,
  size = "md",
  className,
}: ApplyPostButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  async function handleApply() {
    setApplying(true);

    try {
      const res = await fetch(`/api/posts/${postId}/apply`, { method: "POST" });
      let message = "Nộp CV thất bại";

      try {
        const json = await res.json();
        if (typeof json?.error === "string" && json.error.trim()) {
          message = json.error;
        }
      } catch {
        // Keep the default fallback message.
      }

      if (res.status === 409) {
        setApplied(true);
        toast("Bạn đã nộp CV rồi 😉", { icon: "ℹ️" });
        return;
      }

      if (res.status === 401) {
        router.push(`/login?redirect=${encodeURIComponent(pathname || "/")}`);
        return;
      }

      if (!res.ok) {
        toast.error(message);
        return;
      }

      setApplied(true);
      toast.success("Đã nộp CV thành công!");
    } catch {
      toast.error("Nộp CV thất bại");
    } finally {
      setApplying(false);
    }
  }

  return (
    <Button
      onClick={handleApply}
      loading={applying}
      disabled={applied}
      size={size}
      className={className}
    >
      <Send size={14} />
      {applied ? "Đã nộp CV" : "Nộp CV"}
    </Button>
  );
}
