"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function BackToFeedButton() {
  const router = useRouter();

  function handleBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/");
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      aria-label="Quay về newsfeed"
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border theme-input theme-text hover:bg-[var(--button-outline-hover)] transition-colors"
    >
      <ArrowLeft size={16} />
    </button>
  );
}
