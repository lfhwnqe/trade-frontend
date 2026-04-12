"use client";

import React from "react";
import Link from "next/link";
import TradePageShell from "../../../components/trade-page-shell";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiSelectDropdown } from "@/components/common/MultiSelectDropdown";
import { useAlert } from "@/components/common/alert";
import { fetchMistakeTypeOptions, fetchPlaybookTypeOptions } from "@/app/trade/dictionary";
import { listMistakeRecords } from "../../request";
import { FLASHCARD_LABELS, type MistakeRecord, type MistakeDomain, type MistakeReviewStatus, type MistakeSourceType } from "../../types";

const EMPTY = "__ALL__";
const PAGE_SIZE = 20;
const DOMAIN_OPTIONS: MistakeDomain[] = ["RECOGNITION", "TRIGGER_TIMING", "RISK_FRAMEWORK", "CONTEXT_FILTER", "EXECUTION"];
const SOURCE_OPTIONS: MistakeSourceType[] = ["FLASHCARD_SIMULATION", "TRADE_FLASHCARD"];
const REVIEW_OPTIONS: MistakeReviewStatus[] = ["NEW", "CLASSIFIED", "IN_TRAINING", "IMPROVED", "ARCHIVED"];

function formatDateTime(value?: string) {
  if (!value) return "--";
  return new Date(value).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MistakeRecordsPage() {
  const [, errorAlert] = useAlert();
  const [items, setItems] = React.useState<MistakeRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [nextCursor, setNextCursor] = React.useState<string | null>(null);
  const [totalCount, setTotalCount] = React.useState(0);
  const [sourceType, setSourceType] = React.useState<MistakeSourceType | "">("");
  const [mistakeDomain, setMistakeDomain] = React.useState<MistakeDomain | "">("");
  const [reviewStatus, setReviewStatus] = React.useState<MistakeReviewStatus | "">("");
  const [playbookType, setPlaybookType] = React.useState("");
  const [selectedMistakeCodes, setSelectedMistakeCodes] = React.useState<string[]>([]);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [mistakeTypeOptions, setMistakeTypeOptions] = React.useState<Array<{ code: string; label: string; color?: string }>>([]);
  const [playbookTypeOptions, setPlaybookTypeOptions] = React.useState<Array<{ code: string; label: string; color?: string }>>([]);

  const loadRecords = React.useCallback(async (reset: boolean, cursor?: string | null) => {
    if (reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    try {
      const primaryMistakeCode = selectedMistakeCodes[0] || undefined;
      const res = await listMistakeRecords({
        pageSize: PAGE_SIZE,
        cursor: reset ? undefined : cursor || undefined,
        sourceType: sourceType || undefined,
        primaryMistakeCode,
        mistakeDomain: mistakeDomain || undefined,
        playbookType: playbookType || undefined,
        reviewStatus: reviewStatus || undefined,
      });
      const filteredItems = selectedMistakeCodes.length <= 1
        ? res.items
        : res.items.filter((item) => selectedMistakeCodes.every((code) => item.mistakeCodes.includes(code)));
      setItems((prev) => (reset ? filteredItems : [...prev, ...filteredItems]));
      setTotalCount(reset ? res.totalCount : res.totalCount);
      setNextCursor(res.nextCursor);
      if (reset) setExpandedId(filteredItems[0]?.mistakeRecordId || null);
    } catch (error) {
      errorAlert(error instanceof Error ? error.message : "获取误判记录失败");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [errorAlert, mistakeDomain, playbookType, reviewStatus, selectedMistakeCodes, sourceType]);

  React.useEffect(() => {
    let mounted = true;
    fetchMistakeTypeOptions().then((res) => mounted && setMistakeTypeOptions(res)).catch(() => mounted && setMistakeTypeOptions([]));
    fetchPlaybookTypeOptions().then((res) => mounted && setPlaybookTypeOptions(res)).catch(() => mounted && setPlaybookTypeOptions([]));
    return () => { mounted = false; };
  }, []);

  React.useEffect(() => {
    void loadRecords(true);
  }, [loadRecords]);

  const mistakeLabelMap = React.useMemo(() => new Map(mistakeTypeOptions.map((item) => [item.code, item])), [mistakeTypeOptions]);
  const playbookLabelMap = React.useMemo(() => new Map(playbookTypeOptions.map((item) => [item.code, item])), [playbookTypeOptions]);

  return (
    <TradePageShell title="Mistake Records" subtitle="集中查看 Simulation 沉淀下来的误判记录，并按错误类型快速回查" showAddButton={false}>
      <div className="space-y-6">
        <div className="rounded-xl border border-[#27272a] bg-[#121212] p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-sm font-medium text-[#e5e7eb]">误判记录筛选</div>
              <div className="mt-1 text-xs text-[#9ca3af]">首版支持来源、错误域、主错误类型、剧本与 review status 过滤。当前主要承接 Simulation failure 自动落库的数据。</div>
            </div>
            <Link href="/trade/flashcard/simulation/play">
              <Button variant="outline" className="border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb] hover:bg-[#242424]">回到 Simulation</Button>
            </Link>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div className="space-y-2">
              <div className="text-xs text-[#9ca3af]">来源</div>
              <Select value={sourceType || EMPTY} onValueChange={(value) => setSourceType(value === EMPTY ? "" : (value as MistakeSourceType))}>
                <SelectTrigger className="border-[#27272a] bg-[#18181b] text-[#e5e7eb]"><SelectValue placeholder="全部来源" /></SelectTrigger>
                <SelectContent className="border-[#27272a] bg-[#121212] text-[#e5e7eb]">
                  <SelectItem value={EMPTY}>全部来源</SelectItem>
                  {SOURCE_OPTIONS.map((item) => <SelectItem key={item} value={item}>{FLASHCARD_LABELS[item]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="text-xs text-[#9ca3af]">错误域</div>
              <Select value={mistakeDomain || EMPTY} onValueChange={(value) => setMistakeDomain(value === EMPTY ? "" : (value as MistakeDomain))}>
                <SelectTrigger className="border-[#27272a] bg-[#18181b] text-[#e5e7eb]"><SelectValue placeholder="全部错误域" /></SelectTrigger>
                <SelectContent className="border-[#27272a] bg-[#121212] text-[#e5e7eb]">
                  <SelectItem value={EMPTY}>全部错误域</SelectItem>
                  {DOMAIN_OPTIONS.map((item) => <SelectItem key={item} value={item}>{FLASHCARD_LABELS[item]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="text-xs text-[#9ca3af]">误判类型</div>
              <MultiSelectDropdown
                options={mistakeTypeOptions.map((item) => ({ value: item.code, label: item.label, color: item.color }))}
                value={selectedMistakeCodes}
                onChange={setSelectedMistakeCodes}
                placeholder="全部误判类型"
                emptyText="暂无可用 mistake_type"
                className="border-[#27272a] bg-[#18181b] text-[#e5e7eb] hover:bg-[#242424]"
                contentClassName="border-[#27272a] bg-[#121212] text-[#e5e7eb]"
              />
            </div>

            <div className="space-y-2">
              <div className="text-xs text-[#9ca3af]">剧本</div>
              <Select value={playbookType || EMPTY} onValueChange={(value) => setPlaybookType(value === EMPTY ? "" : value)}>
                <SelectTrigger className="border-[#27272a] bg-[#18181b] text-[#e5e7eb]"><SelectValue placeholder="全部剧本" /></SelectTrigger>
                <SelectContent className="border-[#27272a] bg-[#121212] text-[#e5e7eb]">
                  <SelectItem value={EMPTY}>全部剧本</SelectItem>
                  {playbookTypeOptions.map((item) => <SelectItem key={item.code} value={item.code}>{item.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="text-xs text-[#9ca3af]">状态</div>
              <Select value={reviewStatus || EMPTY} onValueChange={(value) => setReviewStatus(value === EMPTY ? "" : (value as MistakeReviewStatus))}>
                <SelectTrigger className="border-[#27272a] bg-[#18181b] text-[#e5e7eb]"><SelectValue placeholder="全部状态" /></SelectTrigger>
                <SelectContent className="border-[#27272a] bg-[#121212] text-[#e5e7eb]">
                  <SelectItem value={EMPTY}>全部状态</SelectItem>
                  {REVIEW_OPTIONS.map((item) => <SelectItem key={item} value={item}>{FLASHCARD_LABELS[item]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3 text-sm text-[#9ca3af]">
            <span>当前记录数：{totalCount}</span>
            {selectedMistakeCodes.length > 1 ? <span>已启用前端多标签交集过滤</span> : null}
          </div>
        </div>

        {loading ? (
          <div className="rounded-xl border border-[#27272a] bg-[#121212] p-6 text-sm text-[#9ca3af]">正在加载误判记录...</div>
        ) : !items.length ? (
          <div className="rounded-xl border border-dashed border-[#27272a] bg-[#121212] p-6 text-sm text-[#9ca3af]">当前筛选下还没有误判记录。</div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => {
              const expanded = expandedId === item.mistakeRecordId;
              const primary = mistakeLabelMap.get(item.primaryMistakeCode);
              return (
                <div key={item.mistakeRecordId} className="rounded-xl border border-[#27272a] bg-[#121212] p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-sm font-medium text-[#e5e7eb]">{primary?.label || item.primaryMistakeCode}</div>
                        <span className="rounded-full border border-[#3f3f46] px-2 py-1 text-[11px] text-[#d4d4d8]">{FLASHCARD_LABELS[item.sourceType]}</span>
                        <span className="rounded-full border border-[#3f3f46] px-2 py-1 text-[11px] text-[#d4d4d8]">{FLASHCARD_LABELS[item.mistakeDomain]}</span>
                        <span className="rounded-full border border-[#3f3f46] px-2 py-1 text-[11px] text-[#d4d4d8]">{FLASHCARD_LABELS[item.reviewStatus]}</span>
                      </div>
                      <div className="text-xs text-[#9ca3af]">创建时间 {formatDateTime(item.createdAt)} · sourceId {item.sourceId}</div>
                      <div className="flex flex-wrap gap-2 text-xs text-[#cbd5e1]">
                        <span>剧本：{playbookLabelMap.get(item.playbookType || "")?.label || item.playbookType || "--"}</span>
                        <span>卡片：{item.cardId ? item.cardId.slice(0, 8) : "--"}</span>
                        <span>attempt：{item.simulationAttemptId ? item.simulationAttemptId.slice(0, 8) : "--"}</span>
                      </div>
                    </div>
                    <Button type="button" variant="outline" className="border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb] hover:bg-[#242424]" onClick={() => setExpandedId((prev) => prev === item.mistakeRecordId ? null : item.mistakeRecordId)}>
                      {expanded ? "收起" : "展开详情"}
                    </Button>
                  </div>

                  {expanded ? (
                    <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr]">
                      <div className="space-y-4">
                        <div className="rounded-lg border border-[#27272a] bg-[#18181b] p-4">
                          <div className="text-xs text-[#9ca3af]">主误判类型</div>
                          <div className="mt-2 text-sm text-[#e5e7eb]">{primary?.label || item.primaryMistakeCode}</div>
                        </div>
                        <div className="rounded-lg border border-[#27272a] bg-[#18181b] p-4">
                          <div className="text-xs text-[#9ca3af]">附加误判标签</div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {item.mistakeCodes.map((code) => {
                              const detail = mistakeLabelMap.get(code);
                              return <span key={code} className="rounded-full border border-[#3f3f46] px-2 py-1 text-[11px] text-[#d4d4d8]">{detail?.label || code}</span>;
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="rounded-lg border border-[#27272a] bg-[#18181b] p-4">
                          <div className="text-xs text-[#9ca3af]">纠正说明</div>
                          <div className="mt-2 whitespace-pre-wrap text-sm text-[#e5e7eb]">{item.correctionNote?.trim() || "--"}</div>
                        </div>
                        <div className="rounded-lg border border-[#27272a] bg-[#18181b] p-4">
                          <div className="text-xs text-[#9ca3af]">备注</div>
                          <div className="mt-2 whitespace-pre-wrap text-sm text-[#e5e7eb]">{item.note?.trim() || "--"}</div>
                        </div>
                        <div className="rounded-lg border border-[#27272a] bg-[#18181b] p-4">
                          <div className="text-xs text-[#9ca3af]">来源上下文</div>
                          <div className="mt-2 space-y-2 text-sm text-[#e5e7eb]">
                            <div>sourceType：{FLASHCARD_LABELS[item.sourceType]}</div>
                            <div>sourceId：{item.sourceId}</div>
                            <div>simulationAttemptId：{item.simulationAttemptId || "--"}</div>
                            <div>tagCodes：{item.tagCodes?.length ? item.tagCodes.join("、") : "--"}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}

            {nextCursor ? (
              <div className="flex justify-center">
                <Button onClick={() => void loadRecords(false, nextCursor)} disabled={loadingMore} variant="outline" className="border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb] hover:bg-[#242424]">
                  {loadingMore ? "加载中..." : "加载更多"}
                </Button>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </TradePageShell>
  );
}
