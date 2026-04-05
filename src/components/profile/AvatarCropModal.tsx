"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

const CROP_VIEWPORT_SIZE = 280;
const OUTPUT_SIZE = 640;
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

type Position = {
  x: number;
  y: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getCoverDimensions(width: number, height: number) {
  const aspectRatio = width / height;

  if (aspectRatio >= 1) {
    return {
      width: CROP_VIEWPORT_SIZE * aspectRatio,
      height: CROP_VIEWPORT_SIZE,
    };
  }

  return {
    width: CROP_VIEWPORT_SIZE,
    height: CROP_VIEWPORT_SIZE / aspectRatio,
  };
}

function getCenteredPosition(renderedWidth: number, renderedHeight: number): Position {
  return {
    x: (CROP_VIEWPORT_SIZE - renderedWidth) / 2,
    y: (CROP_VIEWPORT_SIZE - renderedHeight) / 2,
  };
}

function clampPosition(
  position: Position,
  renderedWidth: number,
  renderedHeight: number
): Position {
  return {
    x: clamp(position.x, Math.min(0, CROP_VIEWPORT_SIZE - renderedWidth), 0),
    y: clamp(position.y, Math.min(0, CROP_VIEWPORT_SIZE - renderedHeight), 0),
  };
}

interface AvatarCropModalProps {
  file: File | null;
  open: boolean;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (file: File) => Promise<void> | void;
}

export function AvatarCropModal({
  file,
  open,
  loading = false,
  onClose,
  onConfirm,
}: AvatarCropModalProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });

  const dragStateRef = useRef<{
    pointerId: number;
    originX: number;
    originY: number;
    startX: number;
    startY: number;
  } | null>(null);

  useEffect(() => {
    if (!file || !open) {
      setPreviewUrl(null);
      setImageElement(null);
      return;
    }

    const nextPreviewUrl = URL.createObjectURL(file);
    setPreviewUrl(nextPreviewUrl);

    return () => {
      URL.revokeObjectURL(nextPreviewUrl);
    };
  }, [file, open]);

  useEffect(() => {
    if (!previewUrl) {
      setImageElement(null);
      return;
    }

    const nextImage = new Image();
    nextImage.onload = () => {
      setImageElement(nextImage);
      setZoom(MIN_ZOOM);

      const baseDimensions = getCoverDimensions(
        nextImage.naturalWidth,
        nextImage.naturalHeight
      );
      setPosition(getCenteredPosition(baseDimensions.width, baseDimensions.height));
    };
    nextImage.src = previewUrl;
  }, [previewUrl]);

  const baseDimensions = useMemo(() => {
    if (!imageElement) {
      return null;
    }

    return getCoverDimensions(imageElement.naturalWidth, imageElement.naturalHeight);
  }, [imageElement]);

  const renderedWidth = baseDimensions ? baseDimensions.width * zoom : CROP_VIEWPORT_SIZE;
  const renderedHeight = baseDimensions ? baseDimensions.height * zoom : CROP_VIEWPORT_SIZE;
  const clampedPosition = clampPosition(position, renderedWidth, renderedHeight);

  useEffect(() => {
    if (!baseDimensions) {
      return;
    }

    setPosition((current) =>
      clampPosition(current, baseDimensions.width * zoom, baseDimensions.height * zoom)
    );
  }, [baseDimensions, zoom]);

  function handleZoomChange(nextZoom: number) {
    if (!baseDimensions) {
      setZoom(nextZoom);
      return;
    }

    const previousRenderedWidth = baseDimensions.width * zoom;
    const previousRenderedHeight = baseDimensions.height * zoom;
    const nextRenderedWidth = baseDimensions.width * nextZoom;
    const nextRenderedHeight = baseDimensions.height * nextZoom;

    const focalPointX = (-clampedPosition.x + CROP_VIEWPORT_SIZE / 2) / previousRenderedWidth;
    const focalPointY = (-clampedPosition.y + CROP_VIEWPORT_SIZE / 2) / previousRenderedHeight;

    const nextPosition = clampPosition(
      {
        x: -(focalPointX * nextRenderedWidth - CROP_VIEWPORT_SIZE / 2),
        y: -(focalPointY * nextRenderedHeight - CROP_VIEWPORT_SIZE / 2),
      },
      nextRenderedWidth,
      nextRenderedHeight
    );

    setZoom(nextZoom);
    setPosition(nextPosition);
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!imageElement || loading) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    dragStateRef.current = {
      pointerId: event.pointerId,
      originX: clampedPosition.x,
      originY: clampedPosition.y,
      startX: event.clientX,
      startY: event.clientY,
    };
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const dragState = dragStateRef.current;

    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    setPosition(
      clampPosition(
        {
          x: dragState.originX + (event.clientX - dragState.startX),
          y: dragState.originY + (event.clientY - dragState.startY),
        },
        renderedWidth,
        renderedHeight
      )
    );
  }

  function handlePointerRelease(event: ReactPointerEvent<HTMLDivElement>) {
    const dragState = dragStateRef.current;

    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    dragStateRef.current = null;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  async function handleConfirm() {
    if (!file || !imageElement) {
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const cropX = (-clampedPosition.x / renderedWidth) * imageElement.naturalWidth;
    const cropY = (-clampedPosition.y / renderedHeight) * imageElement.naturalHeight;
    const cropWidth = (CROP_VIEWPORT_SIZE / renderedWidth) * imageElement.naturalWidth;
    const cropHeight = (CROP_VIEWPORT_SIZE / renderedHeight) * imageElement.naturalHeight;

    context.drawImage(
      imageElement,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      OUTPUT_SIZE,
      OUTPUT_SIZE
    );

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.95);
    });

    if (!blob) {
      return;
    }

    const fileNameBase = file.name.replace(/\.[^.]+$/, "") || "avatar";
    const croppedFile = new File([blob], `${fileNameBase}-cropped.jpg`, {
      type: blob.type,
    });

    await onConfirm(croppedFile);
  }

  function handleReset() {
    if (!baseDimensions) {
      return;
    }

    setZoom(MIN_ZOOM);
    setPosition(getCenteredPosition(baseDimensions.width, baseDimensions.height));
  }

  return (
    <Modal
      open={open}
      onClose={loading ? () => undefined : onClose}
      title="Chỉnh avatar"
      className="max-w-lg"
    >
      <div className="space-y-5">
        <div className="text-sm text-muted">
          Kéo ảnh để canh lại khung hình và dùng thanh zoom nếu cần.
        </div>

        <div className="flex justify-center">
          <div
            className="relative overflow-hidden rounded-[32px] border border-border bg-black touch-none select-none"
            style={{ width: CROP_VIEWPORT_SIZE, height: CROP_VIEWPORT_SIZE }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerRelease}
            onPointerCancel={handlePointerRelease}
          >
            {previewUrl && imageElement ? (
              <img
                src={previewUrl}
                alt="Avatar crop preview"
                draggable={false}
                className="absolute max-w-none cursor-grab active:cursor-grabbing"
                style={{
                  width: renderedWidth,
                  height: renderedHeight,
                  transform: `translate(${clampedPosition.x}px, ${clampedPosition.y}px)`,
                }}
              />
            ) : null}

            <div className="pointer-events-none absolute inset-3 rounded-full border border-white/80 shadow-[0_0_0_9999px_rgba(6,10,16,0.58)]" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>Zoom</span>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs text-brand-300 transition hover:bg-white/5"
            >
              <RotateCcw size={12} />
              Reset
            </button>
          </div>

          <input
            type="range"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            onChange={(event) => handleZoomChange(Number(event.target.value))}
            className="w-full accent-[var(--brand-500)]"
          />
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            Hủy
          </Button>
          <Button type="button" onClick={() => void handleConfirm()} loading={loading}>
            Lưu avatar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
