"use client";

import React, { useRef } from "react";
import {
  ALLOWED_IMAGE_TYPES,
  getImageUploadUrl,
  uploadToS3,
  ImageResource,
} from "../request";
import { X, Upload, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * 图片多图上传控件
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 由 label/input 控制文件选择逻辑，无需 handleSelectFile

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    // 校验格式和大小
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      alert("不支持的图片类型");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("图片不能超过5MB");
      return;
    }

    // 获取日期字符串
    const dateStr = new Date().toISOString().slice(0, 10);
    const loadingKey = "__loading__" + Math.random();
    const newList = [...value];

    // 占位显示loading
    newList.push({
      key: loadingKey,
      url: "",
    });
    onChange(newList);

    try {
      // 获取上传URL
      const { uploadUrl, key } = await getImageUploadUrl({
        fileName: encodeURIComponent(file.name),
        fileType: file.type,
        date: dateStr,
      });
      console.log("开始上传到S3:", {
        uploadUrl,
        fileType: file.type,
        fileSize: file.size,
      });
      // 直传S3
      await uploadToS3(uploadUrl, file);
      console.log("上传S3成功");

      // 拼接云端的图片直链url
      let cdnUrl = "";
      if (key.startsWith("http")) {
        cdnUrl = key;
      } else {
        // 使用 CloudFront 域名
        // 使用环境变量中配置的 CloudFront 域名，或者使用实际部署的域名作为备用
        const cloudfrontDomain =
          process.env.NEXT_PUBLIC_IMAGE_CDN_PREFIX ||
          "dyslh3g7kcbva.cloudfront.net"; // 使用实际部署的 CloudFront 域名

        cdnUrl = `https://${cloudfrontDomain}/${key}`;
        console.log("生成图片URL:", { cloudfrontDomain, key, cdnUrl });
      }

      // 填写最终结果
      onChange(
        newList
          .filter((img) => img.key !== loadingKey)
          .concat([{ key, url: cdnUrl }])
      );
    } catch (err: unknown) {
      let msg = "未知错误";
      if (err && typeof err === "object" && "message" in err) {
        msg = (err as { message: string }).message;
      }
      alert("上传失败: " + msg);
      // 清除 loading
      onChange(newList.filter((img) => img.key !== loadingKey));
    } finally {
      e.target.value = "";
    }
  };

  const handleRemove = (idx: number) => {
    if (disabled) return;
    onChange(value.filter((_, i) => i !== idx));
  };

  const reachMax = !!max && value.length >= max;

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
      <div className="flex gap-3 flex-wrap items-center">
        {value.map((img, idx) => (
          <div
            key={img.key}
            className="relative w-28 h-28 rounded-lg border border-border bg-muted flex items-center justify-center shadow-sm group overflow-hidden"
          >
            {img.url ? (
              <img
                className="object-contain w-full h-full rounded-lg transition-transform duration-200 group-hover:scale-105"
                src={img.url}
                alt=""
              />
            ) : (
              <div className="flex flex-col gap-1 items-center justify-center w-full h-full animate-pulse select-none text-muted-foreground">
                <ImageIcon className="w-8 h-8 opacity-30" />
                <span className="text-xs tracking-wide opacity-60">
                  上传中...
                </span>
              </div>
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
        {!reachMax && (
          <label
            className="w-28 h-28 border border-dashed rounded-lg bg-background text-muted-foreground hover:bg-accent hover:border-primary hover:text-primary transition flex flex-col items-center justify-center gap-1 cursor-pointer"
            style={{ minWidth: 92 }}
            tabIndex={-1}
          >
            <Upload className="mb-1" />
            <span className="text-xs">添加图片</span>
            <input
              type="file"
              accept={ALLOWED_IMAGE_TYPES.join(",")}
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
              disabled={disabled}
              tabIndex={-1}
            />
          </label>
        )}
      </div>
    </div>
  );
}
