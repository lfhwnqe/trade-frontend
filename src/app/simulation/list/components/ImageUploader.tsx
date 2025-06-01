"use client";

import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { nanoid } from "nanoid";
import {
  ALLOWED_IMAGE_TYPES,
  getImageUploadUrl,
  uploadToS3,
} from "../request";
import { ImageResource } from "../../config";
import { X, Upload, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,  
  DialogOverlay,
  DialogClose,
} from "@/components/ui/dialog";

/**
 * 图片多图上传控件（支持真实上传、云端预览，shadcn 风格，支持回填和大图预览）
 * @param value 当前图片资源数组
 * @param onChange 变动回调
 * @param max 最多几张（不限传 Infinity 或不设）
 * @param disabled 是否禁用
 */
/** 隐藏视觉但对屏幕阅读器可见的文本，用于可访问性 */
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

export function ImageUploader({
  value,
  onChange,
  max,
  disabled,
}: {
  value: ImageResource[];
  onChange: (v: ImageResource[]) => void;
  max?: number;
  disabled?: boolean;
}) {
  // 检查是否已达最大数量
  const reachMax = !!max && value.length >= max;

  // 预览状态：当前要放大的图片 url
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  /**
   * 处理图片实际上传
   */
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!acceptedFiles || acceptedFiles.length === 0) return;
      const n = max ? max - value.length : acceptedFiles.length;
      if (n <= 0) return;
      const filesToAdd = acceptedFiles.slice(0, n);
      
      // 为所有文件创建唯一的 loading 占位符
      const loadingPlaceholders = filesToAdd.map(() => ({
        key: "__loading__" + nanoid(),
        url: ""
      }));
      
      // 一次性添加所有 loading 占位符
      const newValueWithLoading = [...value, ...loadingPlaceholders];
      onChange(newValueWithLoading);
      
      console.log(`[ImageUploader] 开始批量上传 ${filesToAdd.length} 个文件`);
      
      // 并行上传所有文件
      const uploadResults = await Promise.allSettled(
        filesToAdd.map(async (file, index) => {
          const loadingKey = loadingPlaceholders[index].key;
          
          try {
            console.log(`[ImageUploader] 上传文件 ${index + 1}/${filesToAdd.length}: ${file.name}`);
            const dateStr = new Date().toISOString().slice(0, 10);
            const { uploadUrl, key } = await getImageUploadUrl({
              fileName: encodeURIComponent(file.name),
              fileType: file.type,
              date: dateStr,
            });
            
            await uploadToS3(uploadUrl, file);
            
            let cdnUrl = "";
            if (key.startsWith("http")) {
              cdnUrl = key;
            } else {
              const cloudfrontDomain =
                process.env.NEXT_PUBLIC_IMAGE_CDN_PREFIX ||
                "dyslh3g7kcbva.cloudfront.net";
              cdnUrl = `https://${cloudfrontDomain}/${key}`;
            }
            
            console.log(`[ImageUploader] 文件 ${file.name} 上传成功: ${cdnUrl}`);
            return { success: true, loadingKey, result: { key, url: cdnUrl } };
          } catch (err) {
            let msg = "未知错误";
            if (err && typeof err === "object" && "message" in err) {
              msg = (err as { message: string }).message;
            }
            console.error(`[ImageUploader] 文件 ${file.name} 上传失败: ${msg}`, err);
            return { success: false, loadingKey, error: msg };
          }
        })
      );
      
      // 处理上传结果
      let failedCount = 0;
      
      // 更新最终结果
      const finalValue = newValueWithLoading.filter(img => {
        // 保留所有非 loading 图片
        if (!img.key.startsWith("__loading__")) return true;
        
        // 过滤所有 loading 占位
        return false;
      });
      
      // 添加成功上传的图片
      const successfulUploads = uploadResults
        .filter(result => result.status === "fulfilled" && (result.value as any).success)
        .map(result => (result.value as any).result);
      
      // 计算失败的数量
      failedCount = uploadResults.filter(
        result => result.status === "rejected" || ((result.status === "fulfilled") && !(result.value as any).success)
      ).length;
      
      onChange([...finalValue, ...successfulUploads]);
      
      // 显示失败信息
      if (failedCount > 0) {
        alert(`${failedCount} 张图片上传失败，请重试`);
      }
    },
    [onChange, value, max]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: ALLOWED_IMAGE_TYPES.reduce((acc, t) => ({ ...acc, [t]: [] }), {}),
    multiple: true,
    maxFiles: max ? max - value.length : undefined,
    noClick: true,
    disabled: disabled || reachMax,
  });

  // 删除图片
  const handleRemove = (idx: number) => {
    if (disabled) return;
    onChange(value.filter((_, i) => i !== idx));
  };

  const isLoadingImage = (img: ImageResource) =>
    img.key.startsWith("__loading__");

  return (
    <div className="mb-3">
      <div
        {...getRootProps({
          className:
            "flex gap-3 flex-wrap items-center outline-none transition bg-transparent",
        })}
        tabIndex={-1}
      >
        {value.map((img, idx) => (
          <div
            key={img.key}
            className="relative w-28 h-28 rounded-lg border border-border bg-muted flex items-center justify-center shadow-sm group overflow-hidden cursor-pointer"
            onClick={() => {
              if (!isLoadingImage(img) && img.url) {
                setPreviewUrl(img.url);
              }
            }}
            tabIndex={0}
            aria-label="放大预览图片"
          >
            {isLoadingImage(img) ? (
              <div className="flex flex-col gap-1 items-center justify-center w-full h-full animate-pulse select-none text-muted-foreground">
                <ImageIcon className="w-8 h-8 opacity-30" />
                <span className="text-xs tracking-wide opacity-60">
                  上传中...
                </span>
              </div>
            ) : (
              <img
                className="object-contain w-full h-full rounded-lg transition-transform duration-200 group-hover:scale-105"
                src={img.url}
                alt=""
                draggable={false}
              />
            )}
            {!disabled && (
              <Button
                type="button"
                size="icon"
                variant="destructive"
                className="absolute top-2 right-2 shadow z-10 opacity-0 group-hover:opacity-100 hover:bg-destructive/90 focus:opacity-100 transition-opacity p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(idx);
                }}
                tabIndex={-1}
                aria-label="删除图片"
              >
                <X size={16} />
              </Button>
            )}
          </div>
        ))}
        {/* 添加按钮 */}
        {!reachMax && (
          <div
            className="w-14 h-14 border border-dashed rounded-lg bg-background text-muted-foreground hover:bg-accent hover:border-primary hover:text-primary transition flex flex-col items-center justify-center gap-1 cursor-pointer select-none"
            tabIndex={-1}
            onClick={open}
            style={{ minWidth: 60 }}
            role="button"
            aria-label="添加图片"
          >
            <Upload size={18} className="mb-1" />
            <span className="text-xs">上传</span>
            <input
              {...getInputProps({
                className: "hidden",
                disabled: disabled || reachMax,
                tabIndex: -1,
              })}
            />
          </div>
        )}
      </div>
      {/* 图片放大预览 Dialog */}
      <Dialog
        open={!!previewUrl}
        onOpenChange={(open) => !open && setPreviewUrl(null)}
      >
        <DialogOverlay />
        <DialogContent className="max-w-full p-0 bg-transparent shadow-none border-none flex items-center justify-center">
          <DialogTitle asChild>
            <VisuallyHidden id="img-preview-dialog-title">
              图片预览
            </VisuallyHidden>
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
      {isDragActive && !disabled && (
        <div className="mt-2 text-primary text-xs">松开即可上传图片</div>
      )}
      {!isDragActive && !disabled && !reachMax && (
        <div className="mt-2 text-muted-foreground text-xs">点击上传按钮或拖拽图片到此处，可批量上传{max ? `（最多${max}张）` : ""}</div>
      )}
    </div>
  );
}
