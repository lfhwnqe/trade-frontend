"use client";

import React from "react";
import {
  FLASHCARD_BEHAVIOR_EXPLANATIONS,
  FLASHCARD_BEHAVIOR_SELECT_OPTION_GROUPS,
  FLASHCARD_INVALIDATION_EXPLANATIONS,
  FLASHCARD_INVALIDATION_SELECT_OPTION_GROUPS,
  FLASHCARD_LABELS,
  type FlashcardBehaviorType,
  type FlashcardInvalidationType,
} from "../types";

type Props = {
  behaviorType?: FlashcardBehaviorType | "";
  invalidationType?: FlashcardInvalidationType | "";
};

function GuideCard({
  title,
  selectedLabel,
  summary,
  whenToUse,
  items,
}: {
  title: string;
  selectedLabel: string;
  summary: string;
  whenToUse: string;
  items: string[];
}) {
  return (
    <div className="rounded-lg border border-[#27272a] bg-[#171717] p-3">
      <div className="text-xs font-medium text-[#9ca3af]">{title}</div>
      <div className="mt-2 text-sm font-semibold text-white">{selectedLabel}</div>
      <div className="mt-1 text-sm text-[#d1d5db]">{summary}</div>
      <div className="mt-1 text-xs text-[#9ca3af]">怎么选：{whenToUse}</div>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item}
            className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-[#cbd5e1]"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

export function FlashcardFieldGuide({
  behaviorType,
  invalidationType,
}: Props) {
  const selectedBehavior = behaviorType || undefined;
  const selectedInvalidation = invalidationType || undefined;

  const behaviorGuide = selectedBehavior
    ? {
        label: FLASHCARD_LABELS[selectedBehavior],
        ...FLASHCARD_BEHAVIOR_EXPLANATIONS[selectedBehavior],
      }
    : {
        label: "行为类型是“为什么这题能做/不能做”的依据",
        summary: "先想这题属于支撑阻力区拒绝、假突破、强势突破、突破回踩延续，还是区域久盘后根本不该做。",
        whenToUse: "优先用 system v5 的区域语言定义价格行为，不要把结果好坏当成行为类型。",
      };

  const invalidationGuide = selectedInvalidation
    ? {
        label: FLASHCARD_LABELS[selectedInvalidation],
        ...FLASHCARD_INVALIDATION_EXPLANATIONS[selectedInvalidation],
      }
    : {
        label: "失效类型是“这笔逻辑什么时候算错了”",
        summary: "先想这笔逻辑会死在哪类失败方式，比如重新回区、回踩翻转失败、HH/LL 失守、久盘无扩张。",
        whenToUse: "如果这题只练方向，不强调执行细节，再选“仅方向识别”。",
      };

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <GuideCard
        title="行为类型说明"
        selectedLabel={behaviorGuide.label}
        summary={behaviorGuide.summary}
        whenToUse={behaviorGuide.whenToUse}
        items={FLASHCARD_BEHAVIOR_SELECT_OPTION_GROUPS.flatMap((group) =>
          group.items.map((item) => FLASHCARD_LABELS[item]),
        )}
      />
      <GuideCard
        title="失效类型说明"
        selectedLabel={invalidationGuide.label}
        summary={invalidationGuide.summary}
        whenToUse={invalidationGuide.whenToUse}
        items={FLASHCARD_INVALIDATION_SELECT_OPTION_GROUPS.flatMap((group) =>
          group.items.map((item) => FLASHCARD_LABELS[item]),
        )}
      />
    </div>
  );
}
