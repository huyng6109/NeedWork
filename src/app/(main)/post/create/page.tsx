"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { cn } from "@/lib/utils";
import { JOB_TYPE_LABELS } from "@/constants";
import toast from "react-hot-toast";
import dynamic from "next/dynamic";

const MapPicker = dynamic(() => import("@/components/ui/MapPicker"), { ssr: false });

export default function CreatePostPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [jobType, setJobType] = useState<"full_time" | "part_time">("full_time");
  const [postType, setPostType] = useState<"job_offer" | "job_seeking">("job_offer");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    if (postType === "job_offer" && !location) {
      toast.error("Vui lòng chọn địa điểm công ty");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: postType,
        title: form.get("title"),
        content: form.get("content"),
        email: postType === "job_offer" ? form.get("email") : undefined,
        location_name: location?.name,
        lat: location?.lat,
        lng: location?.lng,
        salary_min: form.get("salary_min") ? Number(form.get("salary_min")) : null,
        salary_max: form.get("salary_max") ? Number(form.get("salary_max")) : null,
        job_type: postType === "job_offer" ? jobType : undefined,
      }),
    });
    setLoading(false);

    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error ?? "Đăng bài thất bại");
      return;
    }

    const post = await res.json();
    if (postType === "job_offer") {
      toast.success("Bài đăng đang chờ kiểm duyệt");
    } else {
      toast.success("Đã đăng bài thành công!");
      router.push(`/post/${post.id}`);
    }
    router.push("/");
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-dark">Tạo bài đăng</h1>

      {/* Post type toggle */}
      <div className="grid grid-cols-2 gap-2">
        {(["job_offer", "job_seeking"] as const).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setPostType(type)}
            className={cn(
              "p-3 rounded-xl border-2 text-left transition-all",
              postType === type
                ? "border-brand-600 bg-brand-50"
                : "border-border bg-white hover:border-brand-300"
            )}
          >
            <div className="font-medium text-sm text-dark">
              {type === "job_offer" ? "Tuyển dụng" : "Tìm việc"}
            </div>
            <div className="text-xs text-muted mt-0.5">
              {type === "job_offer"
                ? "Đăng tin tuyển dụng nhân viên"
                : "Tìm kiếm cơ hội việc làm"}
            </div>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="card p-5 space-y-4">
        <Input name="title" label="Tiêu đề" placeholder="Vd: Tuyển Frontend Developer" required />

        <Textarea
          name="content"
          label={postType === "job_offer" ? "Mô tả công việc (JD)" : "Giới thiệu bản thân"}
          placeholder={
            postType === "job_offer"
              ? "Mô tả công việc, yêu cầu, quyền lợi..."
              : "Kỹ năng, kinh nghiệm, vị trí mong muốn..."
          }
          required
        />

        {postType === "job_offer" && (
          <>
            <Input
              name="email"
              type="email"
              label="Email liên hệ"
              placeholder="hr@company.com"
              required
            />

            <div>
              <label className="text-sm font-medium text-dark block mb-1">
                Địa điểm công ty <span className="text-red-500">*</span>
              </label>
              <div className="h-56 rounded-xl overflow-hidden border border-border">
                <MapPicker
                  value={location}
                  onChange={setLocation}
                />
              </div>
              {location && (
                <p className="text-xs text-muted mt-1">{location.name}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                name="salary_min"
                type="number"
                label="Lương tối thiểu (VND)"
                placeholder="10000000"
              />
              <Input
                name="salary_max"
                type="number"
                label="Lương tối đa (VND)"
                placeholder="20000000"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-dark block mb-2">Tính chất công việc</label>
              <div className="flex gap-2">
                {(Object.keys(JOB_TYPE_LABELS) as Array<"full_time" | "part_time">).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setJobType(type)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm border-2 transition-all",
                      jobType === type
                        ? "border-brand-600 bg-brand-50 text-brand-700 font-medium"
                        : "border-border text-muted hover:border-brand-300"
                    )}
                  >
                    {JOB_TYPE_LABELS[type]}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="flex gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Huỷ
          </Button>
          <Button type="submit" loading={loading} className="flex-1">
            {postType === "job_offer" ? "Gửi kiểm duyệt" : "Đăng bài"}
          </Button>
        </div>
      </form>
    </div>
  );
}
