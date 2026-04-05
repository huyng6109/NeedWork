"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BriefcaseBusiness,
  ChevronDown,
  Plus,
  Trash2,
  UserRound,
} from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PostContentEditor } from "@/components/ui/PostContentEditor";
import { Textarea } from "@/components/ui/Textarea";
import { DEFAULT_SALARY_CURRENCY, SALARY_CURRENCY_OPTIONS } from "@/constants";
import {
  type EditorContactItem,
  type EditorContactType,
  type JobSeekingFormMode,
  getInitialPostEditorValues,
} from "@/lib/post-editor";
import { cn } from "@/lib/utils";
import type { Post, PostType, SalaryCurrency } from "@/types";

const MapPicker = dynamic(() => import("@/components/ui/MapPicker"), { ssr: false });

const JOB_TYPES = [
  { value: "full_time", label: "Full-time (Toàn thời gian)" },
  { value: "part_time", label: "Part-time (Bán thời gian)" },
] as const;

const CONTACT_OPTIONS: Array<{
  value: EditorContactType;
  label: string;
  inputType: React.HTMLInputTypeAttribute;
  placeholder: string;
}> = [
  {
    value: "email",
    label: "Email",
    inputType: "email",
    placeholder: "hr@company.com",
  },
  {
    value: "phone",
    label: "Điện thoại",
    inputType: "tel",
    placeholder: "0901 234 567",
  },
  {
    value: "other",
    label: "Khác",
    inputType: "text",
    placeholder: "Zalo, Telegram, LinkedIn...",
  },
];

interface PostEditorFormProps {
  mode: "create" | "edit";
  initialPost?: Post;
  postId?: string;
}

function SectionTitle({ step, title }: { step: number; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-black text-xs font-semibold text-white">
        {step}
      </span>
      <h2 className="text-base font-semibold theme-text">{title}</h2>
    </div>
  );
}

