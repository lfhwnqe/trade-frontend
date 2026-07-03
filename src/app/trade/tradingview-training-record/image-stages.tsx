"use client";

import React from "react";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight } from "lucide-react";
import { ImageUploader } from "@/components/common/ImageUploader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ImageResource } from "../config";
import type {
  TradingViewTrainingRecord,
  TradingViewTrainingRecordImageItem,
  TradingViewTrainingRecordImageScope,
} from "./types";

export const TVTR_IMAGE_STAGES = [
  {
    key: "analysisStartImages",
    label: "分析开始时图片",
    shortLabel: "分析开始",
    required: true,
    scope: "analysis-start",
    meaning: "保存开始分析时看到的原始市场上下文，用来判断前文是否充分、分析起点是否合理。",
  },
  {
    key: "postAnalysisTrendImages",
    label: "分析后走势图片",
    shortLabel: "分析后走势",
    required: false,
    scope: "post-analysis-trend",
    meaning: "保存完成初始分析后，走势在等待入场或确认过程中的发展，用来判断中间走势是否增强、削弱或推翻原判断。",
  },
  {
    key: "pendingOrderImages",
    label: "挂单图片",
    shortLabel: "挂单",
    required: true,
    scope: "pending-order",
    meaning: "保存决定挂单时的画面、价格位置、订单计划和触发依据，用来判断入场计划是否符合前文分析。",
  },
  {
    key: "exitImages",
    label: "离场时图片",
    shortLabel: "离场",
    required: true,
    scope: "exit",
    meaning: "保存离场当刻的走势、价格行为和处理依据，用来判断离场是否合理、是否按计划执行。",
  },
  {
    key: "postExitTrendImages",
    label: "离场后走势图片",
    shortLabel: "离场后走势",
    required: false,
    scope: "post-exit-trend",
    meaning: "保存离场后的后续走势，用来评估之前的离场判断、目标判断和风险处理是否正确。",
  },
] as const;

export type TvtrImageStageKey = (typeof TVTR_IMAGE_STAGES)[number]["key"];
export type TvtrStageImageDraft = { image: ImageResource; remark: string };
export type TvtrStageImagesState = Record<TvtrImageStageKey, TvtrStageImageDraft[]>;

export type TvtrCarouselSlide = {
  stageKey: TvtrImageStageKey;
  stageLabel: string;
  stageMeaning: string;
  imageUrl: string;
  imageKey?: string;
  remark?: string;
};

const EMPTY_STAGE_IMAGES: TvtrStageImagesState = {
  analysisStartImages: [],
  postAnalysisTrendImages: [],
  pendingOrderImages: [],
  exitImages: [],
  postExitTrendImages: [],
};

export function createEmptyStageImages(): TvtrStageImagesState {
  return {
    analysisStartImages: [],
    postAnalysisTrendImages: [],
    pendingOrderImages: [],
    exitImages: [],
    postExitTrendImages: [],
  };
}

export function stageKeyToUploadScope(key: TvtrImageStageKey): TradingViewTrainingRecordImageScope {
  return TVTR_IMAGE_STAGES.find((stage) => stage.key === key)?.scope || "training-image";
}

export function stageImagesToPayload(
  state: TvtrStageImagesState,
): Record<TvtrImageStageKey, TradingViewTrainingRecordImageItem[]> {
  return Object.fromEntries(
    TVTR_IMAGE_STAGES.map((stage) => [
      stage.key,
      state[stage.key]
        .filter((item) => item.image.url && !item.image.key.startsWith("__loading__"))
        .map((item) => ({
          imageUrl: item.image.url,
          imageKey: item.image.key,
          remark: item.remark.trim() || undefined,
        })),
    ]),
  ) as Record<TvtrImageStageKey, TradingViewTrainingRecordImageItem[]>;
}

export function hasRequiredStageImages(state: TvtrStageImagesState) {
  const payload = stageImagesToPayload(state);
  return TVTR_IMAGE_STAGES.every((stage) => !stage.required || payload[stage.key].length > 0);
}

