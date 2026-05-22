"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Box, ChevronLeft, ChevronRight, ChevronsRight, Minus, MousePointer2, RotateCcw, Trash2, TrendingDown, TrendingUp } from "lucide-react";
import {
  CandlestickSeries,
  ColorType,
  LineStyle,
  createChart,
  type CandlestickData,
  type IChartApi,
  type IPriceLine,
  type ISeriesApi,
  type Logical,
  type UTCTimestamp,
} from "lightweight-charts";
import TradePageShell from "../../../components/trade-page-shell";
import { Button } from "@/components/ui/button";
import { useAlert } from "@/components/common/alert";
import { fetchPlaybookTypeOptions } from "../../../dictionary";
import { getPracticalFlashcardCard } from "../../request";
import {
  PRACTICAL_FLASHCARD_LABELS,
  type PracticalFlashcardCard,
  type PracticalFlashcardCandle,
} from "../../types";

type DrawingTool = "SELECT" | "RECT" | "HLINE" | "LONG_POSITION" | "SHORT_POSITION";

type DrawingShape =
  | { id: string; type: "RECT"; startIndex: number; endIndex: number; startPrice: number; endPrice: number }
  | { id: string; type: "HLINE"; price: number; startIndex: number; endIndex: number }
  | { id: string; type: "POSITION"; direction: "LONG" | "SHORT"; index: number; entryPrice: number; stopPrice: number; takeProfitPrice: number };

type DrawingPoint = { index: number; price: number };
type RectHandle = "START_START" | "START_END" | "END_START" | "END_END";
type PositionPriceField = "entryPrice" | "stopPrice" | "takeProfitPrice";
type PositionLineHandle = "ENTRY" | "STOP" | "TAKE_PROFIT";

