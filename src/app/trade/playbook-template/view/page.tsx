"use client";

import React from "react";
import Link from "next/link";
import { Eye, Plus, RefreshCw } from "lucide-react";
import TradePageShell from "../../components/trade-page-shell";
import { FitImagePreview } from "@/components/common/FitImagePreview";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAlert } from "@/components/common/alert";
import { fetchPlaybookTypeOptions } from "../../dictionary";
import { listPlaybookTemplatesByPlaybook } from "../request";
import type { PlaybookTemplate } from "../types";

type DictionaryOption = { code: string; label: string; color?: string };

export default function PlaybookTemplateViewPage() {
  const [, errorAlert] = useAlert();
  const [playbookOptions, setPlaybookOptions] = React.useState<DictionaryOption[]>([]);
  const [playbookType, setPlaybookType] = React.useState("");
  const [items, setItems] = React.useState<PlaybookTemplate[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  const selectedPlaybookLabel = React.useMemo(
    () => playbookOptions.find((item) => item.code === playbookType)?.label || playbookType,
    [playbookOptions, playbookType],
  );

  React.useEffect(() => {
    let mounted = true;
    fetchPlaybookTypeOptions()
      .then((options) => mounted && setPlaybookOptions(options))
      .catch(() => mounted && setPlaybookOptions([]));
    return () => {
      mounted = false;
    };
  }, []);

  const fetchTemplates = React.useCallback(async (targetPlaybookType: string) => {
    if (!targetPlaybookType) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const res = await listPlaybookTemplatesByPlaybook(targetPlaybookType);
      setItems(res.items);
    } catch (error) {
      errorAlert(error instanceof Error ? error.message : "查询失败");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [errorAlert]);

  const handlePlaybookChange = (value: string) => {
    setPlaybookType(value);
    fetchTemplates(value);
  };

  return (
    <TradePageShell title="剧本模板查看" subtitle="交易时按剧本对照分析时、走势中和完整走势模板" showAddButton={false}>
      <div className="space-y-5">
        <div className="flex flex-wrap items-end gap-3 rounded-lg border border-[#27272a] bg-[#121212] p-4">
          <div className="w-full min-w-0 sm:w-80">
            <label className="mb-2 block text-xs text-[#a1a1aa]">剧本类型</label>
            <Select value={playbookType} onValueChange={handlePlaybookChange}>
              <SelectTrigger className="border-[#27272a] bg-[#0f0f10] text-[#e5e7eb]">
                <SelectValue placeholder="选择要对照的 playbook_type" />
              </SelectTrigger>
              <SelectContent className="border-[#27272a] bg-[#121212] text-[#e5e7eb]">
                {playbookOptions.map((item) => (
                  <SelectItem key={item.code} value={item.code}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" disabled={!playbookType || loading} onClick={() => fetchTemplates(playbookType)} className="border-[#27272a] bg-transparent text-[#e5e7eb] hover:bg-[#1f1f22]">
            <RefreshCw className="mr-2 h-4 w-4" />刷新
          </Button>
          <Button asChild className="ml-auto bg-[#00c2b2] text-black hover:bg-[#14b8a6]">
            <Link href="/trade/playbook-template/create"><Plus className="mr-2 h-4 w-4" />新增模板</Link>
          </Button>
        </div>

        {!playbookType ? (
          <div className="rounded-lg border border-[#27272a] bg-[#121212] p-10 text-center text-sm text-[#71717a]">选择一个剧本后查看模板</div>
        ) : loading ? (
          <div className="rounded-lg border border-[#27272a] bg-[#121212] p-10 text-center text-sm text-[#71717a]">加载中...</div>
        ) : items.length === 0 ? (
          <div className="rounded-lg border border-[#27272a] bg-[#121212] p-10 text-center text-sm text-[#71717a]">
            当前剧本暂无启用模板
          </div>
        ) : (
          <div className="space-y-5">
            <div className="text-sm text-[#a1a1aa]">{selectedPlaybookLabel}：{items.length}/5 个启用模板</div>
            {items.map((template) => (
              <section key={template.templateId} className="rounded-lg border border-[#27272a] bg-[#121212] p-5">
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-white">{template.title}</h2>
                    <div className="mt-1 text-xs text-[#a1a1aa]">最后更新：{formatDateTime(template.updatedAt)}</div>
                  </div>
                  <Button asChild variant="outline" className="border-[#27272a] bg-transparent text-[#e5e7eb] hover:bg-[#1f1f22]">
                    <Link href="/trade/playbook-template/manage">管理模板</Link>
                  </Button>
                </div>
                {template.notes ? (
                  <Textarea readOnly value={template.notes} className="mb-4 min-h-24 resize-none border-[#27272a] bg-[#0f0f10] text-[#e5e7eb]" />
                ) : null}
                <div className="grid gap-4 lg:grid-cols-3">
                  <TemplateImage title="分析时" src={template.analysisImageUrl} onPreview={setPreviewUrl} />
                  <TemplateImage title="走势中" src={template.inProgressImageUrl} onPreview={setPreviewUrl} />
                  <TemplateImage title="完整走势" src={template.completedTrendImageUrl} onPreview={setPreviewUrl} />
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!previewUrl} onOpenChange={(open) => !open && setPreviewUrl(null)}>
        <DialogContent className="flex h-[calc(100vh-24px)] max-h-none w-[calc(100vw-24px)] max-w-none items-center justify-center gap-0 overflow-hidden border-[#27272a] bg-[#121212] p-1 sm:max-w-none">
          {previewUrl ? <FitImagePreview src={previewUrl} alt="剧本模板图片预览" /> : null}
        </DialogContent>
      </Dialog>
    </TradePageShell>
  );
}

function TemplateImage({ title, src, onPreview }: { title: string; src: string; onPreview: (src: string) => void }) {
  return (
    <div className="min-w-0">
      <div className="mb-2 flex items-center justify-between text-sm font-medium text-[#e5e7eb]">
        <span>{title}</span>
        <Button type="button" size="sm" variant="outline" onClick={() => onPreview(src)} className="h-8 border-[#27272a] bg-transparent text-[#e5e7eb] hover:bg-[#1f1f22]">
          <Eye className="mr-1 h-4 w-4" />查看
        </Button>
      </div>
      <button type="button" onClick={() => onPreview(src)} className="block aspect-[16/10] w-full overflow-hidden rounded-md border border-[#27272a] bg-black">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" className="h-full w-full object-contain" />
      </button>
    </div>
  );
}

function formatDateTime(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("zh-CN", { hour12: false });
}
