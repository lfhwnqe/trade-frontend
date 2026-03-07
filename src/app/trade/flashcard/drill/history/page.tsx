"use client";

import React from "react";
import { format } from "date-fns";
import TradePageShell from "../../../components/trade-page-shell";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAlert } from "@/components/common/alert";
import { getFlashcardDrillAnalytics, listFlashcardDrillSessions } from "../../request";
import {
  FLASHCARD_LABELS,
  type FlashcardDrillAnalytics,
  type FlashcardDrillAnalyticsDimensionStat,
  type FlashcardDrillAnalyticsWindow,
  type FlashcardDrillSessionHistoryItem,
} from "../../types";

type SessionStatus = "ALL" | "IN_PROGRESS" | "COMPLETED" | "ABANDONED";

const PAGE_SIZE = 20;
const RECENT_WINDOW = 30;

function formatDelta(delta: number | null) {
  if (delta === null) return "暂无上一组";
  if (delta === 0) return "与上一组持平";
  return `${delta > 0 ? "+" : ""}${delta} 分 vs 上一组`;
}

function deltaTone(delta: number | null) {
  if (delta === null || delta === 0) return "text-[#9ca3af]";
  return delta > 0 ? "text-emerald-300" : "text-rose-300";
}

function OverviewCard(props: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-xl border border-[#27272a] bg-[#121212] p-4 shadow-sm">
      <div className="text-xs text-[#9ca3af]">{props.label}</div>
      <div className="mt-1 text-2xl font-semibold text-white">{props.value}</div>
      {props.hint ? <div className="mt-1 text-xs text-[#6b7280]">{props.hint}</div> : null}
    </div>
  );
}

function WindowCard(props: { title: string; window: FlashcardDrillAnalyticsWindow }) {
  return (
    <div className="rounded-xl border border-[#27272a] bg-[#121212] p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-white">{props.title}</div>
          <div className="mt-1 text-xs text-[#9ca3af]">样本 {props.window.sampleSize} 轮</div>
        </div>
        <div className={`text-xs font-medium ${deltaTone(props.window.deltaFromPrevious)}`}>
          {formatDelta(props.window.deltaFromPrevious)}
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3">
        <div>
          <div className="text-xs text-[#6b7280]">均分</div>
          <div className="mt-1 text-xl font-semibold text-white">{props.window.averageScore}</div>
        </div>
        <div>
          <div className="text-xs text-[#6b7280]">最高</div>
          <div className="mt-1 text-xl font-semibold text-white">{props.window.bestScore}</div>
        </div>
        <div>
          <div className="text-xs text-[#6b7280]">最低</div>
          <div className="mt-1 text-xl font-semibold text-white">{props.window.lowestScore}</div>
        </div>
      </div>
    </div>
  );
}

