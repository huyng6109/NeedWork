import { Navbar } from "@/components/layout/Navbar";
import { ChatInboxButton } from "@/components/layout/ChatInboxButton";
import { PinnedPostsQuickButton } from "@/components/layout/PinnedPostsQuickButton";
import { ProfileQuickButton } from "@/components/layout/ProfileQuickButton";
import { PinnedPostsProvider } from "@/components/post/PinnedPostsProvider";
import type { User } from "@/types";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

async function getProfile(): Promise<User | null> {
  if (DEMO_MODE) return null;

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) return null;

    const { data } = await supabase.from("users").select("*").eq("id", authUser.id).single();
    return data;
  } catch {
    return null;
  }
}

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfile();

  return (
    <div className="min-h-screen theme-page">
      <Navbar user={profile} />
      <PinnedPostsProvider enabled={Boolean(profile)}>
        {DEMO_MODE && (
          <div className="bg-yellow-500/15 border-b border-yellow-500/30 text-yellow-200 text-xs text-center py-1.5 px-4">
            Demo Mode - UI preview only. Connect Supabase to enable full functionality.
          </div>
        )}
        <main className="max-w-2xl mx-auto px-4 py-6">{children}</main>
        {profile ? <PinnedPostsQuickButton /> : null}
        <ProfileQuickButton />
        <ChatInboxButton />
      </PinnedPostsProvider>
    </div>
  );
}
