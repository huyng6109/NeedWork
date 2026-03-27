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

export const FILE_LIMITS = {
  AVATAR_MAX_MB: 2,
  CV_MAX_MB: 5,
  AVATAR_TYPES: ["image/jpeg", "image/png", "image/webp"],
  CV_TYPES: ["application/pdf"],
} as const;

export const TRUST_RING = {
  REVIEWS_TO_RESTORE: 5,
  FRAME_COLOR: "blue",
} as const;

export const WARNING = {
  RESPONSE_DEADLINE_DAYS: 7,
} as const;

export const SALARY_LABELS: Record<string, string> = {
  "0": "Thỏa thuận",
};

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