function WeaknessTable(props: {
  title: string;
  subtitle: string;
  items: FlashcardDrillAnalyticsDimensionStat[];
  unlabeledCount: number;
}) {
  return (
    <div className="rounded-xl border border-[#27272a] bg-[#121212] p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-white">{props.title}</div>
          <div className="mt-1 text-xs text-[#9ca3af]">{props.subtitle}</div>
        </div>
        <div className="text-xs text-[#6b7280]">未标注样本 {props.unlabeledCount}</div>
      </div>

      <div className="mt-4 space-y-3">
        {props.items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[#27272a] px-4 py-6 text-center text-sm text-[#9ca3af]">
            当前窗口内暂无可聚合样本
          </div>
        ) : (
          props.items.slice(0, 6).map((item) => (
            <div
              key={item.key}
              className="rounded-lg border border-[#27272a] bg-black/20 px-4 py-3"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-medium text-white">
                  {FLASHCARD_LABELS[item.key] || item.key}
                </div>
                <div className="text-xs text-rose-300">错 {item.wrong} / {item.total}</div>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#1f2937]">
                <div
                  className="h-full rounded-full bg-[#00c2b2]"
                  style={{ width: `${Math.max(item.accuracy * 100, 6)}%` }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-[#9ca3af]">
                <span>命中率 {Math.round(item.accuracy * 100)}%</span>
                <span>错因占比 {Math.round(item.wrongRate * 100)}%</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function FlashcardDrillHistoryPage() {
  const [, errorAlert] = useAlert();

  const [status, setStatus] = React.useState<SessionStatus>("COMPLETED");
  const [items, setItems] = React.useState<FlashcardDrillSessionHistoryItem[]>([]);
  const [nextCursor, setNextCursor] = React.useState<string | null>(null);
  const [analytics, setAnalytics] = React.useState<FlashcardDrillAnalytics | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [analyticsLoading, setAnalyticsLoading] = React.useState(false);

  const fetchAnalytics = React.useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const res = await getFlashcardDrillAnalytics({ recentWindow: RECENT_WINDOW });
      setAnalytics(res);
    } catch (error) {
      errorAlert(error instanceof Error ? error.message : "获取训练成绩分析失败");
    } finally {
      setAnalyticsLoading(false);
    }
  }, [errorAlert]);

  const fetchFirstPage = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await listFlashcardDrillSessions({
        pageSize: PAGE_SIZE,
        status: status === "ALL" ? undefined : status,
      });
      setItems(res.items);
      setNextCursor(res.nextCursor);
    } catch (error) {
      errorAlert(error instanceof Error ? error.message : "查询训练成绩失败");
    } finally {
      setLoading(false);
    }
  }, [errorAlert, status]);

  const fetchMore = React.useCallback(async () => {
    if (!nextCursor) return;
    setLoadingMore(true);
    try {
      const res = await listFlashcardDrillSessions({
        pageSize: PAGE_SIZE,
        cursor: nextCursor,
        status: status === "ALL" ? undefined : status,
      });
      setItems((prev) => [...prev, ...res.items]);
      setNextCursor(res.nextCursor);
    } catch (error) {
      errorAlert(error instanceof Error ? error.message : "查询训练成绩失败");
    } finally {
      setLoadingMore(false);
    }
  }, [errorAlert, nextCursor, status]);

  React.useEffect(() => {
    void fetchAnalytics();
  }, [fetchAnalytics]);

  React.useEffect(() => {
    void fetchFirstPage();
  }, [fetchFirstPage]);

  const trendPoints = analytics?.trend.points || [];
  const maxTrendScore = trendPoints.length
    ? Math.max(...trendPoints.map((point) => point.score), 100)
    : 100;

  return (
    <TradePageShell title="训练成绩" subtitle="看全量趋势，也看最近 30 轮你具体错在哪类行为识别" showAddButton={false}>
      <div className="w-full space-y-4">
        <div className="grid gap-3 md:grid-cols-4">
          <OverviewCard
            label="已完成轮次（全量）"
            value={analytics?.summary.totalCompletedSessions ?? "-"}
            hint="不再受当前分页加载数量影响"
          />
          <OverviewCard
            label="平均分（全量）"
            value={analytics?.summary.averageScore ?? "-"}
            hint="全部已完成训练会话"
          />
          <OverviewCard
            label="最高分（全量）"
            value={analytics?.summary.bestScore ?? "-"}
            hint="完整历史最高记录"
          />
          <OverviewCard
            label="最近一轮"
            value={
              analytics
                ? `${analytics.summary.recentScore} / ${Math.round(
                    analytics.summary.recentAccuracy * 100,
                  )}%`
                : "-"
            }
            hint="分数 / 正确率"
          />
        </div>

        <div className="grid gap-3 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-xl border border-[#27272a] bg-[#121212] p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-white">最近 {RECENT_WINDOW} 轮分数走势</div>
                <div className="mt-1 text-xs text-[#9ca3af]">
                  以最近 {analytics?.weaknesses.basedOnCompletedSessions ?? 0} 个已完成会话计算
                </div>
              </div>
              {analyticsLoading ? <div className="text-xs text-[#9ca3af]">加载中...</div> : null}
            </div>

            {trendPoints.length === 0 ? (
              <div className="mt-4 rounded-lg border border-dashed border-[#27272a] px-4 py-10 text-center text-sm text-[#9ca3af]">
                暂无可展示的成绩趋势
              </div>
            ) : (
              <div className="mt-4">
                <div className="flex h-48 items-end gap-2">
                  {trendPoints.map((point, index) => {
                    const height = Math.max((point.score / maxTrendScore) * 100, 8);
                    return (
                      <div key={point.sessionId} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                        <div className="text-[10px] text-[#9ca3af]">{point.score}</div>
                        <div className="flex h-36 w-full items-end">
                          <div
                            className="w-full rounded-t-md bg-gradient-to-t from-[#00c2b2] to-[#0ea5e9]"
                            style={{ height: `${height}%` }}
                            title={`${format(new Date(point.startedAt), "MM-dd HH:mm")} · ${point.score} 分`}
                          />
                        </div>
                        <div className="text-[10px] text-[#6b7280]">
                          {index === 0 || index === trendPoints.length - 1
                            ? format(new Date(point.startedAt), "MM-dd")
                            : ""}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-3">
            <WindowCard
              title="最近 7 轮"
              window={
                analytics?.windows.recent7 || {
                  sampleSize: 0,
                  averageScore: 0,
                  bestScore: 0,
                  lowestScore: 0,
                  deltaFromPrevious: null,
                }
              }
            />
            <WindowCard
              title="最近 30 轮"
              window={
                analytics?.windows.recent30 || {
                  sampleSize: 0,
                  averageScore: 0,
                  bestScore: 0,
                  lowestScore: 0,
                  deltaFromPrevious: null,
                }
              }
            />
          </div>
        </div>

        <div className="grid gap-3 xl:grid-cols-2">
          <WeaknessTable
            title="最近 30 轮薄弱行为识别"
            subtitle="按 behaviorType 聚合命中率，优先把高错题量且命中率低的模式顶上来"
            items={analytics?.weaknesses.behaviorTypes || []}
            unlabeledCount={analytics?.weaknesses.unlabeledBehaviorAttemptCount || 0}
          />
          <WeaknessTable
            title="最近 30 轮失效逻辑误判"
            subtitle="按 invalidationType 聚合错题分布，定位你最容易理解偏差的失效框架"
            items={analytics?.weaknesses.invalidationTypes || []}
            unlabeledCount={analytics?.weaknesses.unlabeledInvalidationAttemptCount || 0}
          />
        </div>

        <div className="rounded-xl border border-[#27272a] bg-[#121212] p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm text-[#e5e7eb]">会话列表（按开始时间倒序）</div>
              <div className="mt-1 text-xs text-[#9ca3af]">列表继续保留分页；顶部分析使用独立全量聚合口径</div>
            </div>
            <Select value={status} onValueChange={(v) => setStatus(v as SessionStatus)}>
              <SelectTrigger className="h-9 w-[180px] border border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border border-[#27272a] bg-[#121212] text-[#e5e7eb]">
                <SelectItem value="ALL">全部状态</SelectItem>
                <SelectItem value="COMPLETED">仅已完成</SelectItem>
                <SelectItem value="IN_PROGRESS">仅进行中</SelectItem>
                <SelectItem value="ABANDONED">仅中断</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto rounded-lg border border-[#27272a]">
            <Table className="min-w-[980px]">
              <TableHeader>
                <TableRow className="border-b border-[#27272a] bg-black/20">
                  <TableHead className="text-xs uppercase text-[#9ca3af]">时间</TableHead>
                  <TableHead className="text-xs uppercase text-[#9ca3af]">题源</TableHead>
                  <TableHead className="text-xs uppercase text-[#9ca3af]">分数</TableHead>
                  <TableHead className="text-xs uppercase text-[#9ca3af]">正确率</TableHead>
                  <TableHead className="text-xs uppercase text-[#9ca3af]">正确/错误</TableHead>
                  <TableHead className="text-xs uppercase text-[#9ca3af]">作答进度</TableHead>
                  <TableHead className="text-xs uppercase text-[#9ca3af]">状态</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-[#9ca3af]">
                      加载中...
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-[#9ca3af]">
                      暂无训练记录
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item.sessionId} className="border-b border-[#27272a] hover:bg-[#1e1e1e]">
                      <TableCell className="min-w-[210px] text-sm text-[#e5e7eb]">
                        <div>开始：{format(new Date(item.startedAt), "yyyy-MM-dd HH:mm")}</div>
                        <div className="text-xs text-[#9ca3af]">
                          结束：{item.endedAt ? format(new Date(item.endedAt), "yyyy-MM-dd HH:mm") : "-"}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-[#e5e7eb]">{FLASHCARD_LABELS[item.source]}</TableCell>
                      <TableCell className="text-sm font-semibold text-[#00c2b2]">{item.score}</TableCell>
                      <TableCell className="text-sm text-[#e5e7eb]">{Math.round(item.accuracy * 100)}%</TableCell>
                      <TableCell className="text-sm text-[#e5e7eb]">
                        {item.correct} / {item.wrong}
                      </TableCell>
                      <TableCell className="text-sm text-[#e5e7eb]">
                        {item.answered} / {item.total}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
                            item.status === "COMPLETED"
                              ? "border-emerald-400/30 bg-emerald-400/15 text-emerald-300"
                              : item.status === "IN_PROGRESS"
                                ? "border-sky-400/30 bg-sky-400/15 text-sky-300"
                                : "border-amber-400/30 bg-amber-400/15 text-amber-300"
                          }`}
                        >
                          {item.status === "COMPLETED"
                            ? "已完成"
                            : item.status === "IN_PROGRESS"
                              ? "进行中"
                              : "已中断"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              className="border-[#27272a] bg-transparent text-[#e5e7eb] hover:bg-[#1e1e1e]"
              disabled={!nextCursor || loadingMore || loading}
              onClick={() => void fetchMore()}
            >
              {loadingMore ? "加载中..." : nextCursor ? "加载更多" : "没有更多数据"}
            </Button>
          </div>
        </div>
      </div>
    </TradePageShell>
  );
}