export function getMissingRequiredStageLabel(state: TvtrStageImagesState) {
  const payload = stageImagesToPayload(state);
  return TVTR_IMAGE_STAGES.find((stage) => stage.required && payload[stage.key].length === 0)?.label;
}

export function getRecordThumbnail(record: TradingViewTrainingRecord) {
  return record.analysisStartImages?.[0]?.imageUrl || record.imageUrl || "";
}

export function hasStagedImages(record: TradingViewTrainingRecord) {
  return TVTR_IMAGE_STAGES.some((stage) => (record[stage.key] || []).length > 0);
}

export function recordToStageImages(record: TradingViewTrainingRecord): TvtrStageImagesState {
  const next = createEmptyStageImages();
  for (const stage of TVTR_IMAGE_STAGES) {
    next[stage.key] = (record[stage.key] || []).map((item) => ({
      image: { key: item.imageKey || item.imageUrl, url: item.imageUrl },
      remark: item.remark || "",
    }));
  }
  if (!hasStagedImages(record) && record.imageUrl) {
    next.analysisStartImages = [{
      image: { key: record.imageKey || record.imageUrl, url: record.imageUrl },
      remark: "",
    }];
  }
  return next;
}

export function flattenStageImages(state: TvtrStageImagesState): TvtrCarouselSlide[] {
  return TVTR_IMAGE_STAGES.flatMap((stage) =>
    state[stage.key]
      .filter((item) => item.image.url && !item.image.key.startsWith("__loading__"))
      .map((item) => ({
        stageKey: stage.key,
        stageLabel: stage.label,
        stageMeaning: stage.meaning,
        imageUrl: item.image.url,
        imageKey: item.image.key,
        remark: item.remark,
      })),
  );
}

export function recordToCarouselSlides(record: TradingViewTrainingRecord): TvtrCarouselSlide[] {
  const slides = flattenStageImages(recordToStageImages(record));
  if (slides.length) return slides;
  return [];
}

export function StageImageEditor({
  value,
  onChange,
  uploadUrlResolverFactory,
  compact = false,
}: {
  value: TvtrStageImagesState;
  onChange: (value: TvtrStageImagesState) => void;
  uploadUrlResolverFactory: (scope: TradingViewTrainingRecordImageScope) => (params: {
    fileName: string;
    contentType: string;
  }) => Promise<{ uploadUrl: string; fileUrl: string; key: string }>;
  compact?: boolean;
}) {
  const updateStageImages = React.useCallback((stageKey: TvtrImageStageKey, images: ImageResource[]) => {
    onChange({
      ...value,
      [stageKey]: images.map((image) => {
        const existing = value[stageKey].find((item) => item.image.key === image.key || item.image.url === image.url);
        return { image, remark: existing?.remark || "" };
      }),
    });
  }, [onChange, value]);

  const updateRemark = React.useCallback((stageKey: TvtrImageStageKey, index: number, remark: string) => {
    onChange({
      ...value,
      [stageKey]: value[stageKey].map((item, itemIndex) => (itemIndex === index ? { ...item, remark } : item)),
    });
  }, [onChange, value]);

  const moveImage = React.useCallback((stageKey: TvtrImageStageKey, index: number, direction: -1 | 1) => {
    const items = [...value[stageKey]];
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= items.length) return;
    [items[index], items[nextIndex]] = [items[nextIndex], items[index]];
    onChange({ ...value, [stageKey]: items });
  }, [onChange, value]);

  return (
    <div className={compact ? "space-y-4" : "space-y-5"}>
      {TVTR_IMAGE_STAGES.map((stage) => (
        <section key={stage.key} className="rounded-lg border border-[#27272a] bg-[#101012] p-4">
          <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="text-sm font-semibold text-white">
                {stage.label}
                {stage.required ? <span className="ml-1 text-[#fb7185]">*</span> : null}
              </div>
              <p className="mt-1 text-xs leading-5 text-[#a1a1aa]">{stage.meaning}</p>
            </div>
            <span className="rounded border border-[#27272a] px-2 py-1 text-xs text-[#a1a1aa]">
              {value[stage.key].filter((item) => item.image.url).length} 张
            </span>
          </div>
          <ImageUploader
            value={value[stage.key].map((item) => item.image)}
            onChange={(images) => updateStageImages(stage.key, images)}
            max={stage.required ? 5 : 10}
            uploadUrlResolver={uploadUrlResolverFactory(stage.scope)}
          />
          {value[stage.key].length ? (
            <div className="mt-3 space-y-3">
              {value[stage.key].map((item, index) => (
                <div key={`${item.image.key}-${index}`} className="rounded-md border border-[#27272a] bg-[#0f0f10] p-3">
                  <div className="mb-2 flex items-center justify-between gap-2 text-xs text-[#a1a1aa]">
                    <span>{stage.shortLabel} #{index + 1}</span>
                    <div className="flex gap-1">
                      <Button type="button" variant="outline" size="sm" onClick={() => moveImage(stage.key, index, -1)} disabled={index === 0} className="h-7 border-[#27272a] bg-transparent px-2 text-[#e5e7eb] hover:bg-[#1f1f22]">
                        <ArrowUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => moveImage(stage.key, index, 1)} disabled={index === value[stage.key].length - 1} className="h-7 border-[#27272a] bg-transparent px-2 text-[#e5e7eb] hover:bg-[#1f1f22]">
                        <ArrowDown className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    value={item.remark}
                    onChange={(event) => updateRemark(stage.key, index, event.target.value)}
                    placeholder="填写这张图片当时的判断依据、信号、挂单/离场理由或验证结论"
                    className="min-h-20 border-[#27272a] bg-[#09090b] text-[#e5e7eb]"
                  />
                </div>
              ))}
            </div>
          ) : null}
        </section>
      ))}
    </div>
  );
}

