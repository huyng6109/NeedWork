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
    <div className="flex gap-1 rounded-xl border border-border bg-[var(--tab-bg)] p-1">
      {TABS.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
            active === tab.value
              ? "border border-border bg-[var(--tab-active-bg)] text-[var(--tab-active-text)] theme-tab-active-shadow font-semibold"
              : "text-[var(--tab-idle-text)] hover:text-[var(--text-primary)]"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
