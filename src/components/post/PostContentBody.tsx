import { cn } from "@/lib/utils";
import { parsePostContent } from "@/lib/post-content";
import { PostImageGallery, type PostImageGalleryItem } from "@/components/post/PostImageGallery";

interface PostContentBodyProps {
  content: string;
  className?: string;
}

export function PostContentBody({ content, className }: PostContentBodyProps) {
  const blocks = parsePostContent(content);
  const renderedBlocks: Array<
    { type: "text"; text: string } | { type: "gallery"; images: PostImageGalleryItem[] }
  > = [];

  for (const block of blocks) {
    if (block.type === "image" && block.url) {
      const lastBlock = renderedBlocks[renderedBlocks.length - 1];

      if (lastBlock?.type === "gallery") {
        lastBlock.images.push({ alt: block.alt ?? "post-image", url: block.url });
      } else {
        renderedBlocks.push({
          type: "gallery",
          images: [{ alt: block.alt ?? "post-image", url: block.url }],
        });
      }

      continue;
    }

    if (block.type === "text" && block.text) {
      renderedBlocks.push({ type: "text", text: block.text });
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      {renderedBlocks.map((block, index) => {
        if (block.type === "gallery") {
          return (
            <PostImageGallery key={`gallery-${index}`} images={block.images} />
          );
        }

        return (
          <p
            key={`text-${index}`}
            className="whitespace-pre-wrap text-sm leading-relaxed theme-text-secondary"
          >
            {block.text}
          </p>
        );
      })}
    </div>
  );
}
