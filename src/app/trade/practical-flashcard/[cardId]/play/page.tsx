"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Box, CheckCircle2, ChevronLeft, ChevronRight, ChevronsRight, Minus, MousePointer2, RotateCcw, Save, Trash2, TrendingDown, TrendingUp } from "lucide-react";
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
import {
  createPracticalFlashcardAttemptTrade,
  getPracticalFlashcardAttempt,
  getPracticalFlashcardCard,
  resolvePracticalFlashcardAttempt,
  startPracticalFlashcardAttempt,
} from "../../request";
import {
  PRACTICAL_FLASHCARD_LABELS,
  type PracticalFlashcardAttempt,
  type PracticalFlashcardCard,
  type PracticalFlashcardCandle,
  type PracticalFlashcardTradeDirection,
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
type ReviewChoice = "CORRECT" | "WRONG";
type OrderFlowReviewChoice = "NOT_USED" | "CORRECT" | "WRONG";

export default function PracticalFlashcardReplayPage() {
  const params = useParams<{ cardId: string }>();
  const [successAlert, errorAlert] = useAlert();
  const [card, setCard] = React.useState<PracticalFlashcardCard | null>(null);
  const [attempt, setAttempt] = React.useState<PracticalFlashcardAttempt | null>(null);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [tradeDirection, setTradeDirection] = React.useState<PracticalFlashcardTradeDirection>("LONG");
  const [stopLossPrice, setStopLossPrice] = React.useState("");
  const [takeProfitPrice, setTakeProfitPrice] = React.useState("");
  const [drawings, setDrawings] = React.useState<DrawingShape[]>([]);
  const [preTradeMarketStructureAnalysis, setPreTradeMarketStructureAnalysis] = React.useState("");
  const [preTradePriceActionAnalysis, setPreTradePriceActionAnalysis] = React.useState("");
  const [preTradeOrderFlowAnalysis, setPreTradeOrderFlowAnalysis] = React.useState("");
  const [marketStructureReview, setMarketStructureReview] = React.useState<ReviewChoice>("CORRECT");
  const [priceActionReview, setPriceActionReview] = React.useState<ReviewChoice>("CORRECT");
  const [orderFlowReview, setOrderFlowReview] = React.useState<OrderFlowReviewChoice>("NOT_USED");
  const [riskRewardReview, setRiskRewardReview] = React.useState<ReviewChoice>("CORRECT");
  const [reviewNotes, setReviewNotes] = React.useState("");
  const [reviewSummary, setReviewSummary] = React.useState("");
  const [submittingTrade, setSubmittingTrade] = React.useState(false);
  const [resolvingAttempt, setResolvingAttempt] = React.useState(false);
  const startedCardIdRef = React.useRef<string | null>(null);
  const appliedPositionSourceRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    const cardId = params?.cardId;
    if (!cardId || typeof cardId !== "string") return;
    if (startedCardIdRef.current === cardId) return;
    startedCardIdRef.current = cardId;
    setAttempt(null);
    getPracticalFlashcardCard(cardId)
      .then((res) => {
        setCard(res);
        setCurrentIndex(clampIndex(res.initialVisibleCandleIndex, res.candles.length));
        const requestedAttemptId = new URLSearchParams(window.location.search).get("attemptId");
        if (requestedAttemptId) {
          return getPracticalFlashcardAttempt(requestedAttemptId).then((existingAttempt) => {
            if (existingAttempt.targetCardId !== res.cardId) {
              throw new Error("训练记录与当前实操闪卡不匹配");
            }
            setCurrentIndex(
              clampIndex(
                existingAttempt.currentCandleIndex ?? existingAttempt.finalCandleIndex ?? res.initialVisibleCandleIndex,
                res.candles.length,
              ),
            );
            setAttempt(existingAttempt);
          });
        }
        return startPracticalFlashcardAttempt(res.cardId).then((attemptRes) => {
          setAttempt(attemptRes.attempt);
        });
      })
      .catch((error) => {
        startedCardIdRef.current = null;
        errorAlert(error instanceof Error ? error.message : "获取实操闪卡失败");
      });
  }, [errorAlert, params]);

  const resultIndex = card?.resultCandleIndex ?? null;
  const maxIndex = Math.max((card?.candles.length || 1) - 1, 0);
  const currentCandle = card ? card.candles[clampIndex(currentIndex, card.candles.length)] : undefined;
  const currentClose = currentCandle?.close;
  const matchingPosition = React.useMemo(
    () => findLatestPositionDrawing(drawings, tradeDirection),
    [drawings, tradeDirection],
  );

  React.useEffect(() => {
    if (!currentClose || attempt?.tradeOpenedCandleIndex !== undefined) return;
    if (matchingPosition) return;
    const risk = currentClose * 0.01;
    if (tradeDirection === "LONG") {
      setStopLossPrice(formatInputNumber(currentClose - risk));
      setTakeProfitPrice(formatInputNumber(currentClose + risk * 2));
    } else {
      setStopLossPrice(formatInputNumber(currentClose + risk));
      setTakeProfitPrice(formatInputNumber(currentClose - risk * 2));
    }
  }, [attempt?.tradeOpenedCandleIndex, currentClose, matchingPosition, tradeDirection]);

  React.useEffect(() => {
    if (!matchingPosition) {
      appliedPositionSourceRef.current = null;
      return;
    }
    if (attempt?.tradeOpenedCandleIndex !== undefined) return;
    const source = `${tradeDirection}:${matchingPosition.id}:${matchingPosition.stopPrice}:${matchingPosition.takeProfitPrice}`;
    if (appliedPositionSourceRef.current === source) return;
    appliedPositionSourceRef.current = source;
    setStopLossPrice(formatInputNumber(matchingPosition.stopPrice));
    setTakeProfitPrice(formatInputNumber(matchingPosition.takeProfitPrice));
  }, [attempt?.tradeOpenedCandleIndex, matchingPosition, tradeDirection]);

  const handleConfirmTrade = React.useCallback(async () => {
    if (!card || !attempt) return;
    if (!preTradeMarketStructureAnalysis.trim()) {
      errorAlert("确认交易前必须填写市场结构分析");
      return;
    }
    const stop = Number(stopLossPrice);
    const takeProfit = Number(takeProfitPrice);
    if (!Number.isFinite(stop) || !Number.isFinite(takeProfit)) {
      errorAlert("请填写有效的止损价和止盈价");
      return;
    }
    setSubmittingTrade(true);
    try {
      const updated = await createPracticalFlashcardAttemptTrade(attempt.attemptId, {
        direction: tradeDirection,
        currentCandleIndex: currentIndex,
        stopLossPrice: stop,
        takeProfitPrice: takeProfit,
        drawingSnapshot: readDrawingSnapshot(card.cardId),
        preTradeMarketStructureAnalysis,
        preTradePriceActionAnalysis,
        preTradeOrderFlowAnalysis,
      });
      setAttempt(updated);
      successAlert("交易已确认");
    } catch (error) {
      errorAlert(error instanceof Error ? error.message : "确认交易失败");
    } finally {
      setSubmittingTrade(false);
    }
  }, [
    attempt,
    card,
    currentIndex,
    errorAlert,
    preTradeMarketStructureAnalysis,
    preTradeOrderFlowAnalysis,
    preTradePriceActionAnalysis,
    stopLossPrice,
    successAlert,
    takeProfitPrice,
    tradeDirection,
  ]);

  const handleResolveAttempt = React.useCallback(async () => {
    if (!card || !attempt) return;
    setResolvingAttempt(true);
    try {
      const result = await resolvePracticalFlashcardAttempt(attempt.attemptId, {
        finalCandleIndex: currentIndex,
        marketStructureAnalysisCorrect: marketStructureReview === "CORRECT",
        priceActionAnalysisCorrect: priceActionReview === "CORRECT",
        orderFlowAnalysisUsed: orderFlowReview !== "NOT_USED",
        orderFlowAnalysisCorrect: orderFlowReview === "NOT_USED" ? undefined : orderFlowReview === "CORRECT",
        riskRewardSetupCorrect: riskRewardReview === "CORRECT",
        drawingSnapshot: readDrawingSnapshot(card.cardId),
        notes: reviewNotes,
        summary: reviewSummary,
      });
      setAttempt(result.attempt);
      successAlert("训练已完成");
    } catch (error) {
      errorAlert(error instanceof Error ? error.message : "完成训练失败");
    } finally {
      setResolvingAttempt(false);
    }
  }, [
    attempt,
    card,
    currentIndex,
    errorAlert,
    marketStructureReview,
    orderFlowReview,
    priceActionReview,
    reviewNotes,
    reviewSummary,
    riskRewardReview,
    successAlert,
  ]);

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
              attempt={attempt}
              candles={card.candles}
              currentIndex={currentIndex}
              onDrawingsChange={setDrawings}
            />
          </section>

          <aside className="space-y-4">
            <section className="rounded-xl border border-[#27272a] bg-[#121212] p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-white">交易执行</div>
                <div className="text-xs text-[#a1a1aa]">当前收盘 {formatPrice(currentClose)}</div>
              </div>
              {attempt ? (
                <div className="mt-4 space-y-3">
                  {attempt.tradeOpenedCandleIndex === undefined ? (
                    <PreTradeAnalysisForm
                      marketStructure={preTradeMarketStructureAnalysis}
                      priceAction={preTradePriceActionAnalysis}
                      orderFlow={preTradeOrderFlowAnalysis}
                      onMarketStructureChange={setPreTradeMarketStructureAnalysis}
                      onPriceActionChange={setPreTradePriceActionAnalysis}
                      onOrderFlowChange={setPreTradeOrderFlowAnalysis}
                    />
                  ) : null}
                  <div className="grid grid-cols-2 gap-2">
                    <TradeDirectionButton direction="LONG" active={tradeDirection === "LONG"} disabled={attempt.tradeOpenedCandleIndex !== undefined} onClick={() => setTradeDirection("LONG")} />
                    <TradeDirectionButton direction="SHORT" active={tradeDirection === "SHORT"} disabled={attempt.tradeOpenedCandleIndex !== undefined} onClick={() => setTradeDirection("SHORT")} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <PriceField label="止损价" value={stopLossPrice} disabled={attempt.tradeOpenedCandleIndex !== undefined} onChange={setStopLossPrice} />
                    <PriceField label="止盈价" value={takeProfitPrice} disabled={attempt.tradeOpenedCandleIndex !== undefined} onChange={setTakeProfitPrice} />
                  </div>
                  {attempt.tradeOpenedCandleIndex !== undefined ? (
                    <div className="rounded-lg border border-[#164e63] bg-[#083344]/60 p-3 text-xs text-[#bae6fd]">
                      已确认 {attempt.tradeDirection ? PRACTICAL_FLASHCARD_LABELS[attempt.tradeDirection] : "--"}，入场价 {formatPrice(attempt.entryPrice)}，计划 RR {formatRatio(attempt.plannedRr)}
                    </div>
                  ) : (
                    <Button
                      type="button"
                      disabled={submittingTrade || !attempt || currentClose === undefined}
                      onClick={handleConfirmTrade}
                      className="w-full gap-2 bg-[#00c2b2] text-[#031313] hover:bg-[#14d6c5] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <TrendingUp className="size-4" />
                      按当前收盘价确认交易
                    </Button>
                  )}
                </div>
              ) : (
                <div className="mt-4 rounded-lg border border-[#27272a] bg-[#18181b] p-3 text-sm text-[#a1a1aa]">正在创建本次训练记录...</div>
              )}
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
              <div className="text-sm font-semibold text-white">训练结算</div>
              {attempt?.status === "RESOLVED" ? (
                <div className="mt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <Metric label="胜负" value={attempt.isWin ? "盈利" : "亏损"} />
                    <Metric label="实现 R" value={formatRatio(attempt.realizedR)} />
                    <Metric label="最大有利 R" value={formatRatio(attempt.maxFavorableR)} />
                    <Metric label="最大不利 R" value={formatRatio(attempt.maxAdverseR)} />
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-[#14532d] bg-[#052e16]/70 p-3 text-sm text-[#bbf7d0]">
                    <CheckCircle2 className="size-4" />
                    本次实操训练已保存
                  </div>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  <ReviewToggle label="市场结构" value={marketStructureReview} onChange={setMarketStructureReview} />
                  <ReviewToggle label="价格行为" value={priceActionReview} onChange={setPriceActionReview} />
                  <OrderFlowReviewToggle value={orderFlowReview} onChange={setOrderFlowReview} />
                  <ReviewToggle label="止盈止损" value={riskRewardReview} onChange={setRiskRewardReview} />
                  <textarea
                    value={reviewNotes}
                    onChange={(event) => setReviewNotes(event.target.value)}
                    placeholder="备注"
                    className="min-h-[72px] w-full rounded-lg border border-[#27272a] bg-[#18181b] px-3 py-2 text-sm text-[#e5e7eb] outline-none placeholder:text-[#52525b] focus:border-[#00c2b2]"
                  />
                  <textarea
                    value={reviewSummary}
                    onChange={(event) => setReviewSummary(event.target.value)}
                    placeholder="总结"
                    className="min-h-[72px] w-full rounded-lg border border-[#27272a] bg-[#18181b] px-3 py-2 text-sm text-[#e5e7eb] outline-none placeholder:text-[#52525b] focus:border-[#00c2b2]"
                  />
                  <Button
                    type="button"
                    disabled={!attempt || attempt.tradeOpenedCandleIndex === undefined || resolvingAttempt}
                    onClick={handleResolveAttempt}
                    className="w-full gap-2 bg-[#00c2b2] text-[#031313] hover:bg-[#14d6c5] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Save className="size-4" />
                    完成训练并保存
                  </Button>
                </div>
              )}
            </section>

          </aside>
        </div>
      </div>
    </TradePageShell>
  );
}

