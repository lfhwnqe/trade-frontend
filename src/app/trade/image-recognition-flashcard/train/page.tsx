"use client";

import React from "react";
import { ChevronLeft, ChevronRight, Eye, EyeOff, Play, RotateCcw } from "lucide-react";
import TradePageShell from "../../components/trade-page-shell";
import { Button } from "@/components/ui/button";
import { FitImagePreview } from "@/components/common/FitImagePreview";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAlert } from "@/components/common/alert";
import { fetchPlaybookTypeOptions } from "../../dictionary";
import { randomImageRecognitionFlashcardTraining } from "../request";
import type { ImageRecognitionFlashcardCard } from "../types";

const ALL_VALUE = "__ALL__";

type DictionaryOption = { code: string; label: string; color?: string };

export default function ImageRecognitionFlashcardTrainPage() {
  const [, errorAlert] = useAlert();
  const [playbookOptions, setPlaybookOptions] = React.useState<DictionaryOption[]>([]);
  const [playbookType, setPlaybookType] = React.useState(ALL_VALUE);
  const [count, setCount] = React.useState(20);
  const [cards, setCards] = React.useState<ImageRecognitionFlashcardCard[]>([]);
  const [index, setIndex] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [notesVisible, setNotesVisible] = React.useState(false);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    fetchPlaybookTypeOptions()
      .then((items) => mounted && setPlaybookOptions(items))
      .catch(() => mounted && setPlaybookOptions([]));
    return () => {
      mounted = false;
    };
  }, []);

  const current = cards[index];

  const startTraining = async () => {
    setLoading(true);
    setNotesVisible(false);
    try {
      const res = await randomImageRecognitionFlashcardTraining({
        count,
        playbookType: playbookType === ALL_VALUE ? undefined : playbookType,
      });
      setCards(res.cards);
      setIndex(0);
    } catch (error) {
      errorAlert(error instanceof Error ? error.message : "开始训练失败");
    } finally {
      setLoading(false);
    }
  };

  const goTo = (nextIndex: number) => {
    setIndex(Math.min(Math.max(nextIndex, 0), Math.max(cards.length - 1, 0)));
    setNotesVisible(false);
  };

  return (
    <TradePageShell title="图片识别训练" subtitle="大量浏览图片样本，强化剧本识别记忆点" showAddButton={false}>
      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-4 rounded-lg border border-[#27272a] bg-[#121212] p-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#e5e7eb]">剧本筛选</label>
            <Select value={playbookType} onValueChange={setPlaybookType}>
              <SelectTrigger className="border-[#27272a] bg-[#0f0f10] text-[#e5e7eb]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-[#27272a] bg-[#121212] text-[#e5e7eb]">
                <SelectItem value={ALL_VALUE}>全部剧本</SelectItem>
                {playbookOptions.map((item) => (
                  <SelectItem key={item.code} value={item.code}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[#e5e7eb]">数量</label>
            <Input
              type="number"
              min={1}
              max={100}
              value={count}
              onChange={(event) => setCount(Math.min(100, Math.max(1, Number(event.target.value) || 1)))}
              className="border-[#27272a] bg-[#0f0f10] text-[#e5e7eb]"
            />
          </div>

          <Button onClick={startTraining} disabled={loading} className="w-full bg-[#00c2b2] text-black hover:bg-[#14b8a6]">
            <Play className="mr-2 h-4 w-4" />
            {loading ? "抽取中..." : "开始训练"}
          </Button>

          {cards.length ? (
            <div className="rounded-md border border-[#27272a] bg-[#0f0f10] p-3 text-sm text-[#a1a1aa]">
              当前进度：{index + 1} / {cards.length}
            </div>
          ) : null}
        </aside>

        <section className="min-h-[620px] rounded-lg border border-[#27272a] bg-[#121212] p-5">
          {!current ? (
            <div className="flex h-[560px] items-center justify-center rounded-lg border border-dashed border-[#27272a] text-sm text-[#71717a]">
              选择剧本和数量后开始训练
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm text-[#a1a1aa]">剧本</div>
                  <div className="mt-1 text-lg font-semibold text-white">
                    {current.playbookItem?.label || current.playbookType}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setNotesVisible((value) => !value)}
                  className="border-[#27272a] bg-transparent text-[#e5e7eb] hover:bg-[#1f1f22]"
                >
                  {notesVisible ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                  {notesVisible ? "隐藏备注" : "查看备注"}
                </Button>
              </div>

              <button
                type="button"
                onClick={() => setPreviewUrl(current.imageUrl)}
                className="flex h-[520px] w-full items-center justify-center overflow-hidden rounded-lg bg-black outline-none ring-offset-2 ring-offset-[#121212] transition focus-visible:ring-2 focus-visible:ring-[#00c2b2]"
                aria-label="放大查看当前图片"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={current.imageUrl} alt="图片识别闪卡" className="h-full w-full object-contain" />
              </button>

              {notesVisible ? (
                <div className="rounded-lg border border-[#27272a] bg-[#0f0f10] p-4 text-sm leading-6 text-[#e5e7eb] whitespace-pre-wrap">
                  {current.notes || "暂无备注"}
                </div>
              ) : null}

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => goTo(index - 1)}
                    disabled={index <= 0}
                    className="border-[#27272a] bg-transparent text-[#e5e7eb] hover:bg-[#1f1f22]"
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    上一张
                  </Button>
                  <Button
                    type="button"
                    onClick={() => goTo(index + 1)}
                    disabled={index >= cards.length - 1}
                    className="bg-[#00c2b2] text-black hover:bg-[#14b8a6]"
                  >
                    下一张
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={startTraining}
                  className="border-[#27272a] bg-transparent text-[#e5e7eb] hover:bg-[#1f1f22]"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  重新抽取
                </Button>
              </div>
            </div>
          )}
        </section>
      </div>

      <Dialog open={!!previewUrl} onOpenChange={(open) => !open && setPreviewUrl(null)}>
        <DialogContent className="flex h-[calc(100vh-24px)] max-h-none w-[calc(100vw-24px)] max-w-none items-center justify-center gap-0 overflow-hidden border-[#27272a] bg-[#121212] p-1 sm:max-w-none">
          {previewUrl ? (
            <FitImagePreview src={previewUrl} alt="图片预览" />
          ) : null}
        </DialogContent>
      </Dialog>
    </TradePageShell>
  );
}
