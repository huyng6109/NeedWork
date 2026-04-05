export const ADMIN_USERNAME = "admin";

export interface AdminProfileLike {
  role?: string | null;
  username?: string | null;
}

export function normalizeUsername(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

export function isStrictAdmin(profile: AdminProfileLike | null | undefined) {
  return profile?.role === "admin" && normalizeUsername(profile.username) === ADMIN_USERNAME;
}