export default function PracticalFlashcardReplayPage() {
  const params = useParams<{ cardId: string }>();
  const [, errorAlert] = useAlert();
  const [card, setCard] = React.useState<PracticalFlashcardCard | null>(null);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [playbookOptions, setPlaybookOptions] = React.useState<Array<{ code: string; label: string }>>([]);

  React.useEffect(() => {
    const cardId = params?.cardId;
    if (!cardId || typeof cardId !== "string") return;
    getPracticalFlashcardCard(cardId)
      .then((res) => {
        setCard(res);
        setCurrentIndex(clampIndex(res.initialVisibleCandleIndex, res.candles.length));
      })
      .catch((error) => {
        errorAlert(error instanceof Error ? error.message : "获取实操闪卡失败");
      });
  }, [errorAlert, params]);

  React.useEffect(() => {
    let mounted = true;
    fetchPlaybookTypeOptions().then((items) => mounted && setPlaybookOptions(items)).catch(() => mounted && setPlaybookOptions([]));
    return () => {
      mounted = false;
    };
  }, []);

  const playbookLabel = React.useMemo(() => {
    if (!card?.playbookType) return "--";
    return playbookOptions.find((item) => item.code === card.playbookType)?.label || card.playbookType;
  }, [card?.playbookType, playbookOptions]);

  const resultIndex = card?.resultCandleIndex ?? null;
  const maxIndex = Math.max((card?.candles.length || 1) - 1, 0);
  const progressLabel = card ? `${currentIndex + 1} / ${card.candles.length}` : "--";

  if (!card) {
    return (
      <TradePageShell title="实操闪卡回放" subtitle="正在读取冻结行情快照" showAddButton={false}>
        <div className="rounded-xl border border-[#27272a] bg-[#121212] p-6 text-sm text-[#9ca3af]">正在加载...</div>
      </TradePageShell>
    );
  }

  return (
    <TradePageShell title="实操闪卡回放" subtitle={`${card.symbolPairInfo} · ${card.primaryInterval} 冻结行情`} showAddButton={false}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="outline" className="border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb] hover:bg-[#242424]">
            <Link href="/trade/practical-flashcard/manage" prefetch={false}>返回管理页</Link>
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" disabled={currentIndex <= 0} onClick={() => setCurrentIndex((value) => Math.max(value - 1, 0))} className="gap-2 border border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb] hover:bg-[#27272a]">
              <ChevronLeft className="size-4" />
              上一帧
            </Button>
            <Button variant="secondary" disabled={currentIndex >= maxIndex} onClick={() => setCurrentIndex((value) => Math.min(value + 1, maxIndex))} className="gap-2 border border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb] hover:bg-[#27272a]">
              下一帧
              <ChevronRight className="size-4" />
            </Button>
            <Button variant="secondary" disabled={currentIndex >= maxIndex} onClick={() => setCurrentIndex((value) => Math.min(value + 5, maxIndex))} className="gap-2 border border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb] hover:bg-[#27272a]">
              <ChevronsRight className="size-4" />
              +5
            </Button>
            <Button variant="secondary" disabled={resultIndex === null} onClick={() => resultIndex !== null && setCurrentIndex(clampIndex(resultIndex, card.candles.length))} className="gap-2 border border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb] hover:bg-[#27272a]">
              快进到结果
            </Button>
            <Button variant="secondary" onClick={() => setCurrentIndex(clampIndex(card.initialVisibleCandleIndex, card.candles.length))} className="gap-2 border border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb] hover:bg-[#27272a]">
              <RotateCcw className="size-4" />
              重置
            </Button>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <section className="overflow-hidden rounded-xl border border-[#27272a] bg-[#101010]">
            <div className="border-b border-[#27272a] px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <div className="font-medium text-[#e5e7eb]">{card.symbolPairInfo}</div>
                <div className="text-[#a1a1aa]">当前帧 {progressLabel}</div>
              </div>
              <input
                type="range"
                min={0}
                max={maxIndex}
                value={currentIndex}
                onChange={(event) => setCurrentIndex(Number(event.target.value))}
                className="mt-3 h-2 w-full cursor-pointer accent-[#00c2b2]"
              />
            </div>
            <CandlestickReplayChart
              card={card}
              candles={card.candles}
              currentIndex={currentIndex}
            />
          </section>

          <aside className="space-y-4">
            <section className="rounded-xl border border-[#27272a] bg-[#121212] p-4">
              <div className="text-sm font-semibold text-white">卡片信息</div>
              <div className="mt-4 space-y-3 text-sm">
                <InfoRow label="剧本" value={playbookLabel} />
                <InfoRow label="行情源" value={PRACTICAL_FLASHCARD_LABELS[card.venue] || card.venue} />
                <InfoRow label="状态" value={PRACTICAL_FLASHCARD_LABELS[card.status] || card.status} />
                <InfoRow label="入场时间" value={card.entryTimeInfo} />
                <InfoRow label="结果时间" value={card.exitTimeInfo} />
                <InfoRow label="冻结范围" value={`${card.snapshotStartTime} -> ${card.snapshotEndTime}`} />
              </div>
            </section>

            <section className="rounded-xl border border-[#27272a] bg-[#121212] p-4">
              <div className="text-sm font-semibold text-white">标准答案</div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <Metric label="方向" value={card.expectedDirection ? PRACTICAL_FLASHCARD_LABELS[card.expectedDirection] : "--"} />
                <Metric label="入场价" value={formatPrice(card.standardEntryPrice)} />
                <Metric label="止损价" value={formatPrice(card.standardStopLossPrice)} />
                <Metric label="止盈价" value={formatPrice(card.standardTakeProfitPrice)} />
              </div>
            </section>

            <section className="rounded-xl border border-[#27272a] bg-[#121212] p-4">
              <div className="text-sm font-semibold text-white">快照状态</div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <Metric label="冻结 K 线" value={`${card.candles.length} 根`} />
                <Metric label="当前可见" value={`${currentIndex + 1} 根`} />
                <Metric label="未来隐藏" value={`${Math.max(card.candles.length - currentIndex - 1, 0)} 根`} />
                <Metric label="回放起点" value={`第 ${clampIndex(card.initialVisibleCandleIndex, card.candles.length) + 1} 根`} />
              </div>
            </section>
          </aside>
        </div>
      </div>
    </TradePageShell>
  );
}

function CandlestickReplayChart({
  card,
  candles,
  currentIndex,
}: {
  card: PracticalFlashcardCard;
  candles: PracticalFlashcardCandle[];
  currentIndex: number;
}) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const chartRef = React.useRef<IChartApi | null>(null);
  const seriesRef = React.useRef<ISeriesApi<"Candlestick"> | null>(null);
  const priceLinesRef = React.useRef<IPriceLine[]>([]);
  const initialRangeAppliedRef = React.useRef(false);
  const [activeTool, setActiveTool] = React.useState<DrawingTool>("SELECT");
  const [drawings, setDrawings] = React.useState<DrawingShape[]>([]);
  const [selectedDrawingId, setSelectedDrawingId] = React.useState<string | null>(null);
  const [pendingRectStart, setPendingRectStart] = React.useState<DrawingPoint | null>(null);
  const [viewportVersion, setViewportVersion] = React.useState(0);
  const drawingsHydratedRef = React.useRef(false);
  const safeCurrentIndex = clampIndex(currentIndex, candles.length);
  const browserTimeZone = React.useMemo(getBrowserTimeZone, []);
  const visibleCandles = React.useMemo(
    () => candles.slice(0, safeCurrentIndex + 1).map((candle) => toCandlestickData(candle, browserTimeZone)),
    [browserTimeZone, candles, safeCurrentIndex],
  );

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container || chartRef.current) return;

    const chart = createChart(container, {
      autoSize: true,
      height: 560,
      layout: {
        background: { type: ColorType.Solid, color: "#0b0b0b" },
        textColor: "#a1a1aa",
      },
      grid: {
        vertLines: { color: "#18181b" },
        horzLines: { color: "#27272a" },
      },
      rightPriceScale: {
        borderColor: "#3f3f46",
        scaleMargins: { top: 0.12, bottom: 0.12 },
      },
      timeScale: {
        borderColor: "#3f3f46",
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 2,
        barSpacing: 8,
      },
      crosshair: {
        vertLine: { color: "#52525b", labelBackgroundColor: "#18181b" },
        horzLine: { color: "#52525b", labelBackgroundColor: "#18181b" },
      },
      handleScale: {
        mouseWheel: true,
        pinch: true,
        axisPressedMouseMove: { time: true, price: true },
        axisDoubleClickReset: { time: true, price: true },
      },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#2dd4bf",
      downColor: "#fb7185",
      borderUpColor: "#2dd4bf",
      borderDownColor: "#fb7185",
      wickUpColor: "#5eead4",
      wickDownColor: "#fda4af",
      priceLineVisible: false,
      lastValueVisible: true,
    });

    chartRef.current = chart;
    seriesRef.current = series;

    const refreshOverlay = () => setViewportVersion((value) => value + 1);
    chart.subscribeClick((param) => {
      if (!param.point) return;
      const drawingPoint = resolveDrawingPoint(chart, series, param.point.x, param.point.y);
      if (!drawingPoint) return;
      handleChartClickRef.current?.(drawingPoint);
    });
    chart.timeScale().subscribeVisibleLogicalRangeChange(refreshOverlay);

    const observer = new ResizeObserver(() => {
      chart.applyOptions({
        width: container.clientWidth,
        height: Math.max(container.clientHeight, 520),
      });
      refreshOverlay();
    });
    observer.observe(container);

    return () => {
      observer.disconnect();
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(refreshOverlay);
      priceLinesRef.current = [];
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  React.useEffect(() => {
    const chart = chartRef.current;
    const series = seriesRef.current;
    if (!chart || !series) return;

    series.setData(visibleCandles);
    if (!initialRangeAppliedRef.current && visibleCandles.length > 0) {
      chart.timeScale().setVisibleLogicalRange({
        from: Math.max(0, visibleCandles.length - 90),
        to: visibleCandles.length + 2,
      });
      initialRangeAppliedRef.current = true;
    }
    setViewportVersion((value) => value + 1);
  }, [visibleCandles]);

  React.useEffect(() => {
    const series = seriesRef.current;
    if (!series) return;

    priceLinesRef.current.forEach((line) => series.removePriceLine(line));
    priceLinesRef.current = buildStandardPriceLines(card).map((line) => series.createPriceLine(line));
  }, [card]);

  React.useEffect(() => {
    drawingsHydratedRef.current = false;
    setPendingRectStart(null);
    try {
      const raw = window.localStorage.getItem(getDrawingStorageKey(card.cardId));
      setDrawings(raw ? parseStoredDrawings(raw) : []);
    } catch {
      setDrawings([]);
    } finally {
      drawingsHydratedRef.current = true;
    }
  }, [card.cardId]);

  React.useEffect(() => {
    if (!drawingsHydratedRef.current) return;
    try {
      window.localStorage.setItem(getDrawingStorageKey(card.cardId), JSON.stringify(drawings));
    } catch {
      // Drawing persistence is best effort; replay itself should keep working.
    }
  }, [card.cardId, drawings]);

  const handleDrawingClick = React.useCallback((point: DrawingPoint) => {
    if (activeTool === "SELECT") {
      setSelectedDrawingId(findNearestDrawingId(drawings, point));
      return;
    }
    if (activeTool === "HLINE") {
      const id = nanoId();
      setDrawings((current) => [...current, { id, type: "HLINE", price: point.price, startIndex: 0, endIndex: safeCurrentIndex }]);
      setSelectedDrawingId(id);
      setActiveTool("SELECT");
      setPendingRectStart(null);
      return;
    }
    if (activeTool === "LONG_POSITION" || activeTool === "SHORT_POSITION") {
      const direction = activeTool === "LONG_POSITION" ? "LONG" : "SHORT";
      const risk = Math.max(point.price * 0.01, 0.00000001);
      const id = nanoId();
      setDrawings((current) => [
        ...current,
        {
          id,
          type: "POSITION",
          direction,
          index: point.index,
          entryPrice: point.price,
          stopPrice: direction === "LONG" ? point.price - risk : point.price + risk,
          takeProfitPrice: direction === "LONG" ? point.price + risk * 2 : point.price - risk * 2,
        },
      ]);
      setSelectedDrawingId(id);
      setActiveTool("SELECT");
      setPendingRectStart(null);
      return;
    }
    if (activeTool === "RECT") {
      if (!pendingRectStart) {
        setPendingRectStart(point);
        return;
      }
      const id = nanoId();
      setDrawings((current) => [
        ...current,
        {
          id,
          type: "RECT",
          startIndex: pendingRectStart.index,
          endIndex: point.index,
          startPrice: pendingRectStart.price,
          endPrice: point.price,
        },
      ]);
      setSelectedDrawingId(id);
      setPendingRectStart(null);
      setActiveTool("SELECT");
    }
  }, [activeTool, drawings, pendingRectStart, safeCurrentIndex]);

  const handleChartClickRef = React.useRef<(point: DrawingPoint) => void>(() => {});
  React.useEffect(() => {
    handleChartClickRef.current = handleDrawingClick;
  }, [handleDrawingClick]);

  const deleteSelectedDrawing = React.useCallback(() => {
    if (!selectedDrawingId) return;
    setDrawings((current) => current.filter((drawing) => drawing.id !== selectedDrawingId));
    setSelectedDrawingId(null);
    setPendingRectStart(null);
  }, [selectedDrawingId]);

  const selectedPosition = React.useMemo(
    () => drawings.find((drawing): drawing is Extract<DrawingShape, { type: "POSITION" }> => drawing.id === selectedDrawingId && drawing.type === "POSITION") || null,
    [drawings, selectedDrawingId],
  );

  const selectedPositionRr = selectedPosition ? calculatePositionRr(selectedPosition) : null;

  const updatePositionPrice = React.useCallback((id: string, field: PositionPriceField, value: number) => {
    if (!Number.isFinite(value)) return;
    setDrawings((current) => current.map((drawing) => {
      if (drawing.id !== id || drawing.type !== "POSITION") return drawing;
      return {
        ...drawing,
        [field]: value,
      };
    }));
  }, []);

  const updateSelectedPositionPrice = React.useCallback((field: PositionPriceField, value: number) => {
    if (!selectedPosition) return;
    updatePositionPrice(selectedPosition.id, field, value);
  }, [selectedPosition, updatePositionPrice]);

  const updateRectHandle = React.useCallback((id: string, handle: RectHandle, point: DrawingPoint) => {
    setDrawings((current) => current.map((drawing) => {
      if (drawing.id !== id || drawing.type !== "RECT") return drawing;
      const next = { ...drawing };
      if (handle === "START_START" || handle === "START_END") next.startIndex = point.index;
      if (handle === "END_START" || handle === "END_END") next.endIndex = point.index;
      if (handle === "START_START" || handle === "END_START") next.startPrice = point.price;
      if (handle === "START_END" || handle === "END_END") next.endPrice = point.price;
      return next;
    }));
  }, []);

  if (visibleCandles.length === 0) {
    return <div className="flex h-[520px] items-center justify-center text-sm text-[#71717a]">暂无 K 线快照</div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#27272a] bg-[#121212] px-3 py-2">
        <div className="flex flex-wrap gap-2">
          <ToolButton active={activeTool === "SELECT"} onClick={() => { setActiveTool("SELECT"); setPendingRectStart(null); }} icon={<MousePointer2 className="size-4" />} label="选择" />
          <ToolButton active={activeTool === "RECT"} onClick={() => setActiveTool("RECT")} icon={<Box className="size-4" />} label={pendingRectStart ? "矩形：点终点" : "矩形"} />
          <ToolButton active={activeTool === "HLINE"} onClick={() => { setActiveTool("HLINE"); setPendingRectStart(null); }} icon={<Minus className="size-4" />} label="水平线" />
          <ToolButton active={activeTool === "LONG_POSITION"} onClick={() => { setActiveTool("LONG_POSITION"); setPendingRectStart(null); }} icon={<TrendingUp className="size-4" />} label="多头仓位" />
          <ToolButton active={activeTool === "SHORT_POSITION"} onClick={() => { setActiveTool("SHORT_POSITION"); setPendingRectStart(null); }} icon={<TrendingDown className="size-4" />} label="空头仓位" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {selectedPosition && selectedPositionRr !== null ? (
            <div className="flex flex-wrap items-center gap-2 rounded-md border border-[#27272a] bg-[#1e1e1e] px-2 py-1 text-xs text-[#e5e7eb]">
              <PositionPriceInput label="入场" value={selectedPosition.entryPrice} onChange={(value) => updateSelectedPositionPrice("entryPrice", value)} />
              <PositionPriceInput label="止损" value={selectedPosition.stopPrice} onChange={(value) => updateSelectedPositionPrice("stopPrice", value)} />
              <PositionPriceInput label="离场" value={selectedPosition.takeProfitPrice} onChange={(value) => updateSelectedPositionPrice("takeProfitPrice", value)} />
              <span className="rounded-md border border-[#27272a] bg-[#121212] px-2 py-1 text-[#a1a1aa]">RR {selectedPositionRr.toFixed(2)}</span>
            </div>
          ) : null}
          <Button
            variant="secondary"
            size="sm"
            disabled={!selectedDrawingId}
            onClick={deleteSelectedDrawing}
            className="gap-2 border border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb] hover:bg-[#27272a] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 className="size-4" />
            删除选中
          </Button>
        </div>
      </div>
      <div className="relative h-[560px] w-full overflow-hidden bg-[#0b0b0b]">
        <div ref={containerRef} className="h-full w-full" />
        <DrawingOverlay
          chart={chartRef.current}
          series={seriesRef.current}
          drawings={drawings}
          selectedDrawingId={selectedDrawingId}
          onUpdateRectHandle={updateRectHandle}
          onUpdatePositionPrice={updatePositionPrice}
          version={viewportVersion}
        />
        <div className="pointer-events-none absolute left-4 top-4 rounded-md border border-[#27272a] bg-[#111827]/90 px-3 py-2 text-xs text-[#d4d4d8]">
          已揭示 {visibleCandles.length} 根，未来隐藏 {Math.max(candles.length - safeCurrentIndex - 1, 0)} 根
        </div>
      </div>
    </div>
  );
}

