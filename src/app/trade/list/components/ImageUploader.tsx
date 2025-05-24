"use client";

import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { nanoid } from "nanoid";
import {
  ALLOWED_IMAGE_TYPES,
  ImageResource,
  getImageUploadUrl,
  uploadToS3,
} from "../request";
import { X, Upload, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * 图片多图上传控件（支持真实上传、云端预览，shadcn 风格，支持回填）
 * @param value 当前图片资源数组
 * @param onChange 变动回调
 * @param label 上方字段提示文本
 * @param max 最多几张（不限传 Infinity 或不设）
 * @param disabled 是否禁用
 */
export function ImageUploader({
  value,
  onChange,
  label,
  max,
  disabled,
}: {
  value: ImageResource[];
  onChange: (v: ImageResource[]) => void;
  label?: React.ReactNode;
  max?: number;
  disabled?: boolean;
}) {
  // 检查是否已达最大数量
  const reachMax = !!max && value.length >= max;

  /**
   * 处理图片实际上传
   */
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!acceptedFiles || acceptedFiles.length === 0) return;
      const n = max ? max - value.length : acceptedFiles.length;
      if (n <= 0) return;
      const filesToAdd = acceptedFiles.slice(0, n);

      for (const file of filesToAdd) {
        // 生成唯一 loadingKey
        const loadingKey = "__loading__" + nanoid();
        console.log('[ImageUploader] 开始上传文件:', file);

        // 先添加 loading 占位：此时以 props.value 为准
        onChange([...value, { key: loadingKey, url: "" }]);

        try {
          const dateStr = new Date().toISOString().slice(0, 10);
          const { uploadUrl, key } = await getImageUploadUrl({
            fileName: encodeURIComponent(file.name),
            fileType: file.type,
            date: dateStr,
          });
          console.log('[ImageUploader] 获得uploadUrl与key:', { uploadUrl, key });
          await uploadToS3(uploadUrl, file);
          console.log('[ImageUploader] S3上传成功:', file.name);

          let cdnUrl = "";
          if (key.startsWith("http")) {
            cdnUrl = key;
          } else {
            const cloudfrontDomain =
              process.env.NEXT_PUBLIC_IMAGE_CDN_PREFIX ||
              "dyslh3g7kcbva.cloudfront.net";
            cdnUrl = `https://${cloudfrontDomain}/${key}`;
          }
          console.log('[ImageUploader] 完整图片cdnUrl:', cdnUrl);

          // 注意此处！以“最新一轮的 value”进行替换，保证回填图片不丢
          // 先过滤掉 loadingKey，再追加新图片
          onChange(
            [
              ...value,
              { key: loadingKey, url: "" },
            ].filter((img) => img.key !== loadingKey).concat([{ key, url: cdnUrl }])
          );
        } catch (err) {
          let msg = "未知错误";
          if (err && typeof err === "object" && "message" in err) {
            msg = (err as { message: string }).message;
          }
          alert("上传失败: " + msg);
          console.error('[ImageUploader] 上传失败', err);

          // 上传失败也保证只移除 loading（保持其他 value 不变）
          onChange([...value, { key: loadingKey, url: "" }].filter(img => img.key !== loadingKey));
        }
      }
    },
    // value 每次变化，闭包会更新，保证 value 始终为父传“最新”内容
    [onChange, value, max]
  );

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    open,
  } = useDropzone({
    onDrop,
    accept: ALLOWED_IMAGE_TYPES.reduce((acc, t) => ({ ...acc, [t]: [] }), {}),
    multiple: true,
    maxFiles: max,
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
      {label && (
        <div className="font-semibold mb-1 flex items-center gap-2">
          {label}
          <span className="text-xs text-muted-foreground">
            {max ? `(最多${max}张)` : ""}
          </span>
        </div>
      )}
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
            className="relative w-28 h-28 rounded-lg border border-border bg-muted flex items-center justify-center shadow-sm group overflow-hidden"
          >
            {isLoadingImage(img) ? (
              <div className="flex flex-col gap-1 items-center justify-center w-full h-full animate-pulse select-none text-muted-foreground">
                <ImageIcon className="w-8 h-8 opacity-30" />
                <span className="text-xs tracking-wide opacity-60">上传中...</span>
              </div>
            ) : (
              <img
                className="object-contain w-full h-full rounded-lg transition-transform duration-200 group-hover:scale-105"
                src={img.url}
                alt=""
              />
            )}
            {!disabled && (
              <Button
                type="button"
                size="icon"
                variant="destructive"
                className="absolute top-2 right-2 shadow z-10 opacity-0 group-hover:opacity-100 hover:bg-destructive/90 focus:opacity-100 transition-opacity p-0"
                onClick={() => handleRemove(idx)}
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
            className="w-28 h-28 border border-dashed rounded-lg bg-background text-muted-foreground hover:bg-accent hover:border-primary hover:text-primary transition flex flex-col items-center justify-center gap-1 cursor-pointer select-none"
            tabIndex={-1}
            onClick={open}
            style={{ minWidth: 92 }}
            role="button"
            aria-label="添加图片"
          >
            <Upload className="mb-1" />
            <span className="text-xs">添加图片</span>
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
      {isDragActive && !disabled && (
        <div className="mt-2 text-primary text-xs">松开图片即可上传</div>
      )}
    </div>
  );
}