export function StageImageCarousel({
  slides,
  onPreview,
}: {
  slides: TvtrCarouselSlide[];
  onPreview?: (url: string) => void;
}) {
  const [activeIndex, setActiveIndex] = React.useState(0);
  React.useEffect(() => {
    setActiveIndex(0);
  }, [slides.length]);

  if (!slides.length) {
    return <div className="rounded-lg border border-[#27272a] bg-[#0f0f10] p-6 text-center text-sm text-[#71717a]">暂无过程图片</div>;
  }

  const active = slides[Math.min(activeIndex, slides.length - 1)];
  const go = (direction: -1 | 1) => {
    setActiveIndex((index) => (index + direction + slides.length) % slides.length);
  };

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-lg border border-[#27272a] bg-black">
        <div className="flex items-center justify-between border-b border-[#27272a] bg-[#18181b] px-3 py-2">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-white">{active.stageLabel}</div>
            <div className="text-xs text-[#a1a1aa]">{activeIndex + 1} / {slides.length}</div>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => go(-1)} className="border-[#27272a] bg-transparent text-[#e5e7eb] hover:bg-[#1f1f22]">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => go(1)} className="border-[#27272a] bg-transparent text-[#e5e7eb] hover:bg-[#1f1f22]">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <button type="button" onClick={() => onPreview?.(active.imageUrl)} className="block h-[min(58vh,560px)] w-full bg-black">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={active.imageUrl} alt={active.stageLabel} className="h-full w-full object-contain" />
        </button>
      </div>
      <div className="rounded-lg border border-[#27272a] bg-[#0f0f10] p-3">
        <div className="mb-1 text-xs font-semibold text-[#d4d4d8]">阶段意义</div>
        <p className="text-xs leading-5 text-[#a1a1aa]">{active.stageMeaning}</p>
        <div className="mt-3 text-xs font-semibold text-[#d4d4d8]">图片备注</div>
        <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[#e5e7eb]">{active.remark?.trim() || "无图片备注"}</p>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {slides.map((slide, index) => (
          <button
            key={`${slide.imageUrl}-${index}`}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={`h-16 w-24 shrink-0 overflow-hidden rounded-md border bg-black ${index === activeIndex ? "border-[#00c2b2]" : "border-[#27272a]"}`}
            title={slide.stageLabel}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={slide.imageUrl} alt={slide.stageLabel} className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}

export { EMPTY_STAGE_IMAGES };
