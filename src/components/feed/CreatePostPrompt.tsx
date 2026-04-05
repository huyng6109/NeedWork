"use client";

import Link from "next/link";
import { PenSquare } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FeedSearchToggle } from "@/components/feed/FeedSearchToggle";

interface CreatePostPromptProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
}

export function CreatePostPrompt({
  searchValue,
  onSearchChange,
}: CreatePostPromptProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <Link href="/post/create">
        <Button className="rounded-full border border-transparent bg-[var(--create-post-button-bg)] px-5 text-[var(--create-post-button-text)] hover:bg-[var(--create-post-button-hover)] active:bg-[var(--create-post-button-active)]">
          <PenSquare size={14} />
          Tạo bài viết
        </Button>
      </Link>

      <FeedSearchToggle value={searchValue} onChange={onSearchChange} />
    </div>
  );
}
