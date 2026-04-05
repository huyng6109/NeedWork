export const ROLES = {
  CANDIDATE: "candidate",
  RECRUITER: "recruiter",
  ADMIN: "admin",
} as const;

export const POST_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
} as const;

export const REPORT_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  DISMISSED: "dismissed",
} as const;

export const RADIUS_OPTIONS = [5, 10, 20, 50, 100] as const;

export const FEED_PAGE_SIZE = 20;
export const PINNED_POST_LIMIT = 5;

export const FILE_LIMITS = {
  AVATAR_MAX_MB: 5,
  CV_MAX_MB: 5,
  POST_IMAGE_MAX_MB: 5,
  AVATAR_TYPES: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  CV_TYPES: [
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ],
  POST_IMAGE_TYPES: ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"],
} as const;

export const TRUST_RING = {
  REVIEWS_TO_RESTORE: 5,
  FRAME_COLOR: "green",
} as const;

export const WARNING = {
  RESPONSE_DEADLINE_DAYS: 7,
} as const;

export const SALARY_LABELS: Record<string, string> = {
  "0": "Thỏa thuận",
};

export const SALARY_CURRENCY_OPTIONS = [
  { value: "VND", label: "VND - Việt Nam Đồng" },
  { value: "USD", label: "USD - Đô la Mỹ" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - Bảng Anh" },
  { value: "JPY", label: "JPY - Yên Nhật" },
  { value: "KRW", label: "KRW - Won Hàn Quốc" },
  { value: "SGD", label: "SGD - Đô la Singapore" },
  { value: "AUD", label: "AUD - Đô la Úc" },
  { value: "CAD", label: "CAD - Đô la Canada" },
  { value: "CNY", label: "CNY - Nhân dân tệ" },
  { value: "THB", label: "THB - Baht Thái" },
] as const;

export const DEFAULT_SALARY_CURRENCY = SALARY_CURRENCY_OPTIONS[0].value;

export const APPLICATION_AUTO_COMMENT =
  "Dạ em đã apply. Mong anh/chị hãy xem CV của em, em cám ơn nhiều ạ 🤗";

export const JOB_TYPE_LABELS: Record<string, string> = {
  full_time: "Toàn thời gian",
  part_time: "Bán thời gian",
};

export const POST_STATUS_LABELS: Record<string, string> = {
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Từ chối",
};

export const COMMENT_STATUS_LABELS: Record<string, string> = {
  approved: "Đã duyệt",
  rejected: "Từ chối",
};
