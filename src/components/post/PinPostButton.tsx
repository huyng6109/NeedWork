"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Pin } from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { usePinnedPosts } from "./PinnedPostsProvider";

interface PinPostButtonProps {
  className?: string;
  mode?: "icon" | "button";
  onPinnedChange?: (pinned: boolean) => void;
  postId: string;
}

export function PinPostButton({
  className,
  mode = "icon",
  onPinnedChange,
  postId,
}: PinPostButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isPinned, togglePin } = usePinnedPosts();
  const [pending, setPending] = useState(false);

  const pinned = isPinned(postId);

  async function handleToggle() {
    setPending(true);
    const result = await togglePin(postId);
    setPending(false);

    if (result.requiresAuth) {
      router.push(`/login?redirect=${encodeURIComponent(pathname || "/")}`);
      return;
    }

    if (result.error) {
      toast.error(result.error);
      return;
    }

    onPinnedChange?.(result.pinned);
    toast.success(result.pinned ? "Đã ghim bài viết" : "Đã bỏ ghim bài viết");
  }

  if (mode === "button") {
    return (
      <Button
        type="button"
        variant={pinned ? "secondary" : "outline"}
        size="sm"
        loading={pending}
        onClick={() => void handleToggle()}
        className={cn("gap-1.5", className)}
      >
        <Pin size={14} />
        {pinned ? "Bỏ ghim" : "Ghim"}
      </Button>
    );
  }

  return (
    <button
      type="button"
      aria-label={pinned ? "Bỏ ghim bài viết" : "Ghim bài viết"}
      title={pinned ? "Bỏ ghim bài viết" : "Ghim bài viết"}
      disabled={pending}
      onClick={() => void handleToggle()}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-full border transition-colors",
        pinned
          ? "border-brand-500/50 bg-brand-500/15 text-brand-300"
          : "border-border theme-input theme-text-muted hover:text-brand-400",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
    >
      <Pin size={14} />
    </button>
  );
}
