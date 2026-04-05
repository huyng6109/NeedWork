"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ADMIN_USERNAME } from "@/lib/auth/admin";
import { TRUST_RING } from "@/constants";
import { createClient } from "@/lib/supabase/client";

type AuthMode = "login" | "register";

interface AuthFormProps {
  initialMode: AuthMode;
  redirectTo: string;
}

function toDisplayName(email: string) {
  const localPart = email.split("@")[0]?.trim();
  return localPart || null;
}

function extractErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "Không thể tiếp tục";
}

function getFriendlyAuthErrorMessage(error: unknown, mode: AuthMode) {
  const message = extractErrorMessage(error);

  if (mode === "login" && /invalid login credentials/i.test(message)) {
    return "Email hoặc mật khẩu không đúng";
  }

  if (mode === "login" && /email not confirmed/i.test(message)) {
    return "Email chưa được xác nhận. Vui lòng mở email xác nhận mới nhất.";
  }

  if (/already registered/i.test(message) || /already been registered/i.test(message)) {
    return "Email này đã được đăng ký";
  }

  if (/relation .*users.* does not exist/i.test(message)) {
    return "Thiếu bảng public.users trong Supabase. Hãy chạy file supabase/schema.sql.";
  }

  if (/row-level security|permission denied|new row violates row-level security/i.test(message)) {
    return "Bảng public.users đang thiếu policy phù hợp. Hãy chạy lại supabase/schema.sql.";
  }

  return message;
}

export function AuthForm({ initialMode, redirectTo }: AuthFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function ensureProfile() {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user?.id || !user.email) {
      return;
    }

    const { error } = await supabase.from("users").upsert(
      {
        id: user.id,
        email: user.email,
        name: toDisplayName(user.email),
        role: "candidate",
        frame_color: TRUST_RING.FRAME_COLOR,
      },
      { onConflict: "id", ignoreDuplicates: true }
    );

    if (error) {
      throw error;
    }
  }

  async function resolveLoginEmail(value: string) {
    const normalizedValue = value.trim().toLowerCase();

    if (!normalizedValue) {
      return "";
    }

    if (normalizedValue.includes("@")) {
      return normalizedValue;
    }

    if (normalizedValue !== ADMIN_USERNAME) {
      throw new Error("Invalid login credentials");
    }

    const { data, error } = await supabase
      .from("users")
      .select("email")
      .eq("role", "admin")
      .eq("username", ADMIN_USERNAME)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data?.email) {
      throw new Error("Invalid login credentials");
    }

    return data.email.trim().toLowerCase();
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedIdentifier = identifier.trim().toLowerCase();

    if (!normalizedIdentifier || !password) {
      toast.error("Vui lòng nhập email và mật khẩu");
      return;
    }

    if (mode === "register") {
      if (!normalizedIdentifier.includes("@")) {
        toast.error("Vui lòng nhập email hợp lệ");
        return;
      }

      if (password.length < 6) {
        toast.error("Mật khẩu cần ít nhất 6 ký tự");
        return;
      }

      if (password !== confirmPassword) {
        toast.error("Mật khẩu xác nhận không khớp");
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === "login") {
        const loginEmail = await resolveLoginEmail(normalizedIdentifier);

        const { error } = await supabase.auth.signInWithPassword({
          email: loginEmail,
          password,
        });

        if (error) {
          throw error;
        }

        await ensureProfile();
        toast.success("Đăng nhập thành công");
        router.replace(redirectTo);
        router.refresh();
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: normalizedIdentifier,
        password,
        options: {
          emailRedirectTo:
            typeof window !== "undefined"
              ? window.location.origin
              : undefined,
        },
      });

      if (error) {
        throw error;
      }

      if (data.session) {
        await ensureProfile();
        toast.success("Tài khoản đã được tạo");
        router.replace(redirectTo);
        router.refresh();
        return;
      }

      toast.success("Đăng ký thành công. Mở email xác nhận để kích hoạt tài khoản.");
      setMode("login");
      setConfirmPassword("");
    } catch (error) {
      console.error("Auth flow failed", error);
      toast.error(getFriendlyAuthErrorMessage(error, mode));
    } finally {
      setLoading(false);
    }
  }

  const isRegisterMode = mode === "register";
  const title = isRegisterMode ? "Tạo tài khoản" : "Đăng nhập";
  const subtitle = isRegisterMode
    ? "Đăng ký bằng email và mật khẩu để bắt đầu dùng NeedWork."
    : "Đăng nhập bằng tên đăng nhập hoặc email để tiếp tục.";

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold theme-brand tracking-tight">
            NeedWork
          </Link>
          <p className="theme-text-muted mt-2 text-sm">{subtitle}</p>
        </div>

        <div className="card p-6 space-y-5">
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-border p-1 bg-[var(--tab-bg)]">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={
                mode === "login"
                  ? "rounded-lg bg-[var(--tab-active-bg)] px-4 py-2 text-sm font-semibold theme-text"
                  : "rounded-lg px-4 py-2 text-sm font-medium theme-text-muted hover:text-[var(--text-primary)]"
              }
            >
              Đăng nhập
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              className={
                mode === "register"
                  ? "rounded-lg bg-[var(--tab-active-bg)] px-4 py-2 text-sm font-semibold theme-text"
                  : "rounded-lg px-4 py-2 text-sm font-medium theme-text-muted hover:text-[var(--text-primary)]"
              }
            >
              Đăng ký
            </button>
          </div>

          <div>
            <h1 className="text-xl font-semibold theme-text">{title}</h1>
            <p className="mt-1 text-sm theme-text-muted">{subtitle}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label={isRegisterMode ? "Email" : "Tên đăng nhập hoặc email"}
              type={isRegisterMode ? "email" : "text"}
              autoComplete={isRegisterMode ? "email" : "username"}
              placeholder={isRegisterMode ? "ban@example.com" : "Nhập tên đăng nhập hoặc email"}
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              required
            />

            <Input
              label="Mật khẩu"
              type="password"
              autoComplete={isRegisterMode ? "new-password" : "current-password"}
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />

            {isRegisterMode && (
              <Input
                label="Xác nhận mật khẩu"
                type="password"
                autoComplete="new-password"
                placeholder="Nhập lại mật khẩu"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
              />
            )}

            <Button type="submit" className="w-full" loading={loading}>
              {isRegisterMode ? "Đăng ký tài khoản" : "Đăng nhập"}
            </Button>
          </form>

          <p className="text-center text-sm theme-text-muted">
            {isRegisterMode ? "Đã có tài khoản?" : "Chưa có tài khoản?"}{" "}
            <button
              type="button"
              onClick={() => setMode(isRegisterMode ? "login" : "register")}
              className="font-medium text-brand-500 hover:underline"
            >
              {isRegisterMode ? "Đăng nhập" : "Đăng ký ngay"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
