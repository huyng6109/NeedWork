import type { Notification } from "@/types";

export const NOTIFICATION_TYPES = {
  POST_COMMENT: "post_comment",
  COMMENT_REPLY: "comment_reply",
  APPLICATION_SUBMITTED: "application_submitted",
  APPLICATION_APPROVED: "application_approved",
  APPLICATION_REJECTED: "application_rejected",
} as const;

export function getNotificationHref(notification: Pick<Notification, "post_id">) {
  if (notification.post_id) {
    return `/post/${notification.post_id}`;
  }

  return "/account";
}

export function truncateNotificationBody(body: string | null, maxLength = 120) {
  if (!body) return null;
  if (body.length <= maxLength) return body;
  return `${body.slice(0, maxLength - 1)}…`;
}
