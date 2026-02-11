"use client";

import * as React from "react";
import imageCompression from "browser-image-compression";
import { useDropzone } from "react-dropzone";
import TradePageShell from "@/app/trade/components/trade-page-shell";
import { Button } from "@/components/ui/button";
import { useAlert } from "@/components/common/alert";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { ALLOWED_IMAGE_TYPES, uploadToS3 } from "@/app/trade/list/request";

type UploadItem = { key: string; url: string; createdAt: string };

export default function AdminImageBedPage() {
  const [success, errorAlert] = useAlert();
  const [uploading, setUploading] = React.useState(false);
  const [items, setItems] = React.useState<UploadItem[]>([]);

  const compressImage = React.useCallback(async (file: File) => {
    try {
      return await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: file.type,
      });
    } catch {
      return file;
    }
  }, []);

  const uploadFiles = React.useCallback(
    async (files: File[]) => {
      if (!files.length) return;
      setUploading(true);
      try {
        const date = new Date().toISOString().slice(0, 10);
        const results: UploadItem[] = [];

        for (const file of files) {
          const processed = await compressImage(file);
          const res = await fetchWithAuth("/api/proxy-post", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            proxyParams: {
              targetPath: "image/upload-url",
              actualMethod: "POST",
            },
            actualBody: {
              fileName: encodeURIComponent(file.name),
              fileType: file.type,
              date,
            },
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data?.message || "获取上传地址失败");

          const uploadUrl = String(data?.data?.uploadUrl || "");
          const key = String(data?.data?.key || "");
          if (!uploadUrl || !key) throw new Error("上传响应不完整");

          await uploadToS3(uploadUrl, processed);

          const cdn = process.env.NEXT_PUBLIC_IMAGE_CDN_PREFIX || "";
          results.push({
            key,
            url: cdn ? `https://${cdn}/${key}` : key,
            createdAt: new Date().toISOString(),
          });
        }

        setItems((prev) => [...results, ...prev]);
        success(`上传成功 ${results.length} 张`);
      } catch (err) {
        errorAlert(err instanceof Error ? err.message : "上传失败");
      } finally {
        setUploading(false);
      }
    },
    [compressImage, errorAlert, success],
  );

  const onDrop = React.useCallback(
    async (acceptedFiles: File[]) => {
      await uploadFiles(acceptedFiles);
    },
    [uploadFiles],
  );

  const { getRootProps, getInputProps, open, isDragActive } = useDropzone({
    onDrop,
    accept: ALLOWED_IMAGE_TYPES.reduce(
      (acc, t) => ({ ...acc, [t]: [] }),
      {} as Record<string, string[]>,
    ),
    multiple: true,
    noClick: true,
    disabled: uploading,
  });

  const onPaste = React.useCallback(
    async (event: React.ClipboardEvent<HTMLDivElement>) => {
      if (uploading) return;
      const files: File[] = [];
      const clipItems = event.clipboardData?.items || [];
      for (const item of Array.from(clipItems)) {
        if (!item.type.startsWith("image/")) continue;
        const file = item.getAsFile();
        if (file) files.push(file);
      }
      if (files.length) {
        event.preventDefault();
        await uploadFiles(files);
      }
    },
    [uploadFiles, uploading],
  );

  return (
    <TradePageShell title="管理员图床" showAddButton={false}>
      <div className="space-y-4">
        <div
          {...getRootProps()}
          onPaste={onPaste}
          className={`rounded-md border border-dashed p-4 ${
            isDragActive
              ? "border-[#00c2b2] bg-[#0f1f1d]"
              : "border-[#27272a] bg-[#111111]"
          }`}
        >
          <input {...getInputProps()} />
          <div className="text-sm text-[#9ca3af]">
            支持拖拽/粘贴(Ctrl+V)上传，自动压缩图片。
          </div>
          <Button
            type="button"
            variant="outline"
            className="mt-3 border-[#27272a] bg-transparent text-[#e5e7eb] hover:bg-[#1e1e1e]"
            onClick={open}
            disabled={uploading}
          >
            {uploading ? "上传中..." : "选择图片"}
          </Button>
        </div>

        <div className="rounded-md border border-[#27272a] bg-[#111111] p-4">
          <div className="mb-3 text-sm font-medium text-[#e5e7eb]">最近上传</div>
          <div className="space-y-3">
            {items.length === 0 ? (
              <div className="text-sm text-[#9ca3af]">暂无</div>
            ) : (
              items.map((item) => (
                <div
                  key={item.key}
                  className="rounded border border-[#27272a] p-3 text-xs"
                >
                  <div className="text-[#9ca3af] break-all">{item.key}</div>
                  <div className="mt-1 text-[#e5e7eb] break-all">{item.url}</div>
                  <div className="mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-[#27272a] bg-transparent text-[#e5e7eb] hover:bg-[#1e1e1e]"
                      onClick={async () => {
                        await navigator.clipboard.writeText(item.url);
                        success("链接已复制");
                      }}
                    >
                      复制链接
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </TradePageShell>
  );
}
