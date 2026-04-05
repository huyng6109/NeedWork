import Image from "next/image";
import { resolveStorageUrl } from "@/lib/storage";
import { cn, getInitials } from "@/lib/utils";
import type { FrameColor, UserRole } from "@/types";

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  frameColor?: FrameColor;
  role?: UserRole | null;
  className?: string;
}

const sizeMap = {
  sm: { container: "w-8 h-8", text: "text-xs", px: 32, border: "p-[2px]" },
  md: { container: "w-10 h-10", text: "text-sm", px: 40, border: "p-[2px]" },
  lg: { container: "w-14 h-14", text: "text-base", px: 56, border: "p-[2.5px]" },
  xl: { container: "w-20 h-20", text: "text-xl", px: 80, border: "p-[3px]" },
};

export function Avatar({
  src,
  name,
  size = "md",
  frameColor,
  role,
  className,
}: AvatarProps) {
  const { container, text, px, border } = sizeMap[size];
  const hasTrustRing = frameColor === "green";
  const hasAdminRing = role === "admin";
  const displayName = name ?? null;
  const resolvedSrc = resolveStorageUrl(src);

  return (
    <div
      className={cn(
        "relative inline-flex shrink-0 rounded-full",
        container,
        (hasAdminRing || hasTrustRing) && border,
        hasTrustRing && !hasAdminRing && "bg-emerald-500",
        hasAdminRing &&
          "bg-[conic-gradient(from_180deg_at_50%_50%,#ff4d4f_0deg,#ff9f1a_55deg,#ffd60a_110deg,#33d17a_165deg,#35c4ff_220deg,#5b8cff_275deg,#c96dff_330deg,#ff4d4f_360deg)]",
        className
      )}
    >
      <div className="relative h-full w-full overflow-hidden rounded-full bg-brand-100">
        {resolvedSrc ? (
          <Image
            src={resolvedSrc}
            alt={displayName ?? "avatar"}
            width={px}
            height={px}
            unoptimized
            className="h-full w-full object-cover"
          />
        ) : (
          <span
            className={cn(
              "flex items-center justify-center w-full h-full font-semibold text-brand-700",
              text
            )}
          >
            {getInitials(displayName)}
          </span>
        )}
      </div>
    </div>
  );
}
