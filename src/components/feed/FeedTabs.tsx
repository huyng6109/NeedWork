"use client";

import { cn } from "@/lib/utils";
import type { PostType } from "@/types";

interface FeedTabsProps {
  active: PostType;
  onChange: (tab: PostType) => void;
}

const TABS: { value: PostType; label: string }[] = [
  { value: "job_offer", label: "Tuyển dụng" },
  { value: "job_seeking", label: "Tìm việc" },
];

export function FeedTabs({ active, onChange }: FeedTabsProps) {
  return (
    <div className="flex gap-1 bg-surface rounded-xl p-1 border border-border">
      {TABS.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
            active === tab.value
              ? "bg-white text-brand-600 shadow-card"
              : "text-muted hover:text-dark"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
