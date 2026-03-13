"use client";

import React from "react";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  FlashcardPriceLineEditor,
  type FlashcardPriceLineValue,
} from "./FlashcardPriceLineEditor";

function VisuallyHidden(props: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      style={{
        border: 0,
        clip: "rect(0 0 0 0)",
        clipPath: "inset(50%)",
        height: 1,
        width: 1,
        margin: -1,
        overflow: "hidden",
        padding: 0,
        position: "absolute",
        whiteSpace: "nowrap",
      }}
      {...props}
    />
  );
}

type ImagePreviewDialogProps = {
  previewUrl: string | null;
  onClose: () => void;
  revealProgress?: number;
  onRevealProgressChange?: (next: number) => void;
  priceLineEditorEnabled?: boolean;
};

const PREVIEW_WHEEL_REVEAL_STEP = 0.0011;

function clampRevealProgress(value: number) {
  return Math.min(1, Math.max(0, value));
}

export function ImagePreviewDialog({
  previewUrl,
  onClose,
  revealProgress,
  onRevealProgressChange,
  priceLineEditorEnabled = false,
}: ImagePreviewDialogProps) {
  const [priceLineValue, setPriceLineValue] = React.useState<FlashcardPriceLineValue>({});

  const revealEnabled =
    typeof revealProgress === "number" && typeof onRevealProgressChange === "function";

  React.useEffect(() => {
    if (!previewUrl || !priceLineEditorEnabled) {
      setPriceLineValue({});
    }
  }, [previewUrl, priceLineEditorEnabled]);

  const handleWheel = React.useCallback(
    (event: React.WheelEvent<HTMLDivElement>) => {
      if (!revealEnabled) return;
      event.preventDefault();
      const direction = Math.sign(event.deltaY);
      if (!direction) return;

      const nextProgress = clampRevealProgress(
        revealProgress + direction * PREVIEW_WHEEL_REVEAL_STEP * Math.max(Math.abs(event.deltaY), 12),
      );
      onRevealProgressChange(nextProgress);
    },
    [onRevealProgressChange, revealEnabled, revealProgress],
  );

  return (
    <Dialog open={!!previewUrl} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex w-[min(100vw-24px,1200px)] max-w-none items-center justify-center border-none bg-black/92 p-4 shadow-none sm:w-[min(100vw-48px,1200px)] sm:max-w-none">
        <DialogTitle asChild>
          <VisuallyHidden>图片预览</VisuallyHidden>
        </DialogTitle>
        <DialogClose className="absolute right-4 top-4 z-20" aria-label="关闭" />
        {previewUrl ? (
          priceLineEditorEnabled ? (
            <div className="w-full max-w-[1100px]">
              <FlashcardPriceLineEditor
                imageUrl={previewUrl}
                value={priceLineValue}
                onChange={setPriceLineValue}
                title="盈亏比辅助线（预览态）"
                revealProgress={revealEnabled ? revealProgress : undefined}
                onRevealProgressChange={revealEnabled ? onRevealProgressChange : undefined}
              />
            </div>
          ) : (
            <div className="relative" onWheel={handleWheel}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="preview"
                className="max-h-[85vh] max-w-[95vw] rounded border border-[#27272a] bg-black object-contain"
              />
              {revealEnabled ? (
                <>
                  <div
                    className="pointer-events-none absolute inset-y-0 right-0 origin-right rounded-r bg-[#050816] shadow-[-12px_0_24px_rgba(5,8,22,0.85)]"
                    style={{
                      width: "100%",
                      transform: `scaleX(${Math.max(1 - revealProgress, 0)})`,
                      willChange: "transform",
                    }}
                  >
                    <div className="absolute inset-0 bg-[linear-gradient(270deg,rgba(5,8,22,0.98)_0%,rgba(5,8,22,0.98)_86%,rgba(5,8,22,0.35)_100%)]" />
                  </div>
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/70 via-black/20 to-transparent px-3 py-3 text-xs text-white/85">
                    <span>滚轮向下逐步揭开，向上重新遮住</span>
                    <span>{Math.round(revealProgress * 100)}%</span>
                  </div>
                </>
              ) : null}
            </div>
          )
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
