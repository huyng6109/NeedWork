"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Avatar } from "@/components/ui/Avatar";
import type { User } from "@/types";
import toast from "react-hot-toast";
import { Upload } from "lucide-react";

export default function ProfileEditPage() {
  const supabase = createClient();
  const router = useRouter();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [cvUploading, setCvUploading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/login"); return; }
      supabase.from("users").select("*").eq("id", user.id).single()
        .then(({ data }) => setProfile(data));
    });
  }, []);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setLoading(true);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        title: form.get("title"),
      }),
    });
    setLoading(false);
    if (!res.ok) { toast.error("Cập nhật thất bại"); return; }
    toast.success("Đã cập nhật hồ sơ");
    router.push(`/profile/${profile?.id}`);
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/profile/avatar", { method: "POST", body: formData });
    setAvatarUploading(false);
    if (!res.ok) { toast.error("Upload ảnh thất bại"); return; }
    const { url } = await res.json();
    setProfile((p) => p ? { ...p, avatar_url: url } : p);
    toast.success("Đã cập nhật ảnh đại diện");
  }

  async function handleCvChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCvUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/profile/cv", { method: "POST", body: formData });
    setCvUploading(false);
    if (!res.ok) { toast.error("Upload CV thất bại"); return; }
    const { url } = await res.json();
    setProfile((p) => p ? { ...p, cv_url: url } : p);
    toast.success("Đã cập nhật CV");
  }

  if (!profile) return <div className="card p-8 animate-pulse" />;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-dark">Chỉnh sửa hồ sơ</h1>

      <div className="card p-6 space-y-6">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <Avatar
            src={profile.avatar_url}
            name={profile.name}
            size="xl"
            frameColor={profile.frame_color}
          />
          <div>
            <label className="cursor-pointer inline-flex">
              <Button variant="outline" size="sm" loading={avatarUploading} type="button" className="gap-1.5 pointer-events-none">
                <Upload size={14} />
                Đổi ảnh
              </Button>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </label>
            <p className="text-xs text-muted mt-1">PNG, JPG, WebP — tối đa 2MB</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            name="name"
            label="Họ và tên"
            defaultValue={profile.name ?? ""}
            required
          />
          <Input
            name="title"
            label="Chức danh / Mô tả ngắn"
            placeholder="Vd: Frontend Developer tại ABC Corp"
            defaultValue={profile.title ?? ""}
          />

          <Button type="submit" loading={loading}>
            Lưu thay đổi
          </Button>
        </form>

        {/* CV upload (candidates only) */}
        {profile.role === "candidate" && (
          <div className="pt-4 border-t border-border">
            <label className="text-sm font-medium text-dark block mb-2">CV (PDF)</label>
            {profile.cv_url && (
              <a
                href={profile.cv_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-brand-600 hover:underline block mb-2"
              >
                Xem CV hiện tại
              </a>
            )}
            <label className="cursor-pointer inline-flex">
              <Button variant="outline" size="sm" loading={cvUploading} type="button" className="gap-1.5 pointer-events-none">
                <Upload size={14} />
                {profile.cv_url ? "Thay CV" : "Upload CV"}
              </Button>
              <input
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleCvChange}
              />
            </label>
            <p className="text-xs text-muted mt-1">PDF — tối đa 5MB</p>
          </div>
        )}
      </div>
    </div>
  );
}
