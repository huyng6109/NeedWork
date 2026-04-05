import { resolveStorageUrl } from "@/lib/storage";
import { cn } from "@/lib/utils";

export interface PostImageGalleryItem {
  alt: string;
  url: string;
}

interface PostImageGalleryProps {
  images: PostImageGalleryItem[];
  className?: string;
  renderOverlay?: (image: PostImageGalleryItem, index: number) => React.ReactNode;
}

function getContainerClassName(count: number) {
  if (count <= 1) {
    return "grid grid-cols-1 gap-2";
  }

  if (count === 2) {
    return "grid grid-cols-2 gap-2";
  }

  return "grid grid-cols-2 auto-rows-[140px] gap-2 sm:auto-rows-[180px]";
}

function getItemClassName(count: number, index: number) {
  if (count === 1) {
    return "aspect-[16/10]";
  }

  if (count === 2) {
    return "aspect-[4/5]";
  }

  if (index === 0) {
    return "row-span-2 h-full";
  }

  return "h-full";
}

export function PostImageGallery({
  images,
  className,
  renderOverlay,
}: PostImageGalleryProps) {
  if (!images.length) {
    return null;
  }

  return (
    <div className={cn(getContainerClassName(images.length), className)}>
      {images.map((image, index) => (
        <figure
          key={`${image.url}-${index}`}
          className={cn(
            "relative overflow-hidden rounded-2xl border border-border bg-[var(--card-bg)]",
            getItemClassName(images.length, index)
          )}
        >
          <img
            src={resolveStorageUrl(image.url) ?? image.url}
            alt={image.alt || "post-image"}
            className="block h-full w-full object-cover"
            loading="lazy"
          />

          {renderOverlay ? renderOverlay(image, index) : null}
        </figure>
      ))}
    </div>
  );
}
