import type { UserRole } from "@/types";

export function canActAsCandidate(role: UserRole | null | undefined) {
  return role === "candidate" || role === "admin";
}

export function canActAsRecruiter(role: UserRole | null | undefined) {
  return role === "recruiter" || role === "admin";
}
