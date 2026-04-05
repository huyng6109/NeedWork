"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from "react";
import { useRouter } from "next/navigation";
import { Camera, ImagePlus, Upload } from "lucide-react";
import toast from "react-hot-toast";

import { AvatarCropModal } from "@/components/profile/AvatarCropModal";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { isStrictAdmin } from "@/lib/auth/admin";
import { canActAsCandidate } from "@/lib/roles";
import { createClient } from "@/lib/supabase/client";
import { resolveStorageUrl } from "@/lib/storage";
import { cn } from "@/lib/utils";
import type { User } from "@/types";

const ROLE_OPTIONS = [
  {
    value: "candidate",
    label: "Ứng viên",
    desc: "Tìm việc và nộp CV",
  },
  {
    value: "recruiter",
    label: "Nhà tuyển dụng",
    desc: "Đăng tin và quản lý ứng viên",
  },
] as const;

const AVATAR_INPUT_ACCEPT = "image/jpeg,image/jpg,image/png,image/webp";
const CV_INPUT_ACCEPT = "application/pdf,image/*";

function openFilePicker(input: HTMLInputElement | null) {
  if (!input) return;

  input.value = "";

  if ("showPicker" in input) {
    try {
      input.showPicker();
      return;
    } catch {
      // Fallback to click for browsers that block showPicker.
    }
  }

  input.click();
}

function closeModalAndOpenPicker(
  setModalOpen: Dispatch<SetStateAction<boolean>>,
  input: HTMLInputElement | null
) {
  setModalOpen(false);
  openFilePicker(input);
}

async function getUploadErrorMessage(response: Response, fallback: string) {
  try {
    const payload = await response.json();
    if (payload && typeof payload.error === "string") {
      return payload.error;
    }
  } catch {
    // Ignore invalid JSON and use fallback below.
  }

  return fallback;
}

async function getActionErrorMessage(response: Response, fallback: string) {
  try {
    const payload = await response.json();
    if (payload && typeof payload.error === "string") {
      return payload.error;
    }
  } catch {
    // Ignore invalid JSON and use fallback below.
  }

  return fallback;
}

function isMobileDevice() {
  if (typeof window === "undefined") return false;

  const mobileMediaQuery = window.matchMedia("(max-width: 768px), (pointer: coarse)");
  const userAgent = navigator.userAgent.toLowerCase();

  return mobileMediaQuery.matches || /android|iphone|ipad|ipod|mobile/i.test(userAgent);
}

