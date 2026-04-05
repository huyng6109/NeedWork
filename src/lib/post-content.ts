export interface PostContentBlock {
  type: "text" | "image";
  text?: string;
  alt?: string;
  url?: string;
}

const IMAGE_LINE_PATTERN = /^!\[(.*?)\]\((https?:\/\/[^\s)]+)\)$/;

export function parsePostContent(content: string): PostContentBlock[] {
  const blocks: PostContentBlock[] = [];
  const textBuffer: string[] = [];

  const flushText = () => {
    const text = textBuffer.join("\n").trim();
    if (text) {
      blocks.push({ type: "text", text });
    }
    textBuffer.length = 0;
  };

  for (const line of content.split("\n")) {
    const trimmedLine = line.trim();
    const imageMatch = trimmedLine.match(IMAGE_LINE_PATTERN);

    if (imageMatch) {
      flushText();
      blocks.push({
        type: "image",
        alt: imageMatch[1] || "post-image",
        url: imageMatch[2],
      });
      continue;
    }

    textBuffer.push(line);
  }

  flushText();

  return blocks;
}

export function stripPostContentImages(content: string) {
  return content
    .split("\n")
    .filter((line) => !line.trim().match(IMAGE_LINE_PATTERN))
    .join("\n")
    .trim();
}

export function getPostContentPreview(content: string) {
  const textOnly = stripPostContentImages(content);
  const normalizedLines = textOnly
    .split("\n")
    .map((line) => line.replace(/[^\S\r\n]+/g, " ").trim())
    .reduce<string[]>((lines, line) => {
      if (!line) {
        if (lines.length > 0 && lines[lines.length - 1] !== "") {
          lines.push("");
        }
        return lines;
      }

      lines.push(line);
      return lines;
    }, []);

  const preview = normalizedLines.join("\n").trim();
  return preview || "Bài viết có hình ảnh";
}

export function getFirstPostContentImage(content: string) {
  return parsePostContent(content).find((block) => block.type === "image" && block.url)?.url ?? null;
}
