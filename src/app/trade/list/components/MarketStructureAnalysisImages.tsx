"use client";

import React, { useCallback, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { nanoid } from "nanoid";
import imageCompression from "browser-image-compression";
import { ALLOWED_IMAGE_TYPES, getImageUploadUrl, uploadToS3 } from "../request";
import type { MarketStructureAnalysisImage } from "../../config";
import { useAlert } from "@/components/common/alert";
import { Input as BaseInput } from "@/components/ui/input";
import { Textarea as BaseTextarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Trash2, CirclePlus, Image as ImageIcon } from "lucide-react";

type UploadResult =
  | {
      success: true;
      loadingKey: string;
      result: MarketStructureAnalysisImage;
    }
  | { success: false; loadingKey: string; error: string };

function isLoadingItem(item: MarketStructureAnalysisImage) {
  return item.image.key.startsWith("__loading__");
}

/** 隐藏视觉但对屏幕阅读器可见的文本 */
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

export function MarketStructureAnalysisImages({
  value,
  onChange,
  readOnly,
  max = 10,
  label = "市场结构分析图：",
  uploadTitle = "上传图片",
}: {
  value: MarketStructureAnalysisImage[];
  onChange: (value: MarketStructureAnalysisImage[]) => void;
  readOnly?: boolean;
  max?: number;
  label?: string;
  uploadTitle?: string;
}) {
  const [, errorAlert] = useAlert();
  const reachMax = !!max && value.length >= max;
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const altText = label.replace(/[:：]\s*$/, "");

  const compressImage = useCallback(async (file: File): Promise<File> => {
    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: file.type,
      };
      return await imageCompression(file, options);
    } catch {
      return file;
    }
  }, []);

  const handleUpload = useCallback(
    async (files: File[]) => {
      if (readOnly || reachMax) return;
      if (!files || files.length === 0) return;
      const n = max ? max - value.length : files.length;
      if (n <= 0) return;
      const filesToAdd = files.slice(0, n);

      const loadingItems: MarketStructureAnalysisImage[] = filesToAdd.map(
        () => ({
          image: { key: `__loading__${nanoid()}`, url: "" },
          title: "",
          analysis: "",
        }),
      );
      const newValueWithLoading = [...value, ...loadingItems];
      onChange(newValueWithLoading);

      const uploadResults = await Promise.allSettled<UploadResult>(
        filesToAdd.map(async (file, index) => {
          const loadingKey = loadingItems[index].image.key;
          try {
            const processedFile = await compressImage(file);
            const dateStr = new Date().toISOString().slice(0, 10);
            const { uploadUrl, key } = await getImageUploadUrl({
              fileName: encodeURIComponent(file.name),
              fileType: file.type,
              date: dateStr,
            });

            await uploadToS3(uploadUrl, processedFile);

            let cdnUrl = "";
            if (key.startsWith("http")) {
              cdnUrl = key;
            } else {
              const cloudfrontDomain =
                process.env.NEXT_PUBLIC_IMAGE_CDN_PREFIX ||
                "dyslh3g7kcbva.cloudfront.net";
              cdnUrl = `https://${cloudfrontDomain}/${key}`;
            }

            return {
              success: true,
              loadingKey,
              result: {
                image: { key, url: cdnUrl },
                title: "",
                analysis: "",
              },
            };
          } catch (err) {
            let msg = "未知错误";
            if (err && typeof err === "object" && "message" in err) {
              msg = (err as { message: string }).message;
            }
            return { success: false, loadingKey, error: msg };
          }
        }),
      );

      const baseValue = newValueWithLoading.filter(
        (item) => !isLoadingItem(item),
      );

      const successfulUploads = uploadResults
        .filter(
          (result) => result.status === "fulfilled" && result.value.success,
        )
        .map((result) => {
          return (
            result as PromiseFulfilledResult<{
              success: true;
              loadingKey: string;
              result: MarketStructureAnalysisImage;
            }>
          ).value.result;
        });

      const failedCount = uploadResults.filter(
        (result) =>
          result.status === "rejected" ||
          (result.status === "fulfilled" && !result.value.success),
      ).length;

      onChange([...baseValue, ...successfulUploads]);

      if (failedCount > 0) {
        errorAlert(`${failedCount} 张图片上传失败，请重试`);
      }
    },
    [compressImage, errorAlert, max, onChange, readOnly, reachMax, value],
  );

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      await handleUpload(acceptedFiles);
    },
    [handleUpload],
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: ALLOWED_IMAGE_TYPES.reduce((acc, t) => ({ ...acc, [t]: [] }), {}),
    multiple: true,
    maxFiles: max ? max - value.length : undefined,
    noClick: true,
    disabled: readOnly || reachMax,
  });

  const handlePaste = useCallback(
    (event: React.ClipboardEvent<HTMLDivElement>) => {
      if (readOnly || reachMax) return;
      const items = event.clipboardData?.items;
      if (!items || items.length === 0) return;

      const files: File[] = [];
      Array.from(items).forEach((item) => {
        if (!item.type.startsWith("image/")) return;
        const file = item.getAsFile();
        if (file) files.push(file);
      });

      if (files.length > 0) {
        handleUpload(files);
      }
    },
    [handleUpload, readOnly, reachMax],
  );

  const handleRemove = useCallback(
    (key: string) => {
      if (readOnly) return;
      onChange(value.filter((item) => item.image.key !== key));
    },
    [onChange, readOnly, value],
  );

  const handleUpdate = useCallback(
    (index: number, patch: Partial<MarketStructureAnalysisImage>) => {
      if (readOnly) return;
      onChange(
        value.map((item, idx) =>
          idx === index ? { ...item, ...patch } : item,
        ),
      );
    },
    [onChange, readOnly, value],
  );

  return (
    <div
      className="space-y-6"
      onPaste={handlePaste}
      ref={containerRef}
      tabIndex={0}
      onClick={(event) => {
        const target = event.target as HTMLElement;
        if (target.closest("input, textarea, button")) return;
        containerRef.current?.focus();
      }}
      aria-label="市场结构分析图上传区域"
    >
      <div className="flex justify-between items-center mb-4">
        <label className="block pb-1 text-sm font-medium text-muted-foreground">
          {label}
        </label>
        <button
          type="button"
          className={`text-[10px] text-accent hover:text-white transition-colors uppercase tracking-wider font-semibold flex items-center gap-1 ${
            readOnly || reachMax ? "opacity-50 cursor-not-allowed" : ""
          }`}
          onClick={() => containerRef.current?.focus()}
          disabled={readOnly}
        >
          <CirclePlus className="h-4 w-4" />
          选择图片
        </button>
      </div>

      {value.map((item, index) => {
        const hasImage = !!item.image.url;
        const loading = isLoadingItem(item);
        return (
          <div
            key={item.image.key || `${index}`}
            className="bg-charcoal rounded-xl border border-glass-border p-4 hover:border-accent/30 transition-all duration-300 shadow-sm"
          >
            <div className="flex flex-col sm:flex-row gap-5">
              <div className="w-full sm:w-48 flex-shrink-0">
                <div
                  className="aspect-video w-full rounded-lg bg-black border border-glass-border flex items-center justify-center relative group overflow-hidden cursor-pointer"
                  onClick={() => {
                    if (!loading && item.image.url) {
                      setPreviewUrl(item.image.url);
                    }
                  }}
                >
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-text-muted group-hover:text-accent transition-colors z-10">
                    <ImageIcon className="h-7 w-7 mb-1" />
                    <span className="text-[9px] uppercase tracking-wide opacity-60">
                      {loading ? "上传中" : "预览"}
                    </span>
                  </div>
                  {hasImage && (
                    <img
                      alt={altText}
                      className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
                      src={item.image.url}
                    />
                  )}
                  {!readOnly && !loading && (
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                      <button
                        type="button"
                        className="bg-black/70 hover:bg-red-500/80 text-white p-1 rounded transition-colors backdrop-blur-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemove(item.image.key);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-grow space-y-3">
                <div className="w-full">
                  <BaseInput
                    className="w-full font-sans input-recessed rounded bg-black/40 border border-glass-border px-3 py-2 text-xs text-white placeholder-text-muted/50 focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                    placeholder="图片标题（例如：4H 结构转换）"
                    type="text"
                    value={item.title}
                    onChange={(e) =>
                      handleUpdate(index, { title: e.target.value })
                    }
                    readOnly={readOnly}
                  />
                </div>
                <div className="w-full h-full">
                  <BaseTextarea
                    className="w-full h-[100px] font-mono input-recessed rounded bg-black/40 border border-glass-border px-3 py-2 text-xs text-text-muted placeholder-text-muted/50 focus:border-accent focus:ring-1 focus:ring-accent transition-all resize-none leading-relaxed"
                    placeholder="// 在此填写技术解读..."
                    value={item.analysis}
                    onChange={(e) =>
                      handleUpdate(index, { analysis: e.target.value })
                    }
                    readOnly={readOnly}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })}

      <div className="group relative" {...getRootProps()}>
        <input {...getInputProps()} />
        <div
          className={`border border-dashed border-glass-border bg-charcoal/50 hover:bg-charcoal rounded-xl p-6 transition-all duration-300 flex flex-col items-center justify-center group-hover:border-accent group-hover:shadow-[0_0_15px_rgba(99,102,241,0.05)] ${
            isDragActive ? "border-accent/70" : ""
          } ${readOnly || reachMax ? "opacity-60 cursor-not-allowed" : ""}`}
        >
          <div className="h-10 w-10 rounded-full bg-black border border-glass-border flex items-center justify-center mb-2 group-hover:scale-110 transition-transform group-hover:border-accent/50">
            <ImageIcon className="h-6 w-6 text-text-muted group-hover:text-accent transition-colors" />
          </div>
          <h4 className="text-xm font-medium text-white group-hover:text-accent transition-colors">
            {uploadTitle}
          </h4>
          <p className="text-[14px] text-text-muted mt-1">
            可拖拽图片到此处，或点击中间按钮选择（最多 {max} 张）
          </p>
          <button
            type="button"
            className={`mt-3 text-[12px] transition-colors uppercase tracking-wider font-semibold flex items-center gap-1 ${
              readOnly || reachMax ? "opacity-50 cursor-not-allowed" : ""
            }`}
            onClick={() => !readOnly && !reachMax && open()}
            disabled={readOnly || reachMax}
          >
            <CirclePlus className="h-6 w-6" />
            选择图片
          </button>
        </div>
      </div>
      <p className="text-[10px] text-text-muted italic flex items-center gap-1">
        支持 PNG、JPG，支持粘贴（Ctrl+V）。
      </p>
      <Dialog
        open={!!previewUrl}
        onOpenChange={(open) => !open && setPreviewUrl(null)}
      >
        <DialogOverlay />
        <DialogContent className="max-w-full p-0 bg-transparent shadow-none border-none flex items-center justify-center">
          <DialogTitle asChild>
            <VisuallyHidden>图片预览</VisuallyHidden>
          </DialogTitle>
          <DialogClose
            className="absolute top-4 right-4 z-20"
            aria-label="关闭"
          />
          {previewUrl && (
            <img
              src={previewUrl}
              alt="预览图片"
              className="max-h-[80vh] max-w-[90vw] rounded-md shadow-2xl border bg-white"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
