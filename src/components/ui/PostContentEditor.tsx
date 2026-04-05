"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, List, ListChecks, MapPin, Smile, X } from "lucide-react";
import toast from "react-hot-toast";

import { PostImageGallery } from "@/components/post/PostImageGallery";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { cn } from "@/lib/utils";

type PostContentEditorVariant = "default" | "composer";

interface ComposerImage {
  alt: string;
  url: string;
}

const EMOJI_OPTIONS = [
  "😀",
  "😂",
  "😍",
  "🥳",
  "😎",
  "🤝",
  "👍",
  "🙏",
  "🔥",
  "💼",
  "📍",
  "📅",
  "⭐",
  "🎯",
  "🚀",
  "💡",
  "❤️",
  "👏",
] as const;

const IMAGE_MARKDOWN_PATTERN = /^!\[(.*?)\]\((https?:\/\/[^\s)]+)\)$/;

interface PostContentEditorProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  rows?: number;
  variant?: PostContentEditorVariant;
  labelHidden?: boolean;
  allowImages?: boolean;
}

function normalizeInsertion(value: string, insertAt: number, selectedTo: number, snippet: string) {
  const before = value.slice(0, insertAt);
  const after = value.slice(selectedTo);
  const needsLeadingNewline = before.length > 0 && !before.endsWith("\n");
  const needsTrailingNewline = after.length > 0 && !after.startsWith("\n");

  return (
    before +
    (needsLeadingNewline ? "\n\n" : "") +
    snippet +
    (needsTrailingNewline ? "\n\n" : "\n") +
    after
  );
}

function inlineInsertion(value: string, insertAt: number, selectedTo: number, snippet: string) {
  return value.slice(0, insertAt) + snippet + value.slice(selectedTo);
}

function buildImageMarkdown(image: ComposerImage) {
  return `![${image.alt}](${image.url})`;
}

function composeComposerValue(text: string, images: ComposerImage[]) {
  const imageMarkdown = images.map(buildImageMarkdown);

  if (!imageMarkdown.length) {
    return text;
  }

  if (!text.length) {
    return imageMarkdown.join("\n\n");
  }

  return `${text}\n\n${imageMarkdown.join("\n\n")}`;
}

function splitComposerContent(content: string) {
  const lines = content.split("\n");
  const imageLines: string[] = [];
  let cursor = lines.length - 1;
  let foundImage = false;

  while (cursor >= 0) {
    const trimmedLine = lines[cursor].trim();

    if (!trimmedLine) {
      if (foundImage) {
        imageLines.unshift(lines[cursor]);
      }
      cursor -= 1;
      continue;
    }

    if (trimmedLine.match(IMAGE_MARKDOWN_PATTERN)) {
      foundImage = true;
      imageLines.unshift(lines[cursor]);
      cursor -= 1;
      continue;
    }

    break;
  }

  if (!foundImage) {
    return { text: content, images: [] as ComposerImage[] };
  }

  const textLines = lines.slice(0, cursor + 1);

  if (textLines[textLines.length - 1] === "") {
    textLines.pop();
  }

  const images = imageLines.flatMap((line) => {
    const match = line.trim().match(IMAGE_MARKDOWN_PATTERN);
    if (!match) return [];

    return [{ alt: match[1] || "post-image", url: match[2] }];
  });

  return {
    text: textLines.join("\n"),
    images,
  };
}

function parseUploadedImage(payload: { markdown?: string | null; url?: string | null }, file: File) {
  const fallbackAlt = file.name.replace(/\.[^.]+$/, "").trim() || "post-image";

  if (payload.markdown) {
    const match = payload.markdown.match(IMAGE_MARKDOWN_PATTERN);
    if (match) {
      return { alt: match[1] || fallbackAlt, url: match[2] };
    }
  }

  if (payload.url) {
    return { alt: fallbackAlt, url: payload.url };
  }

  return null;
}

