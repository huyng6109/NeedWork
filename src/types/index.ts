export type UserRole = "candidate" | "recruiter" | "admin";
export type PostType = "job_offer" | "job_seeking";
export type PostStatus = "pending" | "approved" | "rejected";
export type JobType = "full_time" | "part_time";
export type SalaryCurrency =
  | "VND"
  | "USD"
  | "EUR"
  | "GBP"
  | "JPY"
  | "KRW"
  | "SGD"
  | "AUD"
  | "CAD"
  | "CNY"
  | "THB";
export type CommentType = "normal" | "applied";
export type CommentStatus = "approved" | "rejected";
export type ReportStatus = "pending" | "confirmed" | "dismissed";
export type ApplicationStatus = "pending" | "approved" | "rejected";
export type NotificationType =
  | "post_comment"
  | "comment_reply"
  | "application_submitted"
  | "application_approved"
  | "application_rejected";
export type FrameColor = "green" | null;

export interface User {
  id: string;
  email: string;
  username?: string | null;
  name: string | null;
  title: string | null;
  avatar_url: string | null;
  cv_url: string | null;
  role: UserRole;
  frame_color: FrameColor;
  frame_count: number;
  warning_count: number;
  created_at: string;
}

export interface Post {
  id: string;
  author_id: string;
  author?: User;
  type: PostType;
  title: string;
  content: string;
  email: string | null;
  location_name: string | null;
  lat: number | null;
  lng: number | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: SalaryCurrency;
  job_type: JobType | null;
  status: PostStatus;
  created_at: string;
  updated_at: string;
  comment_count?: number;
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  author?: User;
  content: string;
  type: CommentType;
  status: CommentStatus | null;
  responded_at: string | null;
  created_at: string;
  has_applied?: boolean;
  application_cv_url?: string | null;
  reply_to_comment_id?: string | null;
  reply_to_author_name?: string | null;
}

export interface Application {
  id: string;
  post_id: string;
  candidate_id: string;
  comment_id: string | null;
  status: ApplicationStatus;
  applied_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  actor_id: string | null;
  actor?: Pick<User, "id" | "name" | "avatar_url" | "frame_color" | "role"> | null;
  type: NotificationType;
  title: string;
  body: string | null;
  post_id: string | null;
  comment_id: string | null;
  application_id: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  reporter?: User;
  target_post_id: string;
  post?: Post;
  reason: string;
  status: ReportStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface Review {
  id: string;
  reviewer_id: string;
  target_id: string;
  post_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

// API response wrappers
export interface PaginatedResponse<T> {
  data: T[];
  next_cursor: string | null;
}

export interface ApiError {
  error: string;
  status: number;
}

// Feed filter
export interface FeedFilter {
  type: PostType;
  lat?: number;
  lng?: number;
  radius?: number;
  cursor?: string;
}

// Admin stats
export interface AdminStats {
  total_users: number;
  new_users_today: number;
  pending_posts: number;
  pending_reports: number;
  total_posts: number;
  total_applications: number;
}
