import { cn } from "@/lib/utils";

type BadgeVariant =
  | "applied"
  | "approved"
  | "rejected"
  | "pending"
  | "warning"
  | "blue"
  | "gray";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  applied:  "bg-[var(--badge-applied-bg)] text-[var(--badge-applied-text)] border border-[var(--badge-applied-border)]",
  approved: "bg-[var(--badge-approved-bg)] text-[var(--badge-approved-text)] border border-[var(--badge-approved-border)]",
  rejected: "bg-[var(--badge-rejected-bg)] text-[var(--badge-rejected-text)] border border-[var(--badge-rejected-border)]",
  pending:  "bg-yellow-500/15 text-yellow-200 border border-yellow-500/30",
  warning:  "bg-orange-500/15 text-orange-200 border border-orange-500/30",
  blue:     "bg-[var(--badge-blue-bg)] text-[var(--badge-blue-text)] border border-[var(--badge-blue-border)]",
  gray:     "bg-[var(--badge-gray-bg)] text-[var(--badge-gray-text)] border border-[var(--badge-gray-border)]",
};

export function Badge({ variant = "gray", children, className }: BadgeProps) {
  return (
    <span className={cn("badge", variantStyles[variant], className)}>
      {children}
    </span>
  );
}
