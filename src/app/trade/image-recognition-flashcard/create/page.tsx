"use client";

import React from "react";
import Link from "next/link";
import { Save } from "lucide-react";
import TradePageShell from "../../components/trade-page-shell";
import { ImageUploader } from "@/components/common/ImageUploader";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAlert } from "@/components/common/alert";
import { fetchPlaybookTypeOptions } from "../../dictionary";
import type { ImageResource } from "../../config";
import {
  createImageRecognitionFlashcardCard,
  getImageRecognitionFlashcardUploadUrl,
} from "../request";
import type { ImageRecognitionFlashcardSampleResult } from "../types";
import { IMAGE_RECOGNITION_FLASHCARD_LABELS } from "../types";
import { useImageRecognitionFlashcardAdminAccess } from "../use-image-recognition-flashcard-admin-access";

type DictionaryOption = { code: string; label: string; color?: string };

export default function ImageRecognitionFlashcardCreatePage() {
  const { loaded, isAdmin } = useImageRecognitionFlashcardAdminAccess();

  if (!loaded) {
    return (
      <TradePageShell title="图片识别闪卡录入" subtitle="正在确认权限" showAddButton={false}>
        <div className="rounded-lg border border-[#27272a] bg-[#121212] p-6 text-sm text-[#a1a1aa]">加载中...</div>
      </TradePageShell>
    );
  }

  if (!isAdmin) {
    return (
      <TradePageShell title="无权限访问" subtitle="图片识别题库由管理员维护" showAddButton={false}>
        <div className="rounded-lg border border-[#27272a] bg-[#121212] p-6 text-sm text-[#a1a1aa]">
          当前账号不能录入图片识别闪卡。你仍然可以进入训练页浏览系统题库。
        </div>
      </TradePageShell>
    );
  }

  return <ImageRecognitionFlashcardCreateContent />;
}

function ImageRecognitionFlashcardCreateContent() {
  const [successAlert, errorAlert] = useAlert();
  const [images, setImages] = React.useState<ImageResource[]>([]);
  const [playbookType, setPlaybookType] = React.useState("");
  const [sampleResult, setSampleResult] = React.useState<ImageRecognitionFlashcardSampleResult | "">("");
  const [notes, setNotes] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [playbookOptions, setPlaybookOptions] = React.useState<DictionaryOption[]>([]);

  React.useEffect(() => {
    let mounted = true;
    fetchPlaybookTypeOptions()
      .then((items) => mounted && setPlaybookOptions(items))
      .catch(() => mounted && setPlaybookOptions([]));
    return () => {
      mounted = false;
    };
  }, []);

  const uploadUrlResolver = React.useCallback(
    (params: { fileName: string; contentType: string }) =>
      getImageRecognitionFlashcardUploadUrl({
        fileName: params.fileName,
        contentType: params.contentType,
        scope: "card-image",
      }),
    [],
  );

  const handleSubmit = async () => {
    const image = images.find((item) => item.url && !item.key.startsWith("__loading__"));
    if (!image) {
      errorAlert("请先上传图片");
      return;
    }
    if (!playbookType) {
      errorAlert("请选择剧本类型");
      return;
    }
    if (!sampleResult) {
      errorAlert("请选择样本结果");
      return;
    }

    setSaving(true);
    try {
      await createImageRecognitionFlashcardCard({
        imageUrl: image.url,
        imageKey: image.key,
        playbookType,
        sampleResult,
        notes,
      });
      successAlert("图片识别闪卡已保存");
      setImages([]);
      setNotes("");
    } catch (error) {
      errorAlert(error instanceof Error ? error.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <TradePageShell title="图片识别闪卡录入" subtitle="上传图片，选择剧本类型，沉淀识别记忆卡" showAddButton={false}>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-lg border border-[#27272a] bg-[#121212] p-5">
          <div className="mb-4 text-sm font-semibold text-white">图片</div>
          <ImageUploader
            value={images}
            onChange={setImages}
            max={1}
            uploadUrlResolver={uploadUrlResolver}
          />
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
            <label className="mb-2 block text-sm font-medium text-[#e5e7eb]">样本结果</label>
            <Select value={sampleResult} onValueChange={(value) => setSampleResult(value as ImageRecognitionFlashcardSampleResult)}>
              <SelectTrigger className="border-[#27272a] bg-[#0f0f10] text-[#e5e7eb]">
                <SelectValue placeholder="选择成功或失败" />
              </SelectTrigger>
              <SelectContent className="border-[#27272a] bg-[#121212] text-[#e5e7eb]">
                <SelectItem value="SUCCESS">{IMAGE_RECOGNITION_FLASHCARD_LABELS.SUCCESS}</SelectItem>
                <SelectItem value="FAIL">{IMAGE_RECOGNITION_FLASHCARD_LABELS.FAIL}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[#e5e7eb]">备注</label>
            <Textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="记录形态识别点、常见误判或复盘提醒"
              className="min-h-40 border-[#27272a] bg-[#0f0f10] text-[#e5e7eb]"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={saving} className="bg-[#00c2b2] text-black hover:bg-[#14b8a6]">
              <Save className="mr-2 h-4 w-4" />
              {saving ? "保存中..." : "保存"}
            </Button>
            <Button asChild variant="outline" className="border-[#27272a] bg-transparent text-[#e5e7eb] hover:bg-[#1f1f22]">
              <Link href="/trade/image-recognition-flashcard/manage">管理页</Link>
            </Button>
          </div>
        </aside>
      </div>
    </TradePageShell>
  );
}