function CandlestickReplayChart({
  card,
  attempt,
  candles,
  currentIndex,
  onDrawingsChange,
}: {
  card: PracticalFlashcardCard;
  attempt: PracticalFlashcardAttempt | null;
  candles: PracticalFlashcardCandle[];
  currentIndex: number;
  onDrawingsChange: (drawings: DrawingShape[]) => void;
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
      const nextDrawings = raw ? parseStoredDrawings(raw) : [];
      setDrawings(nextDrawings);
      onDrawingsChange(nextDrawings);
    } catch {
      setDrawings([]);
      onDrawingsChange([]);
    } finally {
      drawingsHydratedRef.current = true;
    }
  }, [card.cardId, onDrawingsChange]);

  React.useEffect(() => {
    if (!drawingsHydratedRef.current) return;
    try {
      window.localStorage.setItem(getDrawingStorageKey(card.cardId), JSON.stringify(drawings));
    } catch {
      // Drawing persistence is best effort; replay itself should keep working.
    }
    onDrawingsChange(drawings);
  }, [card.cardId, drawings, onDrawingsChange]);

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
        <TradeExecutionMarkers
          chart={chartRef.current}
          series={seriesRef.current}
          candles={candles}
          attempt={attempt}
          version={viewportVersion}
        />
      </div>
    </div>
  );
}

