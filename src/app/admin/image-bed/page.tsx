"use client";

import * as React from "react";
import TradePageShell from "@/app/trade/components/trade-page-shell";
import { Button } from "@/components/ui/button";
import { useAlert } from "@/components/common/alert";
import { fetchWithAuth } from "@/utils/fetchWithAuth";

type UploadItem = {
  key: string;
  url: string;
  createdAt: string;
};

export default function AdminImageBedPage() {
  const [success, errorAlert] = useAlert();
  const [loading, setLoading] = React.useState(false);
  const [items, setItems] = React.useState<UploadItem[]>([]);

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const date = new Date().toISOString().slice(0, 10);
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

      const putResp = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!putResp.ok) {
        throw new Error(`上传失败: ${putResp.status}`);
      }

      const cdn = process.env.NEXT_PUBLIC_IMAGE_CDN_PREFIX || "";
      const url = cdn ? `https://${cdn}/${key}` : key;

      setItems((prev) => [{ key, url, createdAt: new Date().toISOString() }, ...prev]);
      success("上传成功");
    } catch (err) {
      errorAlert(err instanceof Error ? err.message : "上传失败");
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };

  return (
    <TradePageShell title="管理员图床" showAddButton={false}>
      <div className="space-y-4">
        <div className="rounded-md border border-[#27272a] bg-[#111111] p-4 space-y-3">
          <div className="text-sm text-[#9ca3af]">
            仅 Admin / SuperAdmin 可用。用于上传和复制图片链接。
          </div>
          <label className="inline-flex items-center gap-2">
            <input
              type="file"
              accept="image/*"
              onChange={onPick}
              disabled={loading}
              className="text-sm text-[#e5e7eb]"
            />
          </label>
          {loading ? <div className="text-sm text-[#9ca3af]">上传中...</div> : null}
        </div>

        <div className="rounded-md border border-[#27272a] bg-[#111111] p-4">
          <div className="mb-3 text-sm font-medium text-[#e5e7eb]">最近上传</div>
          <div className="space-y-3">
            {items.length === 0 ? (
              <div className="text-sm text-[#9ca3af]">暂无</div>
            ) : (
              items.map((item) => (
                <div key={item.key} className="rounded border border-[#27272a] p-3 text-xs">
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