export default function ProfileEditPage() {
  const supabase = createClient();
  const router = useRouter();

  const avatarLibraryInputRef = useRef<HTMLInputElement>(null);
  const avatarCameraInputRef = useRef<HTMLInputElement>(null);
  const cvInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [cvUploading, setCvUploading] = useState(false);
  const [useMobileAvatarPicker, setUseMobileAvatarPicker] = useState(false);
  const [avatarSourceModalOpen, setAvatarSourceModalOpen] = useState(false);
  const [avatarCropFile, setAvatarCropFile] = useState<File | null>(null);
  const [avatarCropOpen, setAvatarCropOpen] = useState(false);

  const resolvedCvUrl = resolveStorageUrl(profile?.cv_url);
  const isAdminProfile = isStrictAdmin(profile);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push("/login");
        return;
      }

      supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single()
        .then(({ data }) => setProfile(data));
    });
  }, [router, supabase]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(max-width: 768px), (pointer: coarse)");
    const updatePickerMode = () => setUseMobileAvatarPicker(isMobileDevice());

    updatePickerMode();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", updatePickerMode);
      return () => mediaQuery.removeEventListener("change", updatePickerMode);
    }

    mediaQuery.addListener(updatePickerMode);
    return () => mediaQuery.removeListener(updatePickerMode);
  }, []);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload: Record<string, FormDataEntryValue | null> = {
      name: form.get("name"),
      title: form.get("title"),
    };

    if (!isAdminProfile) {
      payload.role = form.get("role");
    }

    setLoading(true);
    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setLoading(false);

    if (!response.ok) {
      toast.error(await getActionErrorMessage(response, "Cập nhật thất bại"));
      return;
    }

    toast.success("Đã cập nhật hồ sơ");
    router.push("/account");
  }

  function startAvatarCrop(file: File) {
    setAvatarCropFile(file);
    setAvatarCropOpen(true);
  }

  function resetAvatarCrop() {
    if (avatarUploading) {
      return;
    }

    setAvatarCropOpen(false);
    setAvatarCropFile(null);
  }

  async function uploadAvatarFile(file: File) {
    setAvatarUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        toast.error(await getUploadErrorMessage(response, "Upload ảnh thất bại"));
        return false;
      }

      const { url } = await response.json();
      setProfile((current) => (current ? { ...current, avatar_url: url } : current));
      toast.success("Đã cập nhật ảnh đại diện");
      return true;
    } finally {
      setAvatarUploading(false);
    }
  }

  function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    startAvatarCrop(file);
  }

  async function handleAvatarCropConfirm(file: File) {
    const success = await uploadAvatarFile(file);

    if (success) {
      setAvatarCropOpen(false);
      setAvatarCropFile(null);
    }
  }

  async function handleCvChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    setCvUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/profile/cv", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        toast.error(await getUploadErrorMessage(response, "Upload CV thất bại"));
        return;
      }

      const { url } = await response.json();
      setProfile((current) => (current ? { ...current, cv_url: url } : current));
      toast.success("Đã cập nhật CV");
    } finally {
      setCvUploading(false);
    }
  }

  function handleOpenAvatarPicker() {
    if (useMobileAvatarPicker) {
      setAvatarSourceModalOpen(true);
      return;
    }

    openFilePicker(avatarLibraryInputRef.current);
  }

  function handleOpenAvatarLibrary() {
    closeModalAndOpenPicker(setAvatarSourceModalOpen, avatarLibraryInputRef.current);
  }

  function handleOpenAvatarCamera() {
    closeModalAndOpenPicker(setAvatarSourceModalOpen, avatarCameraInputRef.current);
  }

  function handleOpenCvPicker() {
    openFilePicker(cvInputRef.current);
  }

  if (!profile) return <div className="card p-8 animate-pulse" />;

  return (
    <>
      <div className="space-y-6">
        <h1 className="text-xl font-bold text-dark">Chỉnh sửa hồ sơ</h1>

        <div className="card space-y-6 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={handleOpenAvatarPicker}
              disabled={avatarUploading}
              className={cn(
                "group relative shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2",
                "focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
                "disabled:cursor-not-allowed disabled:opacity-70"
              )}
              aria-label="Đổi ảnh đại diện"
            >
              <Avatar
                src={profile.avatar_url}
                name={profile.name}
                size="xl"
                frameColor={profile.frame_color}
                role={profile.role}
                className="transition duration-200 group-hover:brightness-90"
              />
              <span className="absolute inset-x-1 bottom-1 rounded-full bg-black/70 px-2 py-1 text-[10px] font-medium text-white backdrop-blur-sm">
                Đổi ảnh
              </span>
            </button>

            <div>
              <Button
                variant="outline"
                size="sm"
                loading={avatarUploading}
                type="button"
                className="gap-1.5"
                onClick={handleOpenAvatarPicker}
              >
                <Upload size={14} />
                Đổi ảnh
              </Button>
              <input
                ref={avatarLibraryInputRef}
                type="file"
                accept={AVATAR_INPUT_ACCEPT}
                className="hidden"
                onChange={handleAvatarChange}
              />
              <input
                ref={avatarCameraInputRef}
                type="file"
                accept="image/*"
                capture="user"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <p className="mt-1 text-xs text-muted">PNG, JPG, WebP</p>
              <p className="mt-1 text-xs text-muted">
                {useMobileAvatarPicker
                  ? "Trên điện thoại, chạm vào avatar để mở lựa chọn ảnh từ thư viện hoặc camera."
                  : "Trên máy tính, nút này sẽ mở hộp chọn ảnh từ thiết bị."}
              </p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            {isAdminProfile ? (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-dark">Loại tài khoản</label>
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                  <div className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-200">
                    Admin
                  </div>
                  <div className="mt-1 text-xs text-muted">
                    Tài khoản admin có toàn quyền của ứng viên và nhà tuyển dụng, và không đổi loại tài khoản ở trang này.
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-dark">Loại tài khoản</label>
                <div className="grid grid-cols-2 gap-2">
                  {ROLE_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      className={cn(
                        "block cursor-pointer rounded-xl border p-3 transition-colors",
                        profile.role === option.value
                          ? "border-brand-500 bg-brand-500/10"
                          : "border-border bg-[#16181C] hover:border-brand-500/50"
                      )}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={option.value}
                        checked={profile.role === option.value}
                        onChange={() =>
                          setProfile((current) =>
                            current ? { ...current, role: option.value } : current
                          )
                        }
                        className="sr-only"
                      />
                      <div className="text-sm font-medium text-dark">{option.label}</div>
                      <div className="mt-1 text-xs text-muted">{option.desc}</div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <Input
              name="name"
              label="Họ và tên"
              defaultValue={profile.name ?? ""}
              required
            />

            <Input
              name="title"
              label="Chức danh / Mô tả ngắn"
              placeholder="Ví dụ: Frontend Developer tại ABC Corp"
              defaultValue={profile.title ?? ""}
            />

            <Button type="submit" loading={loading}>
              Lưu thay đổi
            </Button>
          </form>

          {canActAsCandidate(profile.role) && (
            <div className="border-t border-border pt-4">
              <label className="mb-2 block text-sm font-medium text-dark">
                CV hoặc ảnh hồ sơ
              </label>
              {resolvedCvUrl && (
                <a
                  href={resolvedCvUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mb-2 block text-sm text-brand-300 hover:underline"
                >
                  Xem tệp hiện tại
                </a>
              )}
              <div className="inline-flex">
                <Button
                  variant="outline"
                  size="sm"
                  loading={cvUploading}
                  type="button"
                  className="gap-1.5"
                  onClick={handleOpenCvPicker}
                >
                  <Upload size={14} />
                  {profile.cv_url ? "Thay CV / ảnh" : "Tải CV / ảnh"}
                </Button>
                <input
                  ref={cvInputRef}
                  type="file"
                  accept={CV_INPUT_ACCEPT}
                  className="hidden"
                  onChange={handleCvChange}
                />
              </div>
              <p className="mt-1 text-xs text-muted">Hỗ trợ PDF, JPG, PNG, WebP</p>
              <p className="mt-1 text-xs text-muted">
                {useMobileAvatarPicker
                  ? "Trên điện thoại, bạn có thể chọn tệp PDF hoặc ảnh từ thiết bị."
                  : "Trên máy tính, bạn có thể tải lên tệp PDF hoặc ảnh từ máy tính."}
              </p>
            </div>
          )}
        </div>
      </div>

      <Modal
        open={avatarSourceModalOpen}
        onClose={() => setAvatarSourceModalOpen(false)}
        title="Chọn ảnh đại diện"
        overlayClassName="items-end sm:items-center"
        className="mt-auto w-full max-w-none rounded-b-none rounded-t-[28px] border-x-0 border-b-0 px-4 pb-4 pt-5 sm:mx-4 sm:mt-0 sm:max-w-sm sm:rounded-2xl sm:border sm:p-6"
      >
        <div className="space-y-3">
          <p className="text-sm text-muted">
            Chọn ảnh từ thư viện hoặc mở camera để chụp ảnh mới.
          </p>

          <Button
            type="button"
            variant="outline"
            className="w-full justify-start rounded-2xl px-4 py-4 text-left"
            onClick={handleOpenAvatarLibrary}
          >
            <ImagePlus size={18} />
            Chọn từ thư viện
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full justify-start rounded-2xl px-4 py-4 text-left"
            onClick={handleOpenAvatarCamera}
          >
            <Camera size={18} />
            Chụp ảnh mới
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="w-full rounded-2xl py-3"
            onClick={() => setAvatarSourceModalOpen(false)}
          >
            Hủy
          </Button>
        </div>
      </Modal>

      <AvatarCropModal
        file={avatarCropFile}
        open={avatarCropOpen}
        loading={avatarUploading}
        onClose={resetAvatarCrop}
        onConfirm={handleAvatarCropConfirm}
      />
    </>
  );
}
