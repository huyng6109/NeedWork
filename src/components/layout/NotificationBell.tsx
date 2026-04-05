"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Bell, CheckCheck } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { cn, formatRelativeTime } from "@/lib/utils";
import { getNotificationHref, truncateNotificationBody } from "@/lib/notifications";
import type { Notification } from "@/types";

const NOTIFICATION_LIMIT = 12;

async function fetchNotifications() {
  const response = await fetch(`/api/notifications?limit=${NOTIFICATION_LIMIT}`, {
    cache: "no-store",
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error ?? "Không thể tải thông báo");
  }

  return payload as {
    data: Notification[];
    unread_count: number;
  };
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;

    async function load(initial = false) {
      if (initial) {
        setLoading(true);
      }

      try {
        const payload = await fetchNotifications();
        if (!active) return;
        setNotifications(payload.data ?? []);
        setUnreadCount(payload.unread_count ?? 0);
      } catch {
        if (active && initial) {
          toast.error("Không thể tải thông báo");
        }
      } finally {
        if (active && initial) {
          setLoading(false);
        }
      }
    }

    void load(true);

    const intervalId = window.setInterval(() => {
      void load(false);
    }, 30000);

    const handleFocus = () => {
      void load(false);
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      active = false;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  async function refreshNotifications() {
    try {
      const payload = await fetchNotifications();
      setNotifications(payload.data ?? []);
      setUnreadCount(payload.unread_count ?? 0);
    } catch {
      toast.error("Không thể tải thông báo");
    }
  }

  async function markNotificationAsRead(id: string) {
    const readAt = new Date().toISOString();
    let markedUnread = false;

    setNotifications((current) =>
      current.map((notification) => {
        if (notification.id !== id || notification.is_read) {
          return notification;
        }

        markedUnread = true;
        return {
          ...notification,
          is_read: true,
          read_at: readAt,
        };
      })
    );

    if (markedUnread) {
      setUnreadCount((current) => Math.max(0, current - 1));
    }

    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        void refreshNotifications();
      }
    } catch {
      void refreshNotifications();
    }
  }

  async function markAllAsRead() {
    if (!unreadCount) return;

    setSyncing(true);
    const readAt = new Date().toISOString();
    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        is_read: true,
        read_at: notification.read_at ?? readAt,
      }))
    );
    setUnreadCount(0);

    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ readAll: true }),
      });

      if (!response.ok) {
        toast.error("Không thể cập nhật thông báo");
        void refreshNotifications();
      }
    } catch {
      toast.error("Không thể cập nhật thông báo");
      void refreshNotifications();
    } finally {
      setSyncing(false);
    }
  }

  async function handleToggleOpen() {
    const nextOpen = !open;
    setOpen(nextOpen);

    if (!nextOpen) return;

    try {
      const payload = await fetchNotifications();
      setNotifications(payload.data ?? []);
      setUnreadCount(payload.unread_count ?? 0);
    } catch {
      toast.error("Không thể tải thông báo");
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={handleToggleOpen}
        aria-label={unreadCount ? `Thông báo, ${unreadCount} chưa đọc` : "Thông báo"}
        title="Thông báo"
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border theme-border theme-text bg-[var(--button-outline-bg)] hover:bg-[var(--button-outline-hover)] transition-colors"
      >
        <Bell size={16} />
        {unreadCount ? (
          <span className="absolute -right-1 -top-1 inline-flex min-w-[1.15rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-4 text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-11 z-50 w-[22rem] overflow-hidden rounded-2xl border border-border bg-[var(--card-bg)] shadow-xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <div className="text-sm font-semibold theme-text">Thông báo</div>
              <div className="text-xs theme-text-muted">
                {unreadCount ? `${unreadCount} chưa đọc` : "Bạn đã xem hết"}
              </div>
            </div>

            {unreadCount ? (
              <button
                type="button"
                onClick={markAllAsRead}
                disabled={syncing}
                className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium theme-text-muted transition hover:bg-[var(--button-outline-hover)] hover:text-[var(--text-primary)] disabled:opacity-60"
              >
                <CheckCheck size={14} />
                Đánh dấu đã đọc
              </button>
            ) : null}
          </div>

          <div className="max-h-[24rem] overflow-y-auto p-2">
            {loading ? (
              <div className="space-y-2 p-2">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-20 animate-pulse rounded-2xl border border-border bg-[var(--button-outline-hover)]"
                  />
                ))}
              </div>
            ) : notifications.length ? (
              <div className="space-y-2">
                {notifications.map((notification) => (
                  <Link
                    key={notification.id}
                    href={getNotificationHref(notification)}
                    onClick={() => {
                      setOpen(false);
                      if (!notification.is_read) {
                        void markNotificationAsRead(notification.id);
                      }
                    }}
                    className={cn(
                      "flex gap-3 rounded-2xl border px-3 py-3 transition",
                      notification.is_read
                        ? "border-border bg-transparent hover:bg-[var(--button-outline-hover)]"
                        : "border-brand-500/30 bg-brand-500/10 hover:bg-brand-500/15"
                    )}
                  >
                    <Avatar
                      src={notification.actor?.avatar_url ?? null}
                      name={notification.actor?.name ?? "Thông báo"}
                      size="sm"
                      frameColor={notification.actor?.frame_color ?? null}
                      role={notification.actor?.role ?? null}
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium theme-text">{notification.title}</p>
                        {!notification.is_read ? (
                          <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-brand-500" />
                        ) : null}
                      </div>

                      {notification.body ? (
                        <p className="mt-1 text-xs theme-text-muted">
                          {truncateNotificationBody(notification.body)}
                        </p>
                      ) : null}

                      <p className="mt-2 text-[11px] theme-text-muted">
                        {formatRelativeTime(notification.created_at)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="px-4 py-8 text-center">
                <p className="text-sm font-medium theme-text">Chưa có thông báo</p>
                <p className="mt-1 text-xs theme-text-muted">
                  Bình luận mới, trả lời và trạng thái CV sẽ hiện ở đây.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
