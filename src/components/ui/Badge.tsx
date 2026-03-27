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
  applied:  "bg-blue-50 text-blue-700 border border-blue-200",
  approved: "bg-green-50 text-green-700 border border-green-200",
  rejected: "bg-red-50 text-red-700 border border-red-200",
  pending:  "bg-yellow-50 text-yellow-700 border border-yellow-200",
  warning:  "bg-orange-50 text-orange-700 border border-orange-200",
  blue:     "bg-brand-50 text-brand-700 border border-brand-200",
  gray:     "bg-gray-100 text-gray-600 border border-gray-200",
};

export function Badge({ variant = "gray", children, className }: BadgeProps) {
  return (
    <span className={cn("badge", variantStyles[variant], className)}>
      {children}
    </span>
  );
}
