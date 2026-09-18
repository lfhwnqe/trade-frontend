"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { FitImagePreview } from "@/components/common/FitImagePreview";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { ImageRecognitionFlashcardImage } from "./types";

export type ImageGallerySelection = {
  images: ImageRecognitionFlashcardImage[];
  index: number;
};

export function ImageGalleryPreview({ selection, onChange }: {
  selection: ImageGallerySelection | null;
  onChange: (selection: ImageGallerySelection | null) => void;
}) {
  const images = selection?.images || [];
  const index = Math.min(selection?.index || 0, Math.max(0, images.length - 1));
  const goTo = (nextIndex: number) => {
    if (!selection || nextIndex < 0 || nextIndex >= images.length) return;
    onChange({ ...selection, index: nextIndex });
  };

  return (
    <Dialog open={!!selection && images.length > 0} onOpenChange={(open) => !open && onChange(null)}>
      <DialogContent
        className="flex h-[calc(100dvh-24px)] max-h-none w-[calc(100vw-24px)] max-w-none flex-col gap-2 overflow-hidden border-[#27272a] bg-[#121212] p-3 text-[#e5e7eb] sm:max-w-none"
        aria-describedby={undefined}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            goTo(index + (event.key === "ArrowLeft" ? -1 : 1));
          }
        }}
      >
        <DialogTitle className="shrink-0 pr-8 text-sm">当前闪卡 · 图片 {index + 1} / {images.length}</DialogTitle>
        <div className="min-h-0 w-full flex-1">
          {images[index] ? <FitImagePreview key={images[index].url} src={images[index].url} alt={`闪卡图片 ${index + 1}`} /> : null}
        </div>
        {images.length > 1 ? (
          <div className="flex shrink-0 items-center justify-center gap-3">
            <Button type="button" variant="outline" disabled={index === 0} onClick={() => goTo(index - 1)}>
              <ChevronLeft className="mr-1 h-4 w-4" />上一张
            </Button>
            <span className="text-sm tabular-nums" aria-live="polite">{index + 1} / {images.length}</span>
            <Button type="button" variant="outline" disabled={index === images.length - 1} onClick={() => goTo(index + 1)}>
              下一张<ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