function DrawingOverlay({
  chart,
  series,
  drawings,
  selectedDrawingId,
  onUpdateRectHandle,
  onUpdatePositionPrice,
  version: _version,
}: {
  chart: IChartApi | null;
  series: ISeriesApi<"Candlestick"> | null;
  drawings: DrawingShape[];
  selectedDrawingId: string | null;
  onUpdateRectHandle: (id: string, handle: RectHandle, point: DrawingPoint) => void;
  onUpdatePositionPrice: (id: string, field: PositionPriceField, value: number) => void;
  version: number;
}) {
  const svgRef = React.useRef<SVGSVGElement | null>(null);
  const [draggingHandle, setDraggingHandle] = React.useState<
    | { type: "RECT"; id: string; handle: RectHandle }
    | { type: "POSITION"; id: string; handle: PositionLineHandle }
    | null
  >(null);

  React.useEffect(() => {
    if (!draggingHandle || !chart || !series) return;
    const handlePointerMove = (event: PointerEvent) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const point = resolveDrawingPoint(chart, series, event.clientX - rect.left, event.clientY - rect.top);
      if (!point) return;
      if (draggingHandle.type === "RECT") {
        onUpdateRectHandle(draggingHandle.id, draggingHandle.handle, point);
        return;
      }
      onUpdatePositionPrice(draggingHandle.id, positionLineHandleToField(draggingHandle.handle), point.price);
    };
    const handlePointerUp = () => setDraggingHandle(null);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp, { once: true });
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [chart, draggingHandle, onUpdatePositionPrice, onUpdateRectHandle, series]);

  if (!chart || !series || drawings.length === 0) return null;
  const paneSize = chart.paneSize();
  const toX = (index: number) => chart.timeScale().logicalToCoordinate(index as Logical);
  const toY = (price: number) => series.priceToCoordinate(price);

  return (
    <svg ref={svgRef} className="pointer-events-none absolute left-0 top-0 z-10" width={paneSize.width} height={paneSize.height}>
      {drawings.map((drawing) => {
        const selected = drawing.id === selectedDrawingId;
        if (drawing.type === "RECT") {
          const x1 = toX(drawing.startIndex);
          const x2 = toX(drawing.endIndex);
          const y1 = toY(drawing.startPrice);
          const y2 = toY(drawing.endPrice);
          if (x1 === null || x2 === null || y1 === null || y2 === null) return null;
          const x = Math.min(x1, x2);
          const y = Math.min(y1, y2);
          const handles: Array<{ handle: RectHandle; x: number; y: number }> = [
            { handle: "START_START", x: x1, y: y1 },
            { handle: "START_END", x: x1, y: y2 },
            { handle: "END_START", x: x2, y: y1 },
            { handle: "END_END", x: x2, y: y2 },
          ];
          return (
            <g key={drawing.id}>
              <rect x={x} y={y} width={Math.abs(x2 - x1)} height={Math.abs(y2 - y1)} rx={3} fill="rgba(56, 189, 248, 0.12)" stroke={selected ? "#facc15" : "#38bdf8"} strokeWidth={selected ? 2.5 : 1.5} strokeDasharray="6 4" />
              {selected ? handles.map((item) => (
                <circle
                  key={item.handle}
                  cx={item.x}
                  cy={item.y}
                  r={6}
                  className="pointer-events-auto cursor-nwse-resize"
                  fill="#facc15"
                  stroke="#111827"
                  strokeWidth={2}
                  onPointerDown={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setDraggingHandle({ type: "RECT", id: drawing.id, handle: item.handle });
                  }}
                />
              )) : null}
            </g>
          );
        }
        if (drawing.type === "HLINE") {
          const y = toY(drawing.price);
          if (y === null) return null;
          return <line key={drawing.id} x1={0} x2={paneSize.width} y1={y} y2={y} stroke="#facc15" strokeWidth={selected ? 2.5 : 1.5} strokeDasharray="8 5" />;
        }
        const x = toX(drawing.index);
        const entryY = toY(drawing.entryPrice);
        const stopY = toY(drawing.stopPrice);
        const takeY = toY(drawing.takeProfitPrice);
        if (x === null || entryY === null || stopY === null || takeY === null) return null;
        const left = Math.max(0, x - 44);
        const width = Math.min(120, paneSize.width - left);
        const profitTop = Math.min(entryY, takeY);
        const profitHeight = Math.abs(entryY - takeY);
        const lossTop = Math.min(entryY, stopY);
        const lossHeight = Math.abs(entryY - stopY);
        const positionTop = Math.min(entryY, stopY, takeY);
        const positionBottom = Math.max(entryY, stopY, takeY);
        const rr = calculatePositionRr(drawing);
        const positionLines: Array<{ handle: PositionLineHandle; y: number; label: string; color: string }> = [
          { handle: "TAKE_PROFIT", y: takeY, label: "离场", color: "#2dd4bf" },
          { handle: "ENTRY", y: entryY, label: "入场", color: "#38bdf8" },
          { handle: "STOP", y: stopY, label: "止损", color: "#fb7185" },
        ];
        return (
          <g key={drawing.id}>
            {selected ? <rect x={left - 4} y={positionTop - 4} width={width + 8} height={positionBottom - positionTop + 8} fill="none" stroke="#facc15" strokeWidth={1.5} strokeDasharray="5 5" /> : null}
            <rect x={left} y={profitTop} width={width} height={profitHeight} fill="rgba(45, 212, 191, 0.16)" stroke="#2dd4bf" strokeWidth={1} />
            <rect x={left} y={lossTop} width={width} height={lossHeight} fill="rgba(251, 113, 133, 0.16)" stroke="#fb7185" strokeWidth={1} />
            {positionLines.map((line) => (
              <g key={line.handle}>
                <line x1={left} x2={left + width} y1={line.y} y2={line.y} stroke={line.color} strokeWidth={line.handle === "ENTRY" ? 1.8 : 1.4} />
                {selected ? (
                  <>
                    <line
                      x1={left - 6}
                      x2={left + width + 6}
                      y1={line.y}
                      y2={line.y}
                      className="pointer-events-auto cursor-ns-resize"
                      stroke="transparent"
                      strokeWidth={12}
                      onPointerDown={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        setDraggingHandle({ type: "POSITION", id: drawing.id, handle: line.handle });
                      }}
                    />
                    <rect x={left + width - 36} y={line.y - 9} width={36} height={18} rx={4} fill="#111827" stroke={line.color} strokeWidth={1} />
                    <text x={left + width - 18} y={line.y + 4} fill="#e5e7eb" fontSize={11} textAnchor="middle">{line.label}</text>
                  </>
                ) : null}
              </g>
            ))}
            <text x={left + 6} y={entryY - 6} fill="#d4d4d8" fontSize={12}>{drawing.direction === "LONG" ? "多头" : "空头"} RR {rr.toFixed(2)}</text>
          </g>
        );
      })}
    </svg>
  );
}