interface ComposerActionButtonProps {
  title: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}

function ComposerActionButton({
  title,
  onClick,
  disabled,
  children,
}: ComposerActionButtonProps) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors",
        "hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
        "disabled:cursor-not-allowed disabled:opacity-50"
      )}
    >
      {children}
    </button>
  );
}

export function PostContentEditor({
  label,
  name,
  value,
  onChange,
  placeholder,
  required,
  rows = 6,
  variant = "default",
  labelHidden = false,
  allowImages = true,
}: PostContentEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [replaceImageIndex, setReplaceImageIndex] = useState<number | null>(null);

  const composerContent =
    variant === "composer"
      ? splitComposerContent(value)
      : { text: value, images: [] as ComposerImage[] };
  const composerText = composerContent.text;
  const composerImages = composerContent.images;
  const resolvedPlaceholder = variant === "composer" ? "Có gì mới?" : placeholder;

  useEffect(() => {
    if (!emojiPickerOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (!editorRef.current?.contains(event.target as Node)) {
        setEmojiPickerOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [emojiPickerOpen]);

  function notifyImagesDisabled() {
    toast.error("Form này không hỗ trợ chèn ảnh");
  }

  function setComposerContent(nextText: string, nextImages: ComposerImage[]) {
    onChange(composeComposerValue(nextText, nextImages));
  }

  function focusFilePicker(imageIndex?: number) {
    if (!allowImages) {
      notifyImagesDisabled();
      return;
    }

    setReplaceImageIndex(imageIndex ?? null);

    const input = fileInputRef.current;
    if (!input) return;

    if (typeof input.showPicker === "function") {
      input.showPicker();
      return;
    }

    input.click();
  }

  function restoreFocus(caretPosition?: number) {
    requestAnimationFrame(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      textarea.focus();
      if (typeof caretPosition === "number") {
        textarea.setSelectionRange(caretPosition, caretPosition);
      }
    });
  }

  function insertBlockSnippet(snippet: string) {
    const textarea = textareaRef.current;
    const currentValue = variant === "composer" ? composerText : value;
    const start = textarea?.selectionStart ?? currentValue.length;
    const end = textarea?.selectionEnd ?? currentValue.length;
    const nextValue = normalizeInsertion(currentValue, start, end, snippet);

    if (variant === "composer") {
      setComposerContent(nextValue, composerImages);
    } else {
      onChange(nextValue);
    }

    restoreFocus();
  }

  function insertInlineSnippet(snippet: string) {
    const textarea = textareaRef.current;
    const currentValue = variant === "composer" ? composerText : value;
    const start = textarea?.selectionStart ?? currentValue.length;
    const end = textarea?.selectionEnd ?? currentValue.length;
    const nextValue = inlineInsertion(currentValue, start, end, snippet);

    if (variant === "composer") {
      setComposerContent(nextValue, composerImages);
    } else {
      onChange(nextValue);
    }

    restoreFocus(start + snippet.length);
  }

  function removeComposerImage(imageIndex: number) {
    const nextImages = composerImages.filter((_, index) => index !== imageIndex);
    setComposerContent(composerText, nextImages);
  }

  async function uploadFile(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/posts/images", {
      method: "POST",
      body: formData,
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        ok: false as const,
        error: payload?.error ?? "Không thể tải tệp lên",
      };
    }

    return {
      ok: true as const,
      payload: payload ?? {},
    };
  }

  async function handleFiles(files: FileList | null) {
    const selectedFiles = Array.from(files ?? []).filter((file) => file.type.startsWith("image/"));
    if (!selectedFiles.length) return;

    if (!allowImages) {
      notifyImagesDisabled();
      return;
    }

    setUploading(true);

    try {
      const filesToProcess =
        replaceImageIndex != null ? selectedFiles.slice(0, 1) : selectedFiles;
      const uploadedResults: Array<{
        file: File;
        payload: { markdown?: string | null; url?: string | null };
      }> = [];

      for (const file of filesToProcess) {
        const result = await uploadFile(file);

        if (!result.ok) {
          toast.error(result.error);
          continue;
        }

        uploadedResults.push({ file, payload: result.payload });
      }

      if (!uploadedResults.length) {
        return;
      }

      if (variant === "composer") {
        const uploadedImages = uploadedResults.flatMap(({ file, payload }) => {
          const image = parseUploadedImage(payload, file);
          return image ? [image] : [];
        });

        if (!uploadedImages.length) {
          toast.error("Không thể hiển thị ảnh trong nội dung");
          return;
        }

        const nextImages = [...composerImages];

        if (replaceImageIndex != null && nextImages[replaceImageIndex]) {
          nextImages[replaceImageIndex] = uploadedImages[0];
          nextImages.push(...uploadedImages.slice(1));
        } else {
          nextImages.push(...uploadedImages);
        }

        setComposerContent(composerText, nextImages);
        toast.success(
          uploadedImages.length === 1
            ? replaceImageIndex != null
              ? "Đã cập nhật ảnh trong nội dung"
              : "Đã thêm ảnh vào nội dung"
            : `Đã thêm ${uploadedImages.length} ảnh vào nội dung`
        );
        return;
      }

      const markdownSnippets = uploadedResults
        .map(({ payload }) => payload.markdown)
        .filter((markdown): markdown is string => Boolean(markdown));

      if (!markdownSnippets.length) {
        toast.error("Không thể chèn tệp vào nội dung");
        return;
      }

      insertBlockSnippet(markdownSnippets.join("\n\n"));
      toast.success(
        markdownSnippets.length === 1
          ? "Đã chèn tệp vào nội dung"
          : `Đã chèn ${markdownSnippets.length} ảnh vào nội dung`
      );
    } finally {
      setUploading(false);
      setReplaceImageIndex(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  const inputAccept = "image/jpeg,image/jpg,image/png,image/webp,image/gif";

  return (
    <div ref={editorRef} className="space-y-2">
      {variant === "default" ? (
        <div className="flex items-center justify-between gap-3">
          <label
            htmlFor={name}
            className={cn("text-sm font-medium text-dark", labelHidden && "sr-only")}
          >
            {label}
            {required && <span className="ml-1 text-red-500">*</span>}
          </label>

          {allowImages ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              loading={uploading}
              className="gap-1.5"
              onClick={() => focusFilePicker()}
            >
              <ImagePlus size={14} />
              Chèn ảnh
            </Button>
          ) : null}
        </div>
      ) : (
        <label
          htmlFor={name}
          className={cn("text-sm font-medium text-dark", labelHidden && "sr-only")}
        >
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}

      {allowImages ? (
        <input
          ref={fileInputRef}
          type="file"
          accept={inputAccept}
          multiple
          className="hidden"
          onChange={(event) => void handleFiles(event.target.files)}
        />
      ) : null}

      <div
        className={cn(
          variant === "composer"
            ? "overflow-hidden rounded-2xl border border-border bg-[var(--card-bg)]"
            : "rounded-xl border border-transparent transition-colors",
          dragActive && "border-brand-500 bg-brand-500/5"
        )}
        onDragOver={(event) => {
          if (!allowImages) return;
          event.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={(event) => {
          if (!allowImages) return;
          event.preventDefault();
          setDragActive(false);
        }}
        onDrop={(event) => {
          const hasFiles = event.dataTransfer.files.length > 0;
          if (!hasFiles) return;

          event.preventDefault();
          setDragActive(false);
          void handleFiles(event.dataTransfer.files);
        }}
      >
        {variant === "composer" ? (
          <>
            <textarea
              ref={textareaRef}
              id={name}
              name={name}
              value={composerText}
              onChange={(event) => setComposerContent(event.target.value, composerImages)}
              placeholder={resolvedPlaceholder}
              required={required}
              rows={rows}
              spellCheck={false}
              autoCorrect="off"
              autoCapitalize="off"
              className={cn(
                "min-h-[120px] w-full resize-none border-0 bg-transparent px-4 py-3 text-sm text-dark placeholder:text-muted",
                "focus:outline-none focus:ring-0",
                dragActive && "bg-brand-500/5"
              )}
              onPaste={(event) => {
                const pastedImages = Array.from(event.clipboardData.files).filter((file) =>
                  file.type.startsWith("image/")
                );

                if (!pastedImages.length) {
                  return;
                }

                event.preventDefault();
                void handleFiles(event.clipboardData.files);
              }}
            />

            {composerImages.length ? (
              <div className="px-3 pb-3">
                <PostImageGallery
                  images={composerImages}
                  renderOverlay={(_, index) => (
                    <button
                      type="button"
                      onClick={() => removeComposerImage(index)}
                      className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/65 text-white transition hover:bg-black/80"
                      aria-label="Xóa ảnh"
                      title="Xóa ảnh"
                    >
                      <X size={18} />
                    </button>
                  )}
                />
              </div>
            ) : null}

            <div className="flex items-center gap-1 border-t border-border px-3 py-2">
              {allowImages ? (
                <>
                  <ComposerActionButton
                    title="Thêm ảnh"
                    onClick={() => focusFilePicker()}
                    disabled={uploading}
                  >
                    <ImagePlus size={18} />
                  </ComposerActionButton>

                  <ComposerActionButton
                    title="Thêm GIF"
                    onClick={() => focusFilePicker()}
                    disabled={uploading}
                  >
                    <span className="text-[11px] font-semibold leading-none">GIF</span>
                  </ComposerActionButton>
                </>
              ) : null}

              <div className="relative">
                <ComposerActionButton
                  title="Chèn icon"
                  onClick={() => setEmojiPickerOpen((current) => !current)}
                >
                  <Smile size={18} />
                </ComposerActionButton>

                {emojiPickerOpen ? (
                  <div className="absolute bottom-full left-0 z-20 mb-2 w-64 rounded-2xl border border-border bg-[#16181C] p-3 shadow-xl">
                    <div className="mb-2 text-xs font-medium text-muted">Chọn icon</div>
                    <div className="grid grid-cols-6 gap-1">
                      {EMOJI_OPTIONS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-lg transition-colors hover:bg-white/5"
                          onClick={() => {
                            insertInlineSnippet(`${emoji} `);
                            setEmojiPickerOpen(false);
                          }}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <ComposerActionButton
                title="Chèn danh sách"
                onClick={() => insertBlockSnippet("- ")}
              >
                <List size={18} />
              </ComposerActionButton>

              <ComposerActionButton
                title="Chèn checklist"
                onClick={() => insertBlockSnippet("- [ ] ")}
              >
                <ListChecks size={18} />
              </ComposerActionButton>

              <ComposerActionButton
                title="Chèn địa điểm"
                onClick={() => insertBlockSnippet("Địa điểm: ")}
              >
                <MapPin size={18} />
              </ComposerActionButton>
            </div>
          </>
        ) : (
          <Textarea
            ref={textareaRef}
            id={name}
            name={name}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={resolvedPlaceholder}
            required={required}
            rows={rows}
            className={cn(dragActive && "border-brand-500")}
            onPaste={(event) => {
              const pastedImages = Array.from(event.clipboardData.files).filter((file) =>
                file.type.startsWith("image/")
              );

              if (!pastedImages.length) {
                return;
              }

              event.preventDefault();
              void handleFiles(event.clipboardData.files);
            }}
          />
        )}
      </div>

      {variant === "default" && allowImages ? (
        <p className="text-xs theme-text-muted">
          Có thể chèn ảnh bằng nút trên, kéo thả vào ô nội dung hoặc dán trực tiếp ảnh.
        </p>
      ) : null}
    </div>
  );
}
