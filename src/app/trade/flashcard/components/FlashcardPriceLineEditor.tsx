"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

export const FLASHCARD_PRICE_LINE_TYPES = ["entry", "stopLoss", "takeProfit"] as const;
export type FlashcardPriceLineType = (typeof FLASHCARD_PRICE_LINE_TYPES)[number];

export type FlashcardPriceLineValue = Partial<Record<FlashcardPriceLineType, number>>;

const LINE_META: Record<
  FlashcardPriceLineType,
  { label: string; shortLabel: string; color: string; buttonClassName: string }
> = {
  entry: {
    label: "入场线",
    shortLabel: "入场",
    color: "#22d3ee",
    buttonClassName: "border-cyan-400/40 bg-cyan-400/10 text-cyan-300 hover:bg-cyan-400/20",
  },
  stopLoss: {
    label: "止损线",
    shortLabel: "止损",
    color: "#ef4444",
    buttonClassName: "border-red-400/40 bg-red-400/10 text-red-300 hover:bg-red-400/20",
  },
  takeProfit: {
    label: "止盈线",
    shortLabel: "止盈",
    color: "#22c55e",
    buttonClassName: "border-green-400/40 bg-green-400/10 text-green-300 hover:bg-green-400/20",
  },
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatPercent(value?: number) {
  if (typeof value !== "number") return "未设置";
  return `${(value * 100).toFixed(1)}%`;
}

function getTradeSide(lines: FlashcardPriceLineValue) {
  const entry = lines.entry;
  const stopLoss = lines.stopLoss;
  const takeProfit = lines.takeProfit;

  if (
    typeof entry !== "number" ||
    typeof stopLoss !== "number" ||
    typeof takeProfit !== "number"
  ) {
    return null;
  }

  // y 轴向下增大：
  // LONG: takeProfit 在 entry 上方，stopLoss 在 entry 下方
  // SHORT: takeProfit 在 entry 下方，stopLoss 在 entry 上方
  if (takeProfit < entry && stopLoss > entry) return "LONG";
  if (takeProfit > entry && stopLoss < entry) return "SHORT";

  return null;
}

function getRr(lines: FlashcardPriceLineValue) {
  const entry = lines.entry;
  const stopLoss = lines.stopLoss;
  const takeProfit = lines.takeProfit;
  const side = getTradeSide(lines);

  if (
    typeof entry !== "number" ||
    typeof stopLoss !== "number" ||
    typeof takeProfit !== "number" ||
    !side
  ) {
    return null;
  }

  let risk = 0;
  let reward = 0;

  if (side === "LONG") {
    risk = stopLoss - entry;
    reward = entry - takeProfit;
  } else {
    risk = entry - stopLoss;
    reward = takeProfit - entry;
  }

  if (risk <= 0 || reward <= 0) {
    return null;
  }

  return reward / risk;
}

export function FlashcardPriceLineEditor({
  imageUrl,
  value,
  onChange,
  title,
  revealProgress,
  onRevealProgressChange,
  className,
  imageViewportClassName,
  readOnly = false,
  readOnlyHint,
}: {
  imageUrl: string;
  value: FlashcardPriceLineValue;
  onChange: (nextValue: FlashcardPriceLineValue) => void;
  title?: string;
  revealProgress?: number;
  onRevealProgressChange?: (next: number) => void;
  className?: string;
  imageViewportClassName?: string;
  readOnly?: boolean;
  readOnlyHint?: string;
}) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const maskRef = React.useRef<HTMLDivElement | null>(null);
  const draggingTypeRef = React.useRef<FlashcardPriceLineType | null>(null);
  const [activeType, setActiveType] = React.useState<FlashcardPriceLineType>("entry");
  const [draggingType, setDraggingType] = React.useState<FlashcardPriceLineType | null>(null);
  const [isHovered, setIsHovered] = React.useState(false);

  const updateLineByClientY = React.useCallback(
    (type: FlashcardPriceLineType, clientY: number) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect || rect.height <= 0) return;
      const yRatio = clamp((clientY - rect.top) / rect.height, 0, 1);
      onChange({ ...value, [type]: yRatio });
    },
    [onChange, value],
  );

  React.useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (readOnly || !draggingTypeRef.current) return;
      updateLineByClientY(draggingTypeRef.current, event.clientY);
    };

    const stopDragging = () => {
      draggingTypeRef.current = null;
      setDraggingType(null);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopDragging);
    window.addEventListener("pointercancel", stopDragging);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopDragging);
      window.removeEventListener("pointercancel", stopDragging);
    };
  }, [readOnly, updateLineByClientY]);

  const rr = React.useMemo(() => getRr(value), [value]);
  const tradeSide = React.useMemo(() => getTradeSide(value), [value]);
  const revealEnabled =
    typeof revealProgress === "number" && typeof onRevealProgressChange === "function";

  React.useEffect(() => {
    const maskNode = maskRef.current;
    if (!maskNode || !revealEnabled) return;
    maskNode.style.transform = `scaleX(${Math.max(1 - revealProgress, 0)})`;
  }, [revealEnabled, revealProgress]);

  const handleImageClick = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (readOnly || typeof value[activeType] === "number") {
        return;
      }
      updateLineByClientY(activeType, event.clientY);
    },
    [activeType, readOnly, updateLineByClientY, value],
  );

  const handleWheel = React.useCallback(
    (event: React.WheelEvent<HTMLDivElement>) => {
      if (!revealEnabled || !isHovered) return;
      event.preventDefault();
      const direction = Math.sign(event.deltaY);
      if (!direction) return;
      const nextProgress = clamp(
        revealProgress + direction * 0.00033 * Math.max(Math.abs(event.deltaY), 12),
        0,
        1,
      );
      onRevealProgressChange(nextProgress);
    },
    [isHovered, onRevealProgressChange, revealEnabled, revealProgress],
  );

  const handleLinePointerDown = React.useCallback(
    (type: FlashcardPriceLineType, event: React.PointerEvent<HTMLButtonElement>) => {
      if (readOnly) return;
      event.preventDefault();
      event.stopPropagation();
      draggingTypeRef.current = type;
      setDraggingType(type);
      setActiveType(type);
      updateLineByClientY(type, event.clientY);
    },
    [readOnly, updateLineByClientY],
  );

  const deleteLine = React.useCallback(
    (type: FlashcardPriceLineType) => {
      if (readOnly) return;
      const nextValue = { ...value };
      delete nextValue[type];
      onChange(nextValue);
    },
    [onChange, readOnly, value],
  );

  const clearAll = React.useCallback(() => {
    if (readOnly) return;
    onChange({});
  }, [onChange, readOnly]);

  return (
    <div className={`space-y-3 rounded-xl border border-[#27272a] bg-[#18181b] p-3 ${className || ""}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-[#e5e7eb]">{title || "价格线原型"}</div>
          <div className="text-xs text-[#9ca3af]">{readOnlyHint || (readOnly ? "只读回放：直接复用训练页同一套画板展示三条线、蒙层与 x 轴位置。" : "未设置的线可点击图片直接落线；已设置的线只能拖动横线调整位置。以入场线为基准自动判断多空并计算 RR。")}</div>
        </div>
        <div className="text-right">
          {tradeSide ? <div className="text-xs text-[#9ca3af]">{tradeSide === "LONG" ? "多单结构" : "空单结构"}</div> : null}
          {rr !== null ? <div className="text-sm font-semibold text-[#e5e7eb]">RR {rr.toFixed(2)}</div> : null}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_260px]">
        <div>
          <div
            ref={containerRef}
            className={`group relative overflow-hidden rounded-lg border border-[#27272a] bg-black ${imageViewportClassName || ""}`}
            onPointerDown={handleImageClick}
            onWheel={handleWheel}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="price-line-preview" className="block h-full w-full select-none object-fill" draggable={false} />

            {revealEnabled ? (
              <>
                <div
                  className="pointer-events-none absolute inset-y-0 w-0 border-l-2 border-dashed border-[#fbbf24]"
                  style={{ left: `${revealProgress * 100}%`, zIndex: 2 }}
                >
                  <div className="absolute -top-1 left-1 -translate-y-full rounded bg-[#fbbf24] px-2 py-1 text-[11px] font-medium text-black">
                    当前推演位置 / x轴
                  </div>
                </div>
                <div
                  ref={maskRef}
                  className="pointer-events-none absolute inset-y-0 right-0 origin-right rounded-r bg-[#050816]"
                  style={{ width: "100%", transform: `scaleX(${Math.max(1 - revealProgress, 0)})`, willChange: "transform", zIndex: 1 }}
                >
                </div>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/70 via-black/20 to-transparent px-3 py-3 text-xs text-white/85">
                  <span>{isHovered ? "滚轮向下逐步揭开，向上重新遮住" : "悬停后可滚轮推演 K 线"}</span>
                  <span>{Math.round(revealProgress * 100)}%</span>
                </div>
              </>
            ) : null}

            <div className="pointer-events-none absolute inset-0">
              {FLASHCARD_PRICE_LINE_TYPES.map((type) => {
                const lineY = value[type];
                if (typeof lineY !== "number") return null;
                const meta = LINE_META[type];
                const top = `${lineY * 100}%`;
                const isDragging = draggingType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    className="pointer-events-auto absolute left-0 right-0 -translate-y-1/2 cursor-row-resize touch-none"
                    style={{ top }}
                    onPointerDown={(event) => handleLinePointerDown(type, event)}
                  >
                    <div
                      className="relative h-0.5 w-full shadow-[0_0_10px_rgba(255,255,255,0.15)]"
                      style={{ backgroundColor: meta.color }}
                    >
                      <div
                        className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border px-2 py-0.5 text-[11px] font-medium"
                        style={{
                          color: meta.color,
                          borderColor: `${meta.color}88`,
                          backgroundColor: "rgba(9,9,11,0.88)",
                        }}
                      >
                        {meta.shortLabel}
                      </div>
                      <div
                        className="absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 bg-[#09090b]"
                        style={{ borderColor: meta.color, boxShadow: isDragging ? `0 0 0 4px ${meta.color}33` : "none" }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-3 rounded-lg border border-[#27272a] bg-[#121212] p-3">
          <div className="space-y-2">
            <div className="text-xs font-medium text-[#9ca3af]">当前设置对象</div>
            <div className="grid grid-cols-1 gap-2">
              {FLASHCARD_PRICE_LINE_TYPES.map((type) => {
                const meta = LINE_META[type];
                const isActive = activeType === type;
                return (
                  <Button
                    key={type}
                    type="button"
                    variant="outline"
                    className={`justify-start border text-left ${
                      isActive ? meta.buttonClassName : "border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb] hover:bg-[#242424]"
                    }`}
                    onClick={() => setActiveType(type)}
                    disabled={readOnly}
                  >
                    {meta.label}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-medium text-[#9ca3af]">线状态</div>
            <div className="space-y-2">
              {FLASHCARD_PRICE_LINE_TYPES.map((type) => {
                const meta = LINE_META[type];
                const exists = typeof value[type] === "number";
                return (
                  <div key={type} className="rounded-md border border-[#27272a] bg-[#18181b] p-2">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-sm font-medium text-[#e5e7eb]">{meta.shortLabel}</div>
                        <div className="text-xs text-[#9ca3af]">
                          {exists ? `已设置 · 位于图片高度 ${formatPercent(value[type])}（从上往下）` : "未设置"}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-8 px-2 text-xs text-[#9ca3af] hover:bg-[#242424] hover:text-white"
                        onClick={() => deleteLine(type)}
                        disabled={!exists || readOnly}
                      >
                        删除
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-md border border-[#27272a] bg-[#18181b] p-3">
            <div className="text-xs font-medium text-[#9ca3af]">风险回报</div>
            <div className="mt-1 text-lg font-semibold text-[#e5e7eb]">
              {rr !== null ? rr.toFixed(2) : "--"}
            </div>
            <div className="mt-1 text-xs text-[#9ca3af]">
              以入场线为起点：若止盈线在上、止损线在下则判为多单；若止盈线在下、止损线在上则判为空单；再按对应方向计算 reward / risk。
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb] hover:bg-[#242424]"
            onClick={clearAll}
            disabled={readOnly}
          >
            清空全部
          </Button>
        </div>
      </div>
    </div>
  );
}