function positionLineHandleToField(handle: PositionLineHandle): PositionPriceField {
  if (handle === "ENTRY") return "entryPrice";
  if (handle === "STOP") return "stopPrice";
  return "takeProfitPrice";
}

function toCandlestickData(candle: PracticalFlashcardCandle, timeZone: string): CandlestickData {
  return {
    time: toChartTime(candle.openTime, timeZone),
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close,
  };
}

function toChartTime(utcMs: number, timeZone: string): UTCTimestamp {
  return Math.floor((utcMs + getTimeZoneOffsetMs(timeZone, utcMs)) / 1000) as UTCTimestamp;
}

function getBrowserTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Shanghai";
}

function getTimeZoneOffsetMs(timeZone: string, utcMs: number) {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date(utcMs));
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    const zonedAsUtc = Date.UTC(
      Number(values.year),
      Number(values.month) - 1,
      Number(values.day),
      Number(values.hour),
      Number(values.minute),
      Number(values.second),
    );
    return zonedAsUtc - utcMs;
  } catch {
    return 0;
  }
}

function resolveDrawingPoint(
  chart: IChartApi,
  series: ISeriesApi<"Candlestick">,
  x: number,
  y: number,
): DrawingPoint | null {
  const logical = chart.timeScale().coordinateToLogical(x);
  const price = series.coordinateToPrice(y);
  if (logical === null || price === null) return null;
  return {
    index: Math.max(0, Math.round(logical as number)),
    price,
  };
}

