"use client";

import React from "react";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog";

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
};

export function ImagePreviewDialog({ previewUrl, onClose }: ImagePreviewDialogProps) {
  return (
    <Dialog open={!!previewUrl} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-auto max-w-[95vw] border-none bg-transparent p-0 shadow-none sm:max-w-[95vw] flex items-center justify-center">
        <DialogTitle asChild>
          <VisuallyHidden>图片预览</VisuallyHidden>
        </DialogTitle>
        <DialogClose className="absolute right-4 top-4 z-20" aria-label="关闭" />
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt="preview"
            className="max-h-[85vh] max-w-[95vw] rounded border border-[#27272a] bg-black object-contain"
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
