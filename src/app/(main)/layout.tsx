import { Navbar } from "@/components/layout/Navbar";
import type { User } from "@/types";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

async function getProfile(): Promise<User | null> {
  if (DEMO_MODE) return null;
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
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
    <div className="min-h-screen bg-surface">
      <Navbar user={profile} />
      {DEMO_MODE && (
        <div className="bg-yellow-50 border-b border-yellow-200 text-yellow-800 text-xs text-center py-1.5 px-4">
          🚧 Demo Mode — UI preview only. Connect Supabase to enable full functionality.
        </div>
      )}
      <main className="max-w-2xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