function buildStandardPriceLines(card: PracticalFlashcardCard) {
  return [
    typeof card.standardEntryPrice === "number"
      ? {
          price: card.standardEntryPrice,
          color: "#38bdf8",
          lineWidth: 1 as const,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: "入场",
        }
      : null,
    typeof card.standardStopLossPrice === "number"
      ? {
          price: card.standardStopLossPrice,
          color: "#fb7185",
          lineWidth: 1 as const,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: "止损",
        }
      : null,
    typeof card.standardTakeProfitPrice === "number"
      ? {
          price: card.standardTakeProfitPrice,
          color: "#2dd4bf",
          lineWidth: 1 as const,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: "止盈",
        }
      : null,
  ].filter((line): line is NonNullable<typeof line> => Boolean(line));
}

function calculatePositionRr(position: Extract<DrawingShape, { type: "POSITION" }>) {
  const risk = Math.abs(position.entryPrice - position.stopPrice);
  if (!Number.isFinite(risk) || risk <= 0) return 0;
  return Math.abs(position.takeProfitPrice - position.entryPrice) / risk;
}

function findNearestDrawingId(drawings: DrawingShape[], point: DrawingPoint) {
  if (drawings.length === 0) return null;
  const scored = drawings
    .map((drawing) => ({ id: drawing.id, score: getDrawingDistance(drawing, point) }))
    .sort((a, b) => a.score - b.score);
  const nearest = scored[0];
  return nearest && nearest.score < Number.POSITIVE_INFINITY ? nearest.id : null;
}

