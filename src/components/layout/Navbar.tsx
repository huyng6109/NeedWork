"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import type { User } from "@/types";
import { PenSquare, LogOut } from "lucide-react";

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
    <nav className="sticky top-0 z-40 w-full bg-white border-b border-border">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <Link href="/" className="text-xl font-bold text-brand-600 shrink-0">
          NeedWork
        </Link>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link href="/post/create">
                <Button size="sm" variant="outline" className="gap-1.5">
                  <PenSquare size={14} />
                  Đăng bài
                </Button>
              </Link>

              <Link href={`/profile/${user.id}`}>
                <Avatar
                  src={user.avatar_url}
                  name={user.name}
                  size="sm"
                  frameColor={user.frame_color}
                />
              </Link>

              <button
                onClick={handleLogout}
                className="text-muted hover:text-dark transition-colors p-1"
                title="Đăng xuất"
              >
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button size="sm" variant="ghost">
                  Đăng nhập
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Đăng ký</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
