"use client";

import React from "react";
import Link from "next/link";
import TradePageShell from "../../components/trade-page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAlert } from "@/components/common/alert";
import { fetchPlaybookTypeOptions } from "../../dictionary";
import { listPracticalFlashcardCards } from "../request";
import { PRACTICAL_FLASHCARD_LABELS, type PracticalFlashcardCard } from "../types";

export default function PracticalFlashcardManagePage() {
  const [, errorAlert] = useAlert();
  const [items, setItems] = React.useState<PracticalFlashcardCard[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);
  const [symbolPairInfo, setSymbolPairInfo] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [playbookTypeOptions, setPlaybookTypeOptions] = React.useState<Array<{ code: string; label: string }>>([]);

  const playbookLabelMap = React.useMemo(() => new Map(playbookTypeOptions.map((item) => [item.code, item.label])), [playbookTypeOptions]);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await listPracticalFlashcardCards({
        pageSize: 50,
        symbolPairInfo: symbolPairInfo.trim() || undefined,
      });
      setItems(res.items);
      setTotalCount(res.totalCount);
    } catch (error) {
      errorAlert(error instanceof Error ? error.message : "查询失败");
    } finally {
      setLoading(false);
    }
  }, [errorAlert, symbolPairInfo]);

  React.useEffect(() => {
    fetchPlaybookTypeOptions().then(setPlaybookTypeOptions).catch(() => setPlaybookTypeOptions([]));
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <TradePageShell title="实操闪卡管理" subtitle="查看已冻结行情快照的实操闪卡" showAddButton={false}>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 rounded-xl border border-[#27272a] bg-[#121212] p-4 md:flex-row md:items-end md:justify-between">
          <label className="space-y-2">
            <span className="text-sm font-medium text-[#d4d4d8]">交易对筛选</span>
            <Input value={symbolPairInfo} onChange={(e) => setSymbolPairInfo(e.target.value)} placeholder="BTCUSDT" className="h-9 border border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb] md:w-64" />
          </label>
          <div className="flex gap-2">
            <Button onClick={load} disabled={loading} variant="secondary" className="border border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb] hover:bg-[#27272a]">
              {loading ? "刷新中..." : "刷新"}
            </Button>
            <Button asChild className="bg-[#00c2b2] text-black hover:bg-[#009e91]">
              <Link href="/trade/practical-flashcard/create" prefetch={false}>新建实操闪卡</Link>
            </Button>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-[#27272a] bg-[#121212]">
          <div className="border-b border-[#27272a] px-4 py-3 text-sm text-[#a1a1aa]">
            共 {totalCount} 张
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[#18181b] text-left text-[#a1a1aa]">
                <tr>
                  <th className="px-4 py-3 font-medium">交易对</th>
                  <th className="px-4 py-3 font-medium">剧本</th>
                  <th className="px-4 py-3 font-medium">行情源</th>
                  <th className="px-4 py-3 font-medium">时间范围</th>
                  <th className="px-4 py-3 font-medium">K 线数</th>
                  <th className="px-4 py-3 font-medium">状态</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td className="px-4 py-8 text-center text-[#71717a]" colSpan={6}>加载中...</td></tr>
                ) : items.length === 0 ? (
                  <tr><td className="px-4 py-8 text-center text-[#71717a]" colSpan={6}>暂无实操闪卡</td></tr>
                ) : items.map((item) => (
                  <tr key={item.cardId} className="border-t border-[#27272a] text-[#e5e7eb]">
                    <td className="px-4 py-3 font-medium">{item.symbolPairInfo}</td>
                    <td className="px-4 py-3">{playbookLabelMap.get(item.playbookType) || item.playbookType}</td>
                    <td className="px-4 py-3">{PRACTICAL_FLASHCARD_LABELS[item.venue] || item.venue}</td>
                    <td className="px-4 py-3 text-[#a1a1aa]">
                      {item.entryTimeInfo} {"->"} {item.exitTimeInfo}
                    </td>
                    <td className="px-4 py-3">{item.candles.length}</td>
                    <td className="px-4 py-3">{PRACTICAL_FLASHCARD_LABELS[item.status] || item.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </TradePageShell>
  );
}
