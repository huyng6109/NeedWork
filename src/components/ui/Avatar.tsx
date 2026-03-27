import Image from "next/image";
import { cn, getInitials } from "@/lib/utils";
import type { FrameColor } from "@/types";

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  frameColor?: FrameColor;
  className?: string;
}

const sizeMap = {
  sm: { container: "w-8 h-8",  text: "text-xs",  px: 32,  ring: "ring-2 ring-offset-1" },
  md: { container: "w-10 h-10", text: "text-sm",  px: 40,  ring: "ring-2 ring-offset-2" },
  lg: { container: "w-14 h-14", text: "text-base", px: 56,  ring: "ring-2 ring-offset-2" },
  xl: { container: "w-20 h-20", text: "text-xl",  px: 80,  ring: "ring-[3px] ring-offset-2" },
};

export function Avatar({
  src,
  name,
  size = "md",
  frameColor,
  className,
}: AvatarProps) {
  const { container, text, px, ring } = sizeMap[size];
  const hasTrustRing = frameColor === "blue";
  const displayName = name ?? null;

  return (
    <div
      className={cn(
        "relative inline-flex shrink-0 rounded-full overflow-hidden bg-brand-100",
        container,
        hasTrustRing && `${ring} ring-brand-600`,
        className
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={displayName ?? "avatar"}
          width={px}
          height={px}
          className="object-cover w-full h-full"
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
  );
}
