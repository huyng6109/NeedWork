"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface FeedSearchToggleProps {
  value: string;
  onChange: (value: string) => void;
}

export function FeedSearchToggle({
  value,
  onChange,
}: FeedSearchToggleProps) {
  const [isOpen, setIsOpen] = useState(Boolean(value.trim()));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value.trim()) {
      setIsOpen(true);
    }
  }, [value]);

  useEffect(() => {
    if (isOpen) {
      window.requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  function toggleSearch() {
    if (isOpen && !value.trim()) {
      setIsOpen(false);
      return;
    }

    setIsOpen(true);
  }

  function closeSearch() {
    onChange("");
    setIsOpen(false);
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        className="h-10 w-10 rounded-full p-0"
        onClick={toggleSearch}
        aria-label="Mở tìm kiếm"
      >
        <Search size={16} />
      </Button>

      <div
        className={[
          "min-w-0 overflow-hidden transition-all duration-300 ease-out",
          isOpen ? "w-[220px] opacity-100 sm:w-[320px]" : "w-0 opacity-0",
        ].join(" ")}
      >
        <div className="relative">
          <Search
            size={16}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
          />
          <Input
            ref={inputRef}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Tìm bài viết..."
            className="h-11 rounded-full border-border pl-10 pr-10 focus:border-border focus:ring-0"
          />
          <button
            type="button"
            onClick={closeSearch}
            className="absolute right-3 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted transition hover:text-dark"
            aria-label="Đóng tìm kiếm"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
