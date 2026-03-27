"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ROLES } from "@/constants";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

const ROLE_OPTIONS = [
  {
    value: ROLES.CANDIDATE,
    label: "Tôi đang tìm việc",
    desc: "Ứng viên — tìm kiếm cơ hội mới",
  },
  {
    value: ROLES.RECRUITER,
    label: "Tôi đang tuyển dụng",
    desc: "Nhà tuyển dụng — tìm ứng viên phù hợp",
  },
];

export default function RegisterPage() {
  const supabase = createClient();
  const router = useRouter();
  const [role, setRole] = useState<string>(ROLES.CANDIDATE);
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = form.get("email") as string;
    const password = form.get("password") as string;
    const name = form.get("name") as string;

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      await supabase.from("users").insert({
        id: data.user.id,
        email,
        name,
        role,
        frame_color: role === ROLES.RECRUITER ? "blue" : null,
      });
    }

    setLoading(false);
    toast.success("Đăng ký thành công!");
    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-brand-600">NeedWork</h1>
          <p className="text-muted mt-1 text-sm">Tạo tài khoản mới</p>
        </div>

        <div className="card p-6 space-y-4">
          {/* Role selector */}
          <div className="grid grid-cols-2 gap-2">
            {ROLE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setRole(opt.value)}
                className={cn(
                  "p-3 rounded-xl border-2 text-left transition-all",
                  role === opt.value
                    ? "border-brand-600 bg-brand-50"
                    : "border-border bg-white hover:border-brand-300"
                )}
              >
                <div className="text-sm font-medium text-dark">{opt.label}</div>
                <div className="text-xs text-muted mt-0.5">{opt.desc}</div>
              </button>
            ))}
          </div>

          <form onSubmit={handleRegister} className="space-y-3">
            <Input
              name="name"
              label="Họ và tên"
              placeholder="Nguyễn Văn A"
              required
            />
            <Input
              name="email"
              type="email"
              label="Email"
              placeholder="you@example.com"
              required
            />
            <Input
              name="password"
              type="password"
              label="Mật khẩu"
              placeholder="Tối thiểu 6 ký tự"
              minLength={6}
              required
            />
            <Button type="submit" className="w-full" loading={loading}>
              Tạo tài khoản
            </Button>
          </form>

          <p className="text-center text-sm text-muted">
            Đã có tài khoản?{" "}
            <Link href="/login" className="text-brand-600 font-medium hover:underline">
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
