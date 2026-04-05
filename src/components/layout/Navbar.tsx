"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import type { User } from "@/types";
import { LogOut, Shield } from "lucide-react";
import { NotificationBell } from "./NotificationBell";
import { ThemeToggle } from "./ThemeToggle";

interface NavbarProps {
  user: User | null;
}

export function Navbar({ user }: NavbarProps) {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className="sticky top-0 z-40 w-full theme-nav border-b backdrop-blur">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <Link href="/" className="text-xl font-bold theme-brand shrink-0 tracking-tight">
          NeedWork
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <>
              <NotificationBell />

              <Link href="/account">
                <Avatar
                  src={user.avatar_url}
                  name={user.name}
                  size="sm"
                  frameColor={user.frame_color}
                  role={user.role}
                />
              </Link>

              {user.role === "admin" ? (
                <Link href="/admin">
                  <Button size="sm" variant="ghost" className="gap-1.5">
                    <Shield size={14} />
                    Admin
                  </Button>
                </Link>
              ) : null}

              <button
                onClick={handleLogout}
                className="text-muted hover:text-dark transition-colors p-1"
                title="Đăng xuất"
              >
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <Link href="/login">
              <Button size="sm" variant="outline">
                Đăng nhập
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