function TradeExecutionMarkers({
  chart,
  series,
  candles,
  attempt,
  version: _version,
}: {
  chart: IChartApi | null;
  series: ISeriesApi<"Candlestick"> | null;
  candles: PracticalFlashcardCandle[];
  attempt: PracticalFlashcardAttempt | null;
  version: number;
}) {
  if (!chart || !series || !attempt || attempt.tradeOpenedCandleIndex === undefined) return null;
  const paneSize = chart.paneSize();
  const markers = buildTradeExecutionMarkers(chart, series, candles, attempt);
  if (markers.length === 0) return null;

  return (
    <svg className="pointer-events-none absolute left-0 top-0 z-20" width={paneSize.width} height={paneSize.height}>
      {markers.map((marker) => (
        <g key={marker.key} transform={`translate(${marker.x}, ${marker.y})`}>
          <line y1={marker.direction === "up" ? 8 : -8} y2={marker.direction === "up" ? 24 : -24} stroke={marker.color} strokeWidth={2} />
          <path
            d={marker.direction === "up" ? "M0 0 L-6 10 L6 10 Z" : "M0 0 L-6 -10 L6 -10 Z"}
            fill={marker.color}
            stroke="#0b0b0b"
            strokeWidth={1.5}
          />
          <rect
            x={marker.labelX}
            y={marker.direction === "up" ? 26 : -48}
            width={marker.labelWidth}
            height={22}
            rx={5}
            fill="#111827"
            stroke={marker.color}
            strokeWidth={1}
          />
          <text
            x={marker.labelX + marker.labelWidth / 2}
            y={marker.direction === "up" ? 41 : -33}
            fill="#f9fafb"
            fontSize={12}
            textAnchor="middle"
          >
            {marker.label}
          </text>
        </g>
      ))}
    </svg>
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

function buildTradeExecutionMarkers(
  chart: IChartApi,
  series: ISeriesApi<"Candlestick">,
  candles: PracticalFlashcardCandle[],
  attempt: PracticalFlashcardAttempt,
) {
  const markers: Array<{
    key: string;
    x: number;
    y: number;
    label: string;
    labelX: number;
    labelWidth: number;
    color: string;
    direction: "up" | "down";
  }> = [];

  const entryIndex = attempt.tradeOpenedCandleIndex;
  if (entryIndex === undefined) return markers;
  const entryPrice = typeof attempt.entryPrice === "number" ? attempt.entryPrice : candles[entryIndex]?.close;
  const entryMarker = buildTradeExecutionMarker(chart, series, entryIndex, entryPrice, "入场", "#38bdf8", "up");
  if (entryMarker) markers.push({ key: "entry", ...entryMarker });

  if (attempt.tradeClosedCandleIndex !== undefined) {
    const exitPrice = typeof attempt.exitPrice === "number" ? attempt.exitPrice : candles[attempt.tradeClosedCandleIndex]?.close;
    const exitMarker = buildTradeExecutionMarker(
      chart,
      series,
      attempt.tradeClosedCandleIndex,
      exitPrice,
      getExitMarkerLabel(attempt.exitReason),
      attempt.exitReason === "STOP_LOSS" ? "#fb7185" : "#2dd4bf",
      "down",
    );
    if (exitMarker) markers.push({ key: "exit", ...exitMarker });
  }

  return markers;
}

function buildTradeExecutionMarker(
  chart: IChartApi,
  series: ISeriesApi<"Candlestick">,
  candleIndex: number,
  price: number | undefined,
  label: string,
  color: string,
  direction: "up" | "down",
) {
  if (typeof price !== "number" || !Number.isFinite(price)) return null;
  const x = chart.timeScale().logicalToCoordinate(candleIndex as Logical);
  const y = series.priceToCoordinate(price);
  if (x === null || y === null) return null;
  const labelWidth = Math.max(44, label.length * 14);
  return {
    x,
    y,
    label,
    labelX: -labelWidth / 2,
    labelWidth,
    color,
    direction,
  };
}

function getExitMarkerLabel(reason?: PracticalFlashcardAttempt["exitReason"]) {
  if (reason === "TAKE_PROFIT") return "止盈离场";
  if (reason === "STOP_LOSS") return "止损离场";
  if (reason === "NO_EXIT_BY_FINAL_CANDLE") return "最终离场";
  return "离场";
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

function findLatestPositionDrawing(drawings: DrawingShape[], direction: PracticalFlashcardTradeDirection) {
  const positions = drawings.filter(
    (drawing): drawing is Extract<DrawingShape, { type: "POSITION" }> =>
      drawing.type === "POSITION" && drawing.direction === direction,
  );
  return positions[positions.length - 1] || null;
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

function readDrawingSnapshot(cardId: string): Record<string, unknown> | undefined {
  try {
    const raw = window.localStorage.getItem(getDrawingStorageKey(cardId));
    const drawings = raw ? parseStoredDrawings(raw) : [];
    return {
      version: 1,
      savedAt: new Date().toISOString(),
      drawings,
    };
  } catch {
    return undefined;
  }
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

function formatRatio(value?: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "--";
  return value.toFixed(2);
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

function PriceField({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs text-[#a1a1aa]">{label}</span>
      <input
        type="number"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 h-9 w-full rounded-md border border-[#27272a] bg-[#18181b] px-2 text-sm text-[#e5e7eb] outline-none focus:border-[#00c2b2] disabled:cursor-not-allowed disabled:opacity-60"
      />
    </label>
  );
}

function PreTradeAnalysisForm({
  marketStructure,
  priceAction,
  orderFlow,
  onMarketStructureChange,
  onPriceActionChange,
  onOrderFlowChange,
}: {
  marketStructure: string;
  priceAction: string;
  orderFlow: string;
  onMarketStructureChange: (value: string) => void;
  onPriceActionChange: (value: string) => void;
  onOrderFlowChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2 rounded-lg border border-[#27272a] bg-[#18181b] p-3">
      <AnalysisField
        label="市场结构"
        required
        value={marketStructure}
        onChange={onMarketStructureChange}
      />
      <AnalysisField
        label="价格行为"
        value={priceAction}
        onChange={onPriceActionChange}
      />
      <AnalysisField
        label="足迹图分析"
        value={orderFlow}
        onChange={onOrderFlowChange}
      />
    </div>
  );
}

function AnalysisField({
  label,
  required,
  value,
  onChange,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs text-[#a1a1aa]">
        {label}
        {required ? <span className="text-[#fb7185]"> *</span> : null}
      </span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 min-h-[58px] w-full rounded-md border border-[#27272a] bg-[#121212] px-2 py-2 text-sm text-[#e5e7eb] outline-none placeholder:text-[#52525b] focus:border-[#00c2b2]"
      />
    </label>
  );
}

function TradeDirectionButton({
  direction,
  active,
  disabled,
  onClick,
}: {
  direction: PracticalFlashcardTradeDirection;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="secondary"
      disabled={disabled}
      onClick={onClick}
      className={`gap-2 border disabled:cursor-not-allowed disabled:opacity-60 ${active ? "border-[#00c2b2] bg-[#00c2b2]/15 text-[#00c2b2]" : "border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb] hover:bg-[#27272a]"}`}
    >
      {direction === "LONG" ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
      {PRACTICAL_FLASHCARD_LABELS[direction]}
    </Button>
  );
}

function ReviewToggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: ReviewChoice;
  onChange: (value: ReviewChoice) => void;
}) {
  return (
    <div>
      <div className="mb-1 text-xs text-[#a1a1aa]">{label}</div>
      <div className="grid grid-cols-2 gap-2">
        <ReviewButton active={value === "CORRECT"} onClick={() => onChange("CORRECT")} label="正确" />
        <ReviewButton active={value === "WRONG"} onClick={() => onChange("WRONG")} label="错误" />
      </div>
    </div>
  );
}

function OrderFlowReviewToggle({
  value,
  onChange,
}: {
  value: OrderFlowReviewChoice;
  onChange: (value: OrderFlowReviewChoice) => void;
}) {
  return (
    <div>
      <div className="mb-1 text-xs text-[#a1a1aa]">足迹图分析</div>
      <div className="grid grid-cols-3 gap-2">
        <ReviewButton active={value === "NOT_USED"} onClick={() => onChange("NOT_USED")} label="未使用" />
        <ReviewButton active={value === "CORRECT"} onClick={() => onChange("CORRECT")} label="正确" />
        <ReviewButton active={value === "WRONG"} onClick={() => onChange("WRONG")} label="错误" />
      </div>
    </div>
  );
}

function ReviewButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-8 rounded-md border text-xs ${active ? "border-[#00c2b2] bg-[#00c2b2]/15 text-[#5eead4]" : "border-[#27272a] bg-[#18181b] text-[#a1a1aa] hover:border-[#3f3f46] hover:text-[#e5e7eb]"}`}
    >
      {label}
    </button>
  );
}

function formatInputNumber(value: number) {
  return Number.isFinite(value) ? Number(value.toFixed(8)).toString() : "";
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#27272a] bg-[#18181b] p-3">
      <div className="text-xs text-[#71717a]">{label}</div>
      <div className="mt-2 break-words text-sm font-medium text-[#e5e7eb]">{value}</div>
    </div>
  );
}
