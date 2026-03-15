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
  answerPreviewUrl?: string | null;
  onClose: () => void;
  revealProgress?: number;
  onRevealProgressChange?: (next: number) => void;
  priceLineEditorEnabled?: boolean;
  priceLineValue?: FlashcardPriceLineValue;
  onPriceLineChange?: (next: FlashcardPriceLineValue) => void;
  footer?: React.ReactNode;
};

const PREVIEW_WHEEL_REVEAL_STEP = 0.00033;

function clampRevealProgress(value: number) {
  return Math.min(1, Math.max(0, value));
}

export function ImagePreviewDialog({
  previewUrl,
  answerPreviewUrl,
  onClose,
  revealProgress,
  onRevealProgressChange,
  priceLineEditorEnabled = false,
  priceLineValue,
  onPriceLineChange,
  footer,
}: ImagePreviewDialogProps) {
  const [internalPriceLineValue, setInternalPriceLineValue] = React.useState<FlashcardPriceLineValue>({});
  const [showAnswerPreview, setShowAnswerPreview] = React.useState(false);

  const revealEnabled =
    typeof revealProgress === "number" && typeof onRevealProgressChange === "function";

  const resolvedPriceLineValue = priceLineValue ?? internalPriceLineValue;
  const resolvedSetPriceLineValue = onPriceLineChange ?? setInternalPriceLineValue;
  const hadOpenPreviewRef = React.useRef(false);

  React.useEffect(() => {
    const hasOpenPreview = !!previewUrl;

    if (priceLineEditorEnabled && hasOpenPreview) {
      hadOpenPreviewRef.current = true;
      return;
    }

    if (!hadOpenPreviewRef.current) {
      return;
    }

    hadOpenPreviewRef.current = false;
    resolvedSetPriceLineValue({});
  }, [previewUrl, priceLineEditorEnabled, resolvedSetPriceLineValue]);

  React.useEffect(() => {
    setShowAnswerPreview(false);
  }, [previewUrl, answerPreviewUrl]);

  React.useEffect(() => {
    if (!previewUrl || !answerPreviewUrl) return;

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName;
      if (tagName === "INPUT" || tagName === "TEXTAREA" || target?.isContentEditable) {
        return;
      }
      if (event.code !== "Space") return;
      event.preventDefault();
      setShowAnswerPreview((prev) => !prev);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [answerPreviewUrl, previewUrl]);

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
      <DialogContent className="flex h-[min(92vh,980px)] w-[min(100vw-24px,1400px)] max-w-none flex-col border-none bg-black/92 p-3 shadow-none sm:w-[min(100vw-48px,1400px)] sm:max-w-none">
        <DialogTitle asChild>
          <VisuallyHidden>图片预览</VisuallyHidden>
        </DialogTitle>
        <DialogClose className="absolute right-4 top-4 z-20" aria-label="关闭" />
        {previewUrl ? (
          priceLineEditorEnabled ? (
            <div className="flex h-full min-h-0 w-full flex-1 flex-col gap-3 overflow-hidden">
              {answerPreviewUrl ? (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-[#27272a] bg-[#111827]/70 px-3 py-2 text-xs text-[#cbd5e1]">
                  <div>
                    {showAnswerPreview
                      ? "当前是答案图预览；可用按钮或空格键切回问题图。"
                      : "当前是问题图预览；可用按钮或空格键切到答案图。"}
                  </div>
                  <button
                    type="button"
                    className="rounded-md border border-[#27272a] bg-[#1e1e1e] px-3 py-1.5 text-[#e5e7eb] hover:bg-[#242424]"
                    onClick={() => setShowAnswerPreview((prev) => !prev)}
                  >
                    {showAnswerPreview ? "返回问题图（空格）" : "显示答案图（空格）"}
                  </button>
                </div>
              ) : null}

              <div className="min-h-0 flex-1 overflow-hidden">
                {showAnswerPreview && answerPreviewUrl ? (
                  <div className="flex h-full flex-col space-y-2 rounded-xl border border-[#27272a] bg-[#18181b] p-3">
                    <div className="shrink-0 text-sm font-medium text-[#e5e7eb]">答案图</div>
                    <div className="shrink-0 text-xs text-[#9ca3af]">答案图以独立大框展示，会覆盖当前的问题图预览视图。</div>
                    <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-[#27272a] bg-black">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={answerPreviewUrl}
                        alt="answer-preview"
                        className="h-full w-full object-contain"
                      />
                    </div>
                  </div>
                ) : (
                  <FlashcardPriceLineEditor
                    imageUrl={previewUrl}
                    value={resolvedPriceLineValue}
                    onChange={resolvedSetPriceLineValue}
                    title="问题图：盈亏比辅助线"
                    revealProgress={revealEnabled ? revealProgress : undefined}
                    onRevealProgressChange={revealEnabled ? onRevealProgressChange : undefined}
                    className="flex h-full min-h-0 flex-col overflow-hidden"
                    imageViewportClassName="h-[520px] lg:h-[560px]"
                  />
                )}
              </div>
              {footer ? <div className="shrink-0 border-t border-[#27272a] pt-3">{footer}</div> : null}
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
                    className="pointer-events-none absolute inset-y-0 right-0 origin-right rounded-r bg-[#050816]"
                    style={{
                      width: "100%",
                      transform: `scaleX(${Math.max(1 - revealProgress, 0)})`,
                      willChange: "transform",
                    }}
                  >
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