function getDrawingDistance(drawing: DrawingShape, point: DrawingPoint) {
  if (drawing.type === "HLINE") return Math.abs(drawing.price - point.price);
  if (drawing.type === "RECT") {
    const minIndex = Math.min(drawing.startIndex, drawing.endIndex);
    const maxIndex = Math.max(drawing.startIndex, drawing.endIndex);
    const minPrice = Math.min(drawing.startPrice, drawing.endPrice);
    const maxPrice = Math.max(drawing.startPrice, drawing.endPrice);
    const insideIndex = point.index >= minIndex && point.index <= maxIndex;
    const insidePrice = point.price >= minPrice && point.price <= maxPrice;
    if (insideIndex && insidePrice) return 0;
    return Math.min(Math.abs(point.price - minPrice), Math.abs(point.price - maxPrice));
  }
  return Math.min(
    Math.abs(point.price - drawing.entryPrice),
    Math.abs(point.price - drawing.stopPrice),
    Math.abs(point.price - drawing.takeProfitPrice),
  );
}

function nanoId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function getDrawingStorageKey(cardId: string) {
  return `practical-flashcard-drawings:${cardId}`;
}

function parseStoredDrawings(raw: string): DrawingShape[] {
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(isDrawingShape);
}

function isDrawingShape(value: unknown): value is DrawingShape {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<DrawingShape>;
  if (typeof item.id !== "string" || typeof item.type !== "string") return false;
  if (item.type === "RECT") {
    const rect = item as Partial<Extract<DrawingShape, { type: "RECT" }>>;
    return [rect.startIndex, rect.endIndex, rect.startPrice, rect.endPrice].every((field) => typeof field === "number" && Number.isFinite(field));
  }
  if (item.type === "HLINE") {
    const line = item as Partial<Extract<DrawingShape, { type: "HLINE" }>>;
    return typeof line.price === "number" && Number.isFinite(line.price);
  }
  if (item.type === "POSITION") {
    const position = item as Partial<Extract<DrawingShape, { type: "POSITION" }>>;
    return (
      (position.direction === "LONG" || position.direction === "SHORT") &&
      [position.index, position.entryPrice, position.stopPrice, position.takeProfitPrice].every((field) => typeof field === "number" && Number.isFinite(field))
    );
  }
  return false;
}

