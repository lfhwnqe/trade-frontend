"use client";

import React from "react";
import Link from "next/link";
import { Save } from "lucide-react";
import TradePageShell from "../../components/trade-page-shell";
import { ImageUploader } from "@/components/common/ImageUploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAlert } from "@/components/common/alert";
import { fetchPlaybookTypeOptions } from "../../dictionary";
import type { ImageResource } from "../../config";
import { createPlaybookTemplate, getPlaybookTemplateUploadUrl } from "../request";
import type { PlaybookTemplateImageScope } from "../types";

type DictionaryOption = { code: string; label: string; color?: string };

export default function PlaybookTemplateCreatePage() {
  const [successAlert, errorAlert] = useAlert();
  const [playbookOptions, setPlaybookOptions] = React.useState<DictionaryOption[]>([]);
  const [playbookType, setPlaybookType] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [analysisImages, setAnalysisImages] = React.useState<ImageResource[]>([]);
  const [inProgressImages, setInProgressImages] = React.useState<ImageResource[]>([]);
  const [completedTrendImages, setCompletedTrendImages] = React.useState<ImageResource[]>([]);
  const [notes, setNotes] = React.useState("");
  const [sortOrder, setSortOrder] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    fetchPlaybookTypeOptions()
      .then((items) => mounted && setPlaybookOptions(items))
      .catch(() => mounted && setPlaybookOptions([]));
    return () => {
      mounted = false;
    };
  }, []);

  const buildUploadResolver = React.useCallback(
    (scope: PlaybookTemplateImageScope) =>
      (params: { fileName: string; contentType: string }) =>
        getPlaybookTemplateUploadUrl({
          fileName: params.fileName,
          contentType: params.contentType,
          scope,
        }),
    [],
  );

  const handleSubmit = async () => {
    const analysisImage = getReadyImage(analysisImages);
    const inProgressImage = getReadyImage(inProgressImages);
    const completedTrendImage = getReadyImage(completedTrendImages);
    if (!playbookType) {
      errorAlert("请选择剧本类型");
      return;
    }
    if (!title.trim()) {
      errorAlert("请填写模板名称");
      return;
    }
    if (!analysisImage || !inProgressImage || !completedTrendImage) {
      errorAlert("请上传分析时图片、走势中图片和完整走势图片");
      return;
    }

    setSaving(true);
    try {
      await createPlaybookTemplate({
        playbookType,
        title: title.trim(),
        analysisImageUrl: analysisImage.url,
        analysisImageKey: analysisImage.key,
        inProgressImageUrl: inProgressImage.url,
        inProgressImageKey: inProgressImage.key,
        completedTrendImageUrl: completedTrendImage.url,
        completedTrendImageKey: completedTrendImage.key,
        notes,
        sortOrder: sortOrder.trim() ? Number(sortOrder) : undefined,
      });
      successAlert("剧本模板已保存");
      setTitle("");
      setAnalysisImages([]);
      setInProgressImages([]);
      setCompletedTrendImages([]);
      setNotes("");
      setSortOrder("");
    } catch (error) {
      errorAlert(error instanceof Error ? error.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <TradePageShell title="剧本模板录入" subtitle="按剧本沉淀交易时可对照的三阶段模板" showAddButton={false}>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="grid gap-4 lg:grid-cols-3">
          <UploadPanel title="分析时图片" description="对照当前是否具备剧本初始条件">
            <ImageUploader value={analysisImages} onChange={setAnalysisImages} max={1} uploadUrlResolver={buildUploadResolver("analysis")} />
          </UploadPanel>
          <UploadPanel title="走势中图片" description="对照走势推进过程中是否仍符合剧本">
            <ImageUploader value={inProgressImages} onChange={setInProgressImages} max={1} uploadUrlResolver={buildUploadResolver("in-progress")} />
          </UploadPanel>
          <UploadPanel title="完整走势图片" description="对照该剧本完整演化后的结果形态">
            <ImageUploader value={completedTrendImages} onChange={setCompletedTrendImages} max={1} uploadUrlResolver={buildUploadResolver("completed-trend")} />
          </UploadPanel>
        </section>

        <aside className="space-y-4 rounded-lg border border-[#27272a] bg-[#121212] p-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#e5e7eb]">剧本类型</label>
            <Select value={playbookType} onValueChange={setPlaybookType}>
              <SelectTrigger className="border-[#27272a] bg-[#0f0f10] text-[#e5e7eb]">
                <SelectValue placeholder="选择 playbook_type" />
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

          <div>
            <label className="mb-2 block text-sm font-medium text-[#e5e7eb]">模板名称</label>
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={60}
              placeholder="例如：标准突破回踩"
              className="border-[#27272a] bg-[#0f0f10] text-[#e5e7eb]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[#e5e7eb]">排序值</label>
            <Input
              type="number"
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
              placeholder="可选，数字越小越靠前"
              className="border-[#27272a] bg-[#0f0f10] text-[#e5e7eb]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[#e5e7eb]">备注</label>
            <Textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="记录模板关键特征、确认点、常见陷阱或不适用条件"
              className="min-h-36 border-[#27272a] bg-[#0f0f10] text-[#e5e7eb]"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={saving} className="bg-[#00c2b2] text-black hover:bg-[#14b8a6]">
              <Save className="mr-2 h-4 w-4" />
              {saving ? "保存中..." : "保存"}
            </Button>
            <Button asChild variant="outline" className="border-[#27272a] bg-transparent text-[#e5e7eb] hover:bg-[#1f1f22]">
              <Link href="/trade/playbook-template/manage">管理页</Link>
            </Button>
            <Button asChild variant="outline" className="border-[#27272a] bg-transparent text-[#e5e7eb] hover:bg-[#1f1f22]">
              <Link href="/trade/playbook-template/view">查看页</Link>
            </Button>
          </div>
        </aside>
      </div>
    </TradePageShell>
  );
}

function UploadPanel({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="min-w-0 rounded-lg border border-[#27272a] bg-[#121212] p-5">
      <div className="mb-1 text-sm font-semibold text-white">{title}</div>
      <div className="mb-4 text-xs text-[#a1a1aa]">{description}</div>
      {children}
    </section>
  );
}

function getReadyImage(images: ImageResource[]) {
  return images.find((item) => item.url && !item.key.startsWith("__loading__"));
}