export function PostEditorForm({
  mode,
  initialPost,
  postId,
}: PostEditorFormProps) {
  const router = useRouter();
  const initialValues = useMemo(
    () => getInitialPostEditorValues(initialPost),
    [initialPost]
  );

  const [loading, setLoading] = useState(false);
  const [postType] = useState<PostType>(initialValues.postType);
  const [jobSeekingFormMode, setJobSeekingFormMode] =
    useState<JobSeekingFormMode>(initialValues.jobSeekingFormMode);
  const [jobType, setJobType] = useState<"full_time" | "part_time">(
    initialValues.jobType
  );
  const [location, setLocation] = useState<{
    lat: number;
    lng: number;
    name: string;
  } | null>(initialValues.location);

  const [companyName, setCompanyName] = useState(initialValues.companyName);
  const [jobOfferTitle, setJobOfferTitle] = useState(initialValues.jobOfferTitle);
  const [jobOfferDescription, setJobOfferDescription] = useState(
    initialValues.jobOfferDescription
  );
  const [jobOfferRequirements, setJobOfferRequirements] = useState(
    initialValues.jobOfferRequirements
  );
  const [jobOfferBenefits, setJobOfferBenefits] = useState(
    initialValues.jobOfferBenefits
  );
  const [contactItems, setContactItems] = useState<EditorContactItem[]>(
    initialValues.contactItems
  );

  const [jobSeekingTitle, setJobSeekingTitle] = useState(
    initialValues.jobSeekingTitle
  );
  const [jobSeekingBasicContent, setJobSeekingBasicContent] = useState(
    initialValues.jobSeekingBasicContent
  );
  const [candidateSummary, setCandidateSummary] = useState(
    initialValues.candidateSummary
  );
  const [candidateDescription, setCandidateDescription] = useState(
    initialValues.candidateDescription
  );
  const [candidateRequirements, setCandidateRequirements] = useState(
    initialValues.candidateRequirements
  );
  const [candidateBenefits, setCandidateBenefits] = useState(
    initialValues.candidateBenefits
  );

  const [salaryMin, setSalaryMin] = useState(initialValues.salaryMin);
  const [salaryMax, setSalaryMax] = useState(initialValues.salaryMax);
  const [salaryCurrency, setSalaryCurrency] = useState<SalaryCurrency>(
    initialValues.salaryCurrency ?? DEFAULT_SALARY_CURRENCY
  );

  const isEditMode = mode === "edit";
  const pageTitle = isEditMode ? "Chỉnh sửa bài đăng" : "Tạo bài đăng mới";
  const backHref = isEditMode && postId ? `/post/${postId}` : "/";
  const backLabel = isEditMode ? "Quay lại bài đăng" : "Quay lại bảng tin";
  const submitLabel = isEditMode
    ? "Lưu thay đổi"
    : postType === "job_offer"
      ? "Đăng tin tuyển dụng"
      : "Đăng bài tìm việc";
  const isContactValueRequired =
    postType === "job_offer" && contactItems.every((item) => !item.value.trim());
  const salaryExamples: Record<SalaryCurrency, { min: string; max: string }> = {
    VND: { min: "10000000", max: "15000000" },
    USD: { min: "1000", max: "2500" },
    EUR: { min: "900", max: "2200" },
    GBP: { min: "800", max: "2000" },
    JPY: { min: "150000", max: "250000" },
    KRW: { min: "3000000", max: "5000000" },
    SGD: { min: "1800", max: "3500" },
    AUD: { min: "4000", max: "6500" },
    CAD: { min: "3500", max: "6000" },
    CNY: { min: "8000", max: "16000" },
    THB: { min: "30000", max: "60000" },
  };
  const salaryMinPlaceholder = `Ví dụ: ${salaryExamples[salaryCurrency].min}`;
  const salaryMaxPlaceholder = `Ví dụ: ${salaryExamples[salaryCurrency].max}`;

  const roleIntro = useMemo(() => {
    if (isEditMode) {
      return {
        description:
          postType === "job_offer"
            ? "Cập nhật tin tuyển dụng và lưu lại các thay đổi mới nhất."
            : "Cập nhật bài tìm việc để hồ sơ hiển thị đúng nhu cầu hiện tại.",
      };
    }

    return postType === "job_offer"
      ? {
          description:
            "Đăng tin tuyển dụng với thông tin đầy đủ để ứng viên dễ ứng tuyển.",
        }
      : {
          description:
            "Tạo bài tìm việc với form cơ bản hoặc form chi tiết để giới thiệu bản thân.",
        };
  }, [isEditMode, postType]);

  function addContactItem() {
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `contact-${Date.now()}`;

    setContactItems((items) => [...items, { id, type: "phone", value: "" }]);
  }

  function updateContactItem(
    contactId: string,
    field: "type" | "value",
    nextValue: string
  ) {
    setContactItems((items) =>
      items.map((item) =>
        item.id === contactId
          ? {
              ...item,
              [field]:
                field === "type" ? (nextValue as EditorContactType) : nextValue,
            }
          : item
      )
    );
  }

  function removeContactItem(contactId: string) {
    setContactItems((items) =>
      items.length === 1 ? items : items.filter((item) => item.id !== contactId)
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedSalaryMin = salaryMin.trim();
    const trimmedSalaryMax = salaryMax.trim();
    const parsedSalaryMin = trimmedSalaryMin ? Number(trimmedSalaryMin) : null;
    const parsedSalaryMax = trimmedSalaryMax ? Number(trimmedSalaryMax) : null;
    const normalizedContacts =
      postType === "job_offer"
        ? contactItems
            .map((item) => ({
              type: item.type,
              value: item.value.trim(),
            }))
            .filter((item) => item.value.length > 0)
        : [];
    const primaryContactEmail =
      normalizedContacts.find((item) => item.type === "email")?.value ?? "";

    if (postType === "job_offer") {
      if (!jobOfferTitle.trim()) {
        toast.error("Vui lòng nhập vị trí công việc");
        return;
      }

      if (!jobOfferDescription.trim() || !jobOfferRequirements.trim()) {
        toast.error("Vui lòng nhập đầy đủ mô tả và yêu cầu tuyển dụng");
        return;
      }

      if (!location) {
        toast.error("Vui lòng chọn địa điểm làm việc");
        return;
      }

      if (normalizedContacts.length === 0) {
        toast.error("Cần ít nhất một thông tin liên lạc");
        return;
      }

      if (parsedSalaryMin === null || parsedSalaryMax === null) {
        toast.error("Vui lòng nhập đầy đủ mức lương");
        return;
      }

      if (!Number.isFinite(parsedSalaryMin) || !Number.isFinite(parsedSalaryMax)) {
        toast.error("Mức lương không hợp lệ");
        return;
      }

      if (parsedSalaryMin < 0 || parsedSalaryMax < 0) {
        toast.error("Mức lương phải lớn hơn hoặc bằng 0");
        return;
      }

      if (parsedSalaryMax < parsedSalaryMin) {
        toast.error("Mức lương tối đa phải lớn hơn hoặc bằng mức tối thiểu");
        return;
      }
    }

    if (postType === "job_seeking" && jobSeekingFormMode === "basic") {
      if (!jobSeekingTitle.trim() || !jobSeekingBasicContent.trim()) {
        toast.error("Form cơ bản cần tiêu đề bài viết và nội dung");
        return;
      }
    }

    if (postType === "job_seeking" && jobSeekingFormMode === "detailed") {
      if (
        !jobSeekingTitle.trim() ||
        !candidateSummary.trim() ||
        !candidateDescription.trim() ||
        !candidateRequirements.trim()
      ) {
        toast.error("Vui lòng nhập đầy đủ các phần bắt buộc của form chi tiết");
        return;
      }
    }

    let title = "";
    let content = "";

    if (postType === "job_offer") {
      title = companyName.trim()
        ? `${jobOfferTitle.trim()} - ${companyName.trim()}`
        : jobOfferTitle.trim();
      content = [
        jobOfferDescription.trim() && `Mô tả công việc:\n${jobOfferDescription.trim()}`,
        jobOfferRequirements.trim() &&
          `\nYêu cầu ứng viên:\n${jobOfferRequirements.trim()}`,
        jobOfferBenefits.trim() && `\nQuyền lợi:\n${jobOfferBenefits.trim()}`,
        normalizedContacts.length > 0 &&
          `\nThông tin liên lạc:\n${normalizedContacts
            .map((item) => {
              const option = CONTACT_OPTIONS.find(
                (contact) => contact.value === item.type
              );
              return `- ${option?.label ?? "Liên hệ"}: ${item.value}`;
            })
            .join("\n")}`,
      ]
        .filter(Boolean)
        .join("\n\n");
    } else if (jobSeekingFormMode === "basic") {
      title = jobSeekingTitle.trim();
      content = jobSeekingBasicContent.trim();
    } else {
      title = jobSeekingTitle.trim();
      content = [
        candidateSummary.trim() && `Giới thiệu:\n${candidateSummary.trim()}`,
        candidateDescription.trim() &&
          `\nMô tả năng lực / kinh nghiệm:\n${candidateDescription.trim()}`,
        candidateRequirements.trim() &&
          `\nKỹ năng / kinh nghiệm:\n${candidateRequirements.trim()}`,
        candidateBenefits.trim() &&
          `\nKỳ vọng / mong muốn:\n${candidateBenefits.trim()}`,
      ]
        .filter(Boolean)
        .join("\n\n");
    }

    const requestUrl = isEditMode && postId ? `/api/posts/${postId}` : "/api/posts";
    const requestMethod = isEditMode ? "PATCH" : "POST";

    setLoading(true);
    const response = await fetch(requestUrl, {
      method: requestMethod,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: postType,
        title,
        content,
        contacts: postType === "job_offer" ? normalizedContacts : undefined,
        email: postType === "job_offer" ? primaryContactEmail || undefined : undefined,
        location_name: postType === "job_offer" ? location?.name : undefined,
        lat: postType === "job_offer" ? location?.lat : undefined,
        lng: postType === "job_offer" ? location?.lng : undefined,
        salary_min:
          postType === "job_seeking" && jobSeekingFormMode === "basic"
            ? null
            : parsedSalaryMin,
        salary_max:
          postType === "job_seeking" && jobSeekingFormMode === "basic"
            ? null
            : parsedSalaryMax,
        salary_currency: salaryCurrency,
        job_type: postType === "job_offer" ? jobType : undefined,
      }),
    });
    setLoading(false);

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      toast.error(error?.error ?? "Lưu bài viết thất bại");
      return;
    }

    const post = await response.json();

    if (isEditMode) {
      if (postType === "job_offer" && post.status === "pending") {
        toast.success("Đã cập nhật bài tuyển dụng và gửi lại kiểm duyệt");
      } else {
        toast.success("Đã cập nhật bài đăng");
      }

      router.push(`/post/${post.id}`);
      return;
    }

    if (postType === "job_offer") {
      toast.success("Bài tuyển dụng đã được gửi kiểm duyệt");
      router.push("/");
      return;
    }

    toast.success("Đăng bài thành công");
    router.push(`/post/${post.id}`);
  }

  return (
    <div className="mx-auto max-w-3xl pb-10">
      <div className="mb-8 flex items-center justify-between gap-4">
        <Link href={backHref}>
          <Button variant="outline" className="gap-2">
            <ArrowLeft size={16} />
            {backLabel}
          </Button>
        </Link>
        <div className="flex-1 text-center">
          <h1 className="text-3xl font-bold theme-text">{pageTitle}</h1>
          <p className="mt-2 text-sm theme-text-muted">{roleIntro.description}</p>
        </div>
        <div className="h-10 w-10 shrink-0" />
      </div>

      <div className="mb-8 text-center sm:hidden">
        <h1 className="text-3xl font-bold theme-text">{pageTitle}</h1>
        <p className="mt-2 text-sm theme-text-muted">{roleIntro.description}</p>
      </div>

      <div className="mx-auto mb-6 flex max-w-md rounded-full border border-border bg-[var(--tab-bg)] p-1">
        {([
          { value: "job_offer", label: "Nhà tuyển dụng", icon: BriefcaseBusiness },
          { value: "job_seeking", label: "Ứng viên", icon: UserRound },
        ] as const).map((option) => {
          const Icon = option.icon;
          const active = postType === option.value;

          return (
            <button
              key={option.value}
              type="button"
              disabled={isEditMode}
              className={cn(
                "inline-flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-[var(--tab-active-bg)] text-[var(--tab-active-text)] shadow-card"
                  : "text-[var(--tab-idle-text)] hover:text-[var(--text-primary)]",
                isEditMode ? "cursor-not-allowed opacity-70" : ""
              )}
            >
              <Icon size={14} />
              {option.label}
            </button>
          );
        })}
      </div>

      {postType === "job_seeking" ? (
        <div className="card mb-8 space-y-3 p-4">
          <div>
            <h2 className="text-sm font-semibold theme-text">Chọn kiểu form</h2>
            <p className="mt-1 text-xs theme-text-muted">
              Form cơ bản chỉ gồm tiêu đề và nội dung. Form chi tiết giữ bố cục đầy
              đủ hiện tại.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-[var(--tab-bg)] p-1">
            {([
              { value: "basic", label: "Cơ bản" },
              { value: "detailed", label: "Chi tiết" },
            ] as const).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setJobSeekingFormMode(option.value)}
                className={cn(
                  "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                  jobSeekingFormMode === option.value
                    ? "bg-[var(--tab-active-bg)] text-[var(--tab-active-text)] shadow-card"
                    : "theme-text-muted hover:text-[var(--text-primary)]"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-8">
        {postType === "job_offer" ? (
          <>
            <section className="card space-y-5 p-6">
              <SectionTitle step={1} title="Thông tin cơ bản" />

              <Input
                name="company_name"
                label="Tên công ty / đơn vị"
                placeholder="Ví dụ: Công ty TNHH Sáng Tạo"
                value={companyName}
                onChange={(event) => setCompanyName(event.target.value)}
                required
              />

              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  name="position_title"
                  label="Vị trí công việc"
                  placeholder="Ví dụ: Thiết kế đồ hoạ"
                  value={jobOfferTitle}
                  onChange={(event) => setJobOfferTitle(event.target.value)}
                  required
                />

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-dark">Hình thức</label>
                  <div className="relative">
                    <select
                      value={jobType}
                      onChange={(event) =>
                        setJobType(event.target.value as "full_time" | "part_time")
                      }
                      className="w-full appearance-none rounded-lg border border-border theme-input px-3 py-2 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      {JOB_TYPES.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={16}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 theme-text-muted"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-dark">
                  Địa điểm làm việc <span className="text-red-500">*</span>
                </label>
                <div className="overflow-hidden rounded-2xl border border-border">
                  <div className="h-64">
                    <MapPicker
                      notice="Hiện tại, trang đang dùng map free nên hiển thị Thành phố Hồ Chí Minh -> Thành phố Thủ Đức, mọi người thông cảm."
                      value={location}
                      onChange={setLocation}
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className="card space-y-5 p-6">
              <SectionTitle step={2} title="Chi tiết & yêu cầu" />

              <PostContentEditor
                name="description"
                label="Mô tả công việc (JD)"
                placeholder="Mô tả các nhiệm vụ chính, team đang làm gì, mục tiêu của vị trí..."
                rows={6}
                value={jobOfferDescription}
                onChange={setJobOfferDescription}
                variant="composer"
                required
              />

              <Textarea
                name="requirements"
                label="Yêu cầu ứng viên"
                placeholder="Kỹ năng, kinh nghiệm cần có..."
                rows={5}
                value={jobOfferRequirements}
                onChange={(event) => setJobOfferRequirements(event.target.value)}
                required
              />

              <Textarea
                name="benefits"
                label="Quyền lợi"
                placeholder="BHXH, thưởng, du lịch, remote..."
                rows={4}
                value={jobOfferBenefits}
                onChange={(event) => setJobOfferBenefits(event.target.value)}
              />

              <div className="grid gap-3 sm:grid-cols-3">
                <Input
                  name="salary_min"
                  type="number"
                  label="Mức lương tối thiểu"
                  placeholder={salaryMinPlaceholder}
                  value={salaryMin}
                  onChange={(event) => setSalaryMin(event.target.value)}
                  required
                />
                <Input
                  name="salary_max"
                  type="number"
                  label="Mức lương tối đa"
                  placeholder={salaryMaxPlaceholder}
                  value={salaryMax}
                  onChange={(event) => setSalaryMax(event.target.value)}
                  required
                />
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-dark">
                    Tiền tệ <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={salaryCurrency}
                      onChange={(event) =>
                        setSalaryCurrency(event.target.value as SalaryCurrency)
                      }
                      className="w-full appearance-none rounded-lg border border-border theme-input px-3 py-2 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      {SALARY_CURRENCY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={16}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 theme-text-muted"
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className="card space-y-5 p-6">
              <div className="flex items-center justify-between gap-3">
                <SectionTitle step={3} title="Thông tin liên lạc" />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addContactItem}
                  className="rounded-full"
                >
                  <Plus size={14} />
                  Thêm
                </Button>
              </div>

              <p className="text-sm theme-text-muted">
                Chọn email, điện thoại hoặc liên hệ khác. Bắt buộc có ít nhất một
                dòng có nội dung liên lạc. Bạn có thể bấm dấu + để thêm nhiều dòng.
              </p>

              <div className="space-y-3">
                {contactItems.map((contact, index) => {
                  const selectedOption =
                    CONTACT_OPTIONS.find((option) => option.value === contact.type) ??
                    CONTACT_OPTIONS[0];

                  return (
                    <div
                      key={contact.id}
                      className="grid gap-3 md:grid-cols-[160px_minmax(0,1fr)_auto]"
                    >
                      <div className="flex flex-col gap-1">
                        <label
                          htmlFor={`contact-type-${contact.id}`}
                          className="text-sm font-medium text-dark"
                        >
                          Loại liên lạc
                        </label>
                        <div className="relative">
                          <select
                            id={`contact-type-${contact.id}`}
                            value={contact.type}
                            onChange={(event) =>
                              updateContactItem(contact.id, "type", event.target.value)
                            }
                            className="w-full appearance-none rounded-lg border border-border theme-input px-3 py-2 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-brand-500"
                          >
                            {CONTACT_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <ChevronDown
                            size={16}
                            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 theme-text-muted"
                          />
                        </div>
                      </div>

                      <Input
                        id={`contact-value-${contact.id}`}
                        name={`contact_value_${index}`}
                        type={selectedOption.inputType}
                        label="Nội dung liên lạc"
                        placeholder={selectedOption.placeholder}
                        value={contact.value}
                        required={isContactValueRequired}
                        onChange={(event) =>
                          updateContactItem(contact.id, "value", event.target.value)
                        }
                      />

                      <div className="flex items-end">
                        {contactItems.length > 1 ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeContactItem(contact.id)}
                            className="h-10 w-10 rounded-full p-0"
                            aria-label="Xóa thông tin liên lạc"
                          >
                            <Trash2 size={14} />
                          </Button>
                        ) : (
                          <div className="h-10 w-10" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        ) : jobSeekingFormMode === "basic" ? (
          <section className="card space-y-5 p-6">
            <SectionTitle step={1} title="Nội dung bài viết" />

            <Input
              name="job_seeking_title"
              label="Tiêu đề bài viết"
              placeholder="Ví dụ: Frontend Developer tìm việc tại TP.HCM"
              value={jobSeekingTitle}
              onChange={(event) => setJobSeekingTitle(event.target.value)}
              required
            />

            <PostContentEditor
              name="job_seeking_basic_content"
              label="Nội dung"
              value={jobSeekingBasicContent}
              onChange={setJobSeekingBasicContent}
              placeholder="Giới thiệu bản thân, kinh nghiệm, mong muốn công việc... Bạn có thể chèn ảnh trực tiếp vào đây."
              rows={5}
              variant="composer"
              labelHidden
              required
            />
          </section>
        ) : (
          <>
            <section className="card space-y-5 p-6">
              <SectionTitle step={1} title="Thông tin cơ bản" />

              <Input
                name="position_title"
                label="Tiêu đề bài tìm việc"
                placeholder="Ví dụ: Frontend Developer tìm môi trường product"
                value={jobSeekingTitle}
                onChange={(event) => setJobSeekingTitle(event.target.value)}
                required
              />

              <PostContentEditor
                name="candidate_summary"
                label="Giới thiệu ngắn"
                value={candidateSummary}
                onChange={setCandidateSummary}
                placeholder="Bạn đang tìm công việc gì, có thể bắt đầu khi nào, ưu tiên khu vực nào..."
                rows={5}
                variant="composer"
                required
              />
            </section>

            <section className="card space-y-5 p-6">
              <SectionTitle step={2} title="Chi tiết & yêu cầu" />

              <PostContentEditor
                name="description"
                label="Mô tả năng lực / kinh nghiệm"
                value={candidateDescription}
                onChange={setCandidateDescription}
                placeholder="Mô tả chi tiết kinh nghiệm, dự án đã làm, công cụ sử dụng..."
                rows={6}
                allowImages={false}
                required
              />

              <PostContentEditor
                name="requirements"
                label="Kỹ năng nổi bật"
                value={candidateRequirements}
                onChange={setCandidateRequirements}
                placeholder="Kỹ năng chuyên môn, công nghệ, thành tựu nổi bật..."
                rows={5}
                allowImages={false}
                required
              />

              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <Input
                    name="salary_min"
                    type="number"
                    label="Mức lương tối thiểu"
                    placeholder={salaryMinPlaceholder}
                    value={salaryMin}
                    onChange={(event) => setSalaryMin(event.target.value)}
                  />
                  <Input
                    name="salary_max"
                    type="number"
                    label="Mức lương tối đa"
                    placeholder={salaryMaxPlaceholder}
                    value={salaryMax}
                    onChange={(event) => setSalaryMax(event.target.value)}
                  />
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-dark">Tiền tệ</label>
                    <div className="relative">
                      <select
                        value={salaryCurrency}
                        onChange={(event) =>
                          setSalaryCurrency(event.target.value as SalaryCurrency)
                        }
                        className="w-full appearance-none rounded-lg border border-border theme-input px-3 py-2 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-brand-500"
                      >
                        {SALARY_CURRENCY_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={16}
                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 theme-text-muted"
                      />
                    </div>
                  </div>
                </div>

                <PostContentEditor
                  name="benefits"
                  label="Kỳ vọng / mong muốn"
                  value={candidateBenefits}
                  onChange={setCandidateBenefits}
                  placeholder="Mức lương kỳ vọng, mô hình làm việc, quyền lợi mong muốn..."
                  rows={4}
                  allowImages={false}
                />
              </div>
            </section>
          </>
        )}

        <div className="card space-y-4 p-5">
          <Button type="submit" loading={loading} className="w-full rounded-full py-3 text-base">
            {submitLabel}
          </Button>
          <p className="text-center text-xs theme-text-muted">
            {isEditMode
              ? "Các thay đổi sẽ được lưu vào bài đăng hiện tại của bạn."
              : "Bằng việc nhấn đăng tin, bạn đồng ý với điều khoản của NeedWork."}
          </p>
        </div>
      </form>
    </div>
  );
}