function clampIndex(index: number | undefined, length: number) {
  if (!length) return 0;
  const value = typeof index === "number" && Number.isFinite(index) ? index : 0;
  return Math.max(0, Math.min(Math.round(value), length - 1));
}

function formatPrice(value?: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "--";
  return value.toLocaleString("en-US", { maximumFractionDigits: 8 });
}

function ToolButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant="secondary"
      onClick={onClick}
      className={`gap-2 border ${active ? "border-[#00c2b2] bg-[#00c2b2]/15 text-[#00c2b2]" : "border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb] hover:bg-[#27272a]"}`}
    >
      {icon}
      {label}
    </Button>
  );
}

function PositionPriceInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="flex items-center gap-1">
      <span className="text-[#a1a1aa]">{label}</span>
      <input
        type="number"
        value={formatInputNumber(value)}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-7 w-24 rounded-md border border-[#27272a] bg-[#121212] px-2 text-xs text-[#e5e7eb] outline-none focus:border-[#00c2b2]"
      />
    </label>
  );
}

function formatInputNumber(value: number) {
  return Number.isFinite(value) ? Number(value.toFixed(8)).toString() : "";
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[80px_minmax(0,1fr)] gap-3">
      <div className="text-[#71717a]">{label}</div>
      <div className="break-words text-[#e5e7eb]">{value || "--"}</div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#27272a] bg-[#18181b] p-3">
      <div className="text-xs text-[#71717a]">{label}</div>
      <div className="mt-2 break-words text-sm font-medium text-[#e5e7eb]">{value}</div>
    </div>
  );
}
