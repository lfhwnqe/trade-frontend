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
import { listFlashcardDrillSessions } from "../../request";
import { FLASHCARD_LABELS, type FlashcardDrillSessionHistoryItem } from "../../types";

type SessionStatus = "ALL" | "IN_PROGRESS" | "COMPLETED" | "ABANDONED";

const PAGE_SIZE = 20;

export default function FlashcardDrillHistoryPage() {
  const [, errorAlert] = useAlert();

  const [status, setStatus] = React.useState<SessionStatus>("COMPLETED");
  const [items, setItems] = React.useState<FlashcardDrillSessionHistoryItem[]>([]);
  const [nextCursor, setNextCursor] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);

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
    void fetchFirstPage();
  }, [fetchFirstPage, status]);

  const completedItems = items.filter((item) => item.status === "COMPLETED");
  const avgScore =
    completedItems.length > 0
      ? Math.round(
          completedItems.reduce((sum, item) => sum + item.score, 0) /
            completedItems.length,
        )
      : 0;
  const bestScore =
    completedItems.length > 0
      ? Math.max(...completedItems.map((item) => item.score))
      : 0;
  const recentScore = completedItems[0]?.score ?? 0;

  return (
    <TradePageShell title="训练成绩" subtitle="按轮次回看最终得分与统计" showAddButton={false}>
      <div className="w-full space-y-4">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-xl border border-[#27272a] bg-[#121212] p-4 shadow-sm">
            <div className="text-xs text-[#9ca3af]">已完成轮次</div>
            <div className="mt-1 text-2xl font-semibold text-white">{completedItems.length}</div>
          </div>
          <div className="rounded-xl border border-[#27272a] bg-[#121212] p-4 shadow-sm">
            <div className="text-xs text-[#9ca3af]">平均分（已加载）</div>
            <div className="mt-1 text-2xl font-semibold text-white">{avgScore}</div>
          </div>
          <div className="rounded-xl border border-[#27272a] bg-[#121212] p-4 shadow-sm">
            <div className="text-xs text-[#9ca3af]">最高分（已加载）</div>
            <div className="mt-1 text-2xl font-semibold text-white">{bestScore}</div>
          </div>
          <div className="rounded-xl border border-[#27272a] bg-[#121212] p-4 shadow-sm">
            <div className="text-xs text-[#9ca3af]">最近一轮分数</div>
            <div className="mt-1 text-2xl font-semibold text-white">{recentScore}</div>
          </div>
        </div>

        <div className="rounded-xl border border-[#27272a] bg-[#121212] p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-[#9ca3af]">会话列表（按开始时间倒序）</div>
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

          <div className="overflow-x-auto border border-[#27272a] rounded-lg">
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
                    <TableCell colSpan={7} className="h-24 text-center text-[#9ca3af]">加载中...</TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-[#9ca3af]">暂无训练记录</TableCell>
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
                      <TableCell className="text-sm text-[#00c2b2] font-semibold">{item.score}</TableCell>
                      <TableCell className="text-sm text-[#e5e7eb]">{Math.round(item.accuracy * 100)}%</TableCell>
                      <TableCell className="text-sm text-[#e5e7eb]">{item.correct} / {item.wrong}</TableCell>
                      <TableCell className="text-sm text-[#e5e7eb]">{item.answered} / {item.total}</TableCell>
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
