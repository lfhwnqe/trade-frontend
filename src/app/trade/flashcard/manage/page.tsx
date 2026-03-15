"use client";

import * as React from "react";
import { ColumnDef, RowSelectionState, SortingState } from "@tanstack/react-table";
import TradePageShell from "../../components/trade-page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/common/DataTable";
import { DateCalendarPicker } from "@/components/common/DateCalendarPicker";
import { ImageUploader } from "@/components/common/ImageUploader";
import { useAlert } from "@/components/common/alert";
import {
  deleteFlashcardCard,
  listFlashcardCards,
  updateFlashcardCard,
} from "../request";
import {
  FLASHCARD_BEHAVIOR_SELECT_OPTION_GROUPS,
  FLASHCARD_CARD_SORT_BYS,
  FLASHCARD_CARD_SORT_ORDERS,
  FLASHCARD_DIRECTIONS,
  FLASHCARD_INVALIDATION_SELECT_OPTION_GROUPS,
  FLASHCARD_LABELS,
  FLASHCARD_SYSTEM_OUTCOME_TYPES,
  isLegacyFlashcardBehaviorType,
  isLegacyFlashcardInvalidationType,
  type FlashcardAction,
  type FlashcardBehaviorType,
  type FlashcardCard,
  type FlashcardCardSortBy,
  type FlashcardCardSortOrder,
  type FlashcardInvalidationType,
  type FlashcardSystemOutcomeType,
} from "../types";
import { ImagePreviewDialog } from "../components/ImagePreviewDialog";
import type { ImageResource } from "../../config";
import { TRADE_PERIOD_PRESETS } from "../../config";
import { FlashcardFieldGuide } from "../components/FlashcardFieldGuide";

type FlashcardQuery = {
  symbolPairInfo: string;
  marketTimeInfo: string;
  sortBy: FlashcardCardSortBy;
  sortOrder: FlashcardCardSortOrder;
};

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

function HoverText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={className}>{text}</div>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs whitespace-pre-wrap break-words border border-[#27272a] bg-[#111827] px-3 py-2 text-xs leading-relaxed text-[#e5e7eb]">
        {text}
      </TooltipContent>
    </Tooltip>
  );
}

const SYMBOL_PAIR_HISTORY_KEY = "flashcard-symbol-pair-history";
const EMPTY_SELECT_VALUE = "__NONE__";

export default function FlashcardManagePage() {
  const [successAlert, errorAlert] = useAlert();

  const [items, setItems] = React.useState<FlashcardCard[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [viewingCard, setViewingCard] = React.useState<FlashcardCard | null>(null);
  const [editingCard, setEditingCard] = React.useState<FlashcardCard | null>(null);
  const [editingQuestionImages, setEditingQuestionImages] = React.useState<ImageResource[]>([]);
  const [editingAnswerImages, setEditingAnswerImages] = React.useState<ImageResource[]>([]);
  const [editingExpectedAction, setEditingExpectedAction] = React.useState<FlashcardAction | "">(
    "",
  );
  const [editingBehaviorType, setEditingBehaviorType] = React.useState<
    FlashcardBehaviorType | ""
  >("");
  const [editingInvalidationType, setEditingInvalidationType] = React.useState<
    FlashcardInvalidationType | ""
  >("");
  const [editingSystemOutcomeType, setEditingSystemOutcomeType] = React.useState<
    FlashcardSystemOutcomeType | ""
  >("");
  const [editingEarlyExitTag, setEditingEarlyExitTag] = React.useState(false);
  const [editingEarlyExitReason, setEditingEarlyExitReason] = React.useState("");
  const [editingEarlyExitImages, setEditingEarlyExitImages] = React.useState<ImageResource[]>([]);
  const [editingMarketTimeInfo, setEditingMarketTimeInfo] = React.useState("");
  const [editingSymbolPairInfo, setEditingSymbolPairInfo] = React.useState("");
  const [editingNote, setEditingNote] = React.useState("");
  const [savingNote, setSavingNote] = React.useState(false);
  const [symbolPairOptions, setSymbolPairOptions] = React.useState<string[]>([
    ...TRADE_PERIOD_PRESETS,
  ]);

  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);
  const [totalItems, setTotalItems] = React.useState(1);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  const [queryForm, setQueryForm] = React.useState<FlashcardQuery>({
    symbolPairInfo: "",
    marketTimeInfo: "",
    sortBy: "CREATED_AT",
    sortOrder: "desc",
  });
  const [activeQuery, setActiveQuery] = React.useState<FlashcardQuery>({
    symbolPairInfo: "",
    marketTimeInfo: "",
    sortBy: "CREATED_AT",
    sortOrder: "desc",
  });

  // page N 的起始 cursor 存在 index N-1；只放 ref，避免触发 useEffect 循环
  const cursorStackRef = React.useRef<(string | undefined)[]>([undefined]);

  const fetchPage = React.useCallback(
    async (
      targetPage: number,
      query: FlashcardQuery,
      opts?: { resetCursor?: boolean },
    ) => {
      const resetCursor = opts?.resetCursor === true;

      setLoading(true);
      try {
        const cursor = resetCursor
          ? undefined
          : cursorStackRef.current[targetPage - 1];

        const res = await listFlashcardCards({
          pageSize,
          cursor,
          symbolPairInfo: query.symbolPairInfo.trim() || undefined,
          marketTimeInfo: query.marketTimeInfo.trim() || undefined,
          sortBy: query.sortBy,
          sortOrder: query.sortOrder,
        });

        setItems(res.items);
        setPage(targetPage);
        setTotalItems(Math.max(res.totalCount, 0));

        if (resetCursor) {
          cursorStackRef.current = [undefined, res.nextCursor || undefined];
        } else {
          const nextStack = [...cursorStackRef.current];
          if (res.nextCursor) {
            nextStack[targetPage] = res.nextCursor;
          } else {
            nextStack.length = targetPage;
          }
          cursorStackRef.current = nextStack;
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : "查询失败";
        errorAlert(msg);
      } finally {
        setLoading(false);
      }
    },
    [errorAlert, pageSize],
  );

  React.useEffect(() => {
    void fetchPage(1, activeQuery, { resetCursor: true });
  }, [activeQuery, fetchPage]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(SYMBOL_PAIR_HISTORY_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return;
      const history = parsed
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean);
      setSymbolPairOptions(Array.from(new Set([...TRADE_PERIOD_PRESETS, ...history])));
    } catch {}
  }, []);

  const rememberSymbolPair = React.useCallback((value: string) => {
    const nextValue = value.trim();
    if (!nextValue || typeof window === "undefined") return;

    setSymbolPairOptions((prev) => {
      const merged = Array.from(
        new Set([nextValue, ...prev, ...TRADE_PERIOD_PRESETS]),
      ).slice(0, 20);
      window.localStorage.setItem(SYMBOL_PAIR_HISTORY_KEY, JSON.stringify(merged));
      return merged;
    });
  }, []);

  const handleQuerySubmit = React.useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setActiveQuery({ ...queryForm });
      cursorStackRef.current = [undefined];
      setRowSelection({});
      setSorting([]);
    },
    [queryForm],
  );

  const handleQueryReset = React.useCallback(() => {
    const emptyQuery = { symbolPairInfo: "", marketTimeInfo: "", sortBy: "CREATED_AT" as FlashcardCardSortBy, sortOrder: "desc" as FlashcardCardSortOrder };
    setQueryForm(emptyQuery);
    setActiveQuery(emptyQuery);
    cursorStackRef.current = [undefined];
    setRowSelection({});
    setSorting([]);
  }, []);

  const openViewDialog = React.useCallback((card: FlashcardCard) => {
    setViewingCard(card);
  }, []);

  const openNoteDialog = React.useCallback((card: FlashcardCard) => {
    setEditingCard(card);
    setEditingQuestionImages(
      card.questionImageUrl
        ? [{ key: `${card.cardId}-question`, url: card.questionImageUrl }]
        : [],
    );
    setEditingAnswerImages(
      card.answerImageUrl
        ? [{ key: `${card.cardId}-answer`, url: card.answerImageUrl }]
        : [],
    );
    setEditingExpectedAction(card.expectedAction || card.direction || "NO_TRADE");
    setEditingBehaviorType(card.behaviorType || "");
    setEditingInvalidationType(card.invalidationType || "");
    setEditingSystemOutcomeType(card.systemOutcomeType || "");
    setEditingEarlyExitTag(card.earlyExitTag === true);
    setEditingEarlyExitReason(card.earlyExitReason || "");
    setEditingEarlyExitImages(
      (card.earlyExitImageUrls || []).map((url, index) => ({
        key: `${card.cardId}-early-exit-${index}`,
        url,
      })),
    );
    setEditingMarketTimeInfo(card.marketTimeInfo || "");
    setEditingSymbolPairInfo(card.symbolPairInfo || "");
    setEditingNote(card.notes || "");
  }, []);

  const handleSaveNote = React.useCallback(async () => {
    if (!editingCard) return;
    if (!editingExpectedAction || !editingQuestionImages[0]?.url || !editingAnswerImages[0]?.url) {
      errorAlert("请补全入场前截图、入场后截图和标准动作");
      return;
    }

    if (editingEarlyExitTag && !editingEarlyExitReason.trim()) {
      errorAlert("如果标记为提前离场，请填写提前离场原因");
      return;
    }

    setSavingNote(true);
    try {
      const updated = await updateFlashcardCard(editingCard.cardId, {
        questionImageUrl: editingQuestionImages[0].url,
        answerImageUrl: editingAnswerImages[0].url,
        expectedAction: editingExpectedAction,
        behaviorType: editingBehaviorType || undefined,
        invalidationType: editingInvalidationType || undefined,
        systemOutcomeType: editingSystemOutcomeType || undefined,
        earlyExitTag: editingEarlyExitTag,
        earlyExitReason: editingEarlyExitTag
          ? editingEarlyExitReason.trim() || undefined
          : undefined,
        earlyExitImageUrls: editingEarlyExitTag
          ? editingEarlyExitImages.map((item) => item.url).filter(Boolean)
          : undefined,
        marketTimeInfo: editingMarketTimeInfo.trim() || undefined,
        symbolPairInfo: editingSymbolPairInfo.trim() || undefined,
        notes: editingNote.trim() || undefined,
      });
      rememberSymbolPair(editingSymbolPairInfo);
      setItems((prev) =>
        prev.map((item) => (item.cardId === updated.cardId ? { ...item, ...updated } : item)),
      );
      setEditingCard(null);
      successAlert("闪卡信息已保存");
    } catch (error) {
      errorAlert(error instanceof Error ? error.message : "保存闪卡失败");
    } finally {
      setSavingNote(false);
    }
  }, [
    editingAnswerImages,
    editingBehaviorType,
    editingCard,
    editingEarlyExitImages,
    editingEarlyExitReason,
    editingEarlyExitTag,
    editingExpectedAction,
    editingInvalidationType,
    editingSystemOutcomeType,
    editingMarketTimeInfo,
    editingNote,
    editingQuestionImages,
    editingSymbolPairInfo,
    errorAlert,
    rememberSymbolPair,
    successAlert,
  ]);

  const handleDeleteCard = React.useCallback(
    async (card: FlashcardCard) => {
      const confirmed = window.confirm("确认删除这张闪卡吗？删除后不可恢复。");
      if (!confirmed) return;

      try {
        await deleteFlashcardCard(card.cardId);
        setItems((prev) => prev.filter((item) => item.cardId !== card.cardId));
        setTotalItems((prev) => Math.max(1, prev - 1));
        successAlert("闪卡已删除");
      } catch (error) {
        errorAlert(error instanceof Error ? error.message : "删除闪卡失败");
      }
    },
    [errorAlert, successAlert],
  );

  const columns = React.useMemo<ColumnDef<FlashcardCard>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="选择所有"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="选择行"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "questionImageUrl",
        header: "题目图",
        cell: ({ row }) => (
          <button type="button" onClick={() => setPreviewUrl(row.original.questionImageUrl)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={row.original.questionImageUrl}
              alt="question"
              className="h-14 w-20 rounded object-cover border border-[#27272a]"
            />
          </button>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "answerImageUrl",
        header: "答案图",
        cell: ({ row }) => (
          <button type="button" onClick={() => setPreviewUrl(row.original.answerImageUrl)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={row.original.answerImageUrl}
              alt="answer"
              className="h-14 w-20 rounded object-cover border border-[#27272a]"
            />
          </button>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "expectedAction",
        header: "标准动作",
        cell: ({ row }) => (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/5 text-[#e5e7eb] border border-white/10">
            {FLASHCARD_LABELS[row.original.expectedAction || row.original.direction || "NO_TRADE"]}
          </span>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "behaviorType",
        header: "行为类型",
        cell: ({ row }) => {
          const text = row.original.behaviorType
            ? FLASHCARD_LABELS[row.original.behaviorType]
            : "-";
          return <HoverText text={text} className="min-w-[120px] text-[#9ca3af]" />;
        },
        enableSorting: false,
      },
      {
        accessorKey: "invalidationType",
        header: "失效类型",
        cell: ({ row }) => {
          const text = row.original.invalidationType
            ? FLASHCARD_LABELS[row.original.invalidationType]
            : "-";
          return <HoverText text={text} className="min-w-[120px] text-[#9ca3af]" />;
        },
        enableSorting: false,
      },
      {
        accessorKey: "systemOutcomeType",
        header: "系统结果",
        cell: ({ row }) => {
          const text = row.original.systemOutcomeType
            ? FLASHCARD_LABELS[row.original.systemOutcomeType]
            : FLASHCARD_LABELS.FLASHCARD_SYSTEM_OUTCOME_UNSET;
          return <HoverText text={text} className="min-w-[160px] text-[#e5e7eb]" />;
        },
        enableSorting: false,
      },
      {
        accessorKey: "earlyExitTag",
        header: "订单标签",
        cell: ({ row }) => (
          <div className="min-w-[120px] text-[#e5e7eb]">
            {row.original.earlyExitTag ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
                {FLASHCARD_LABELS.FLASHCARD_EARLY_EXIT_TAG}
              </span>
            ) : "-"}
          </div>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "symbolPairInfo",
        header: "币对信息",
        cell: ({ row }) => {
          const text = row.original.symbolPairInfo?.trim() || "-";
          return <HoverText text={text} className="min-w-[120px] text-[#e5e7eb]" />;
        },
        enableSorting: false,
      },
      {
        accessorKey: "marketTimeInfo",
        header: "行情时间信息",
        cell: ({ row }) => {
          const text = row.original.marketTimeInfo?.trim() || "-";
          return <HoverText text={text} className="min-w-[170px] text-[#9ca3af]" />;
        },
        enableSorting: false,
      },
      {
        accessorKey: "earlyExitReason",
        header: "提前离场原因",
        cell: ({ row }) => {
          const text = row.original.earlyExitReason?.trim() || "-";
          return (
            <HoverText
              text={text}
              className="min-w-[220px] max-w-[300px] truncate text-[#9ca3af]"
            />
          );
        },
        enableSorting: false,
      },
      {
        accessorKey: "earlyExitImageUrls",
        header: "提前离场截图",
        cell: ({ row }) => (
          <div className="min-w-[120px] text-[#9ca3af]">
            {row.original.earlyExitImageUrls?.length
              ? `${row.original.earlyExitImageUrls.length} 张`
              : "-"}
          </div>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "qualityScoreAvg",
        header: "平均评分",
        cell: ({ row }) => {
          const score = typeof row.original.qualityScoreAvg === "number" ? row.original.qualityScoreAvg.toFixed(2) : "5.00";
          return <div className="min-w-[100px] text-[#e5e7eb]">{score}</div>;
        },
        enableSorting: false,
      },
      {
        accessorKey: "simulationResolvedCount",
        header: "模拟闭环数",
        cell: ({ row }) => {
          const count = typeof row.original.simulationResolvedCount === "number" ? row.original.simulationResolvedCount : 0;
          return <div className="min-w-[100px] text-[#9ca3af]">{count}</div>;
        },
        enableSorting: false,
      },
      {
        accessorKey: "simulationAvgRr",
        header: "模拟平均RR",
        cell: ({ row }) => {
          const value = typeof row.original.simulationAvgRr === "number" ? row.original.simulationAvgRr.toFixed(2) : "0.00";
          return <div className="min-w-[100px] text-[#e5e7eb]">{value}</div>;
        },
        enableSorting: false,
      },
      {
        accessorKey: "simulationFailureCount",
        header: "模拟失败数",
        cell: ({ row }) => {
          const count = typeof row.original.simulationFailureCount === "number" ? row.original.simulationFailureCount : 0;
          return <div className="min-w-[100px] text-[#9ca3af]">{count}</div>;
        },
        enableSorting: false,
      },
      {
        accessorKey: "notes",
        header: "闪卡备注",
        cell: ({ row }) => {
          const text = row.original.notes?.trim() || "-";
          return (
            <HoverText
              text={text}
              className="min-w-[220px] max-w-[300px] truncate text-[#9ca3af]"
            />
          );
        },
        enableSorting: false,
      },
      {
        id: "actions",
        header: () => <div className="text-center">操作</div>,
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-2 justify-center min-w-[260px]">
            <Button
              variant="outline"
              size="sm"
              onClick={() => openViewDialog(row.original)}
            >
              详情
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => openNoteDialog(row.original)}
            >
              编辑
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => void handleDeleteCard(row.original)}
            >
              删除
            </Button>
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
        size: 260,
        enablePinning: true,
        meta: {
          pinned: "right",
        },
      },
    ],
    [handleDeleteCard, openNoteDialog, openViewDialog],
  );

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  return (
    <TradePageShell title="闪卡管理" subtitle="列表、查询与操作风格对齐交易记录页" showAddButton={false}>
      <div className="flex flex-col h-full space-y-6">
        <div className="flex-shrink-0">
          <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4 mb-4 shadow-sm">
            <form onSubmit={handleQuerySubmit} className="space-y-3">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#9ca3af] mb-1">币对信息</label>
                  <Input
                    value={queryForm.symbolPairInfo}
                    onChange={(e) =>
                      setQueryForm((prev) => ({ ...prev, symbolPairInfo: e.target.value }))
                    }
                    placeholder="输入币对，例如 BTC/USDT"
                    className="h-9 bg-[#1e1e1e] border border-[#27272a] text-[#e5e7eb]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#9ca3af] mb-1">行情时间信息</label>
                  <Input
                    value={queryForm.marketTimeInfo}
                    onChange={(e) =>
                      setQueryForm((prev) => ({ ...prev, marketTimeInfo: e.target.value }))
                    }
                    placeholder="输入时间关键字，例如 2026-03-05"
                    className="h-9 bg-[#1e1e1e] border border-[#27272a] text-[#e5e7eb]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#9ca3af] mb-1">排序字段</label>
                  <Select value={queryForm.sortBy} onValueChange={(value) => setQueryForm((prev) => ({ ...prev, sortBy: value as FlashcardCardSortBy }))}>
                    <SelectTrigger className="h-9 bg-[#1e1e1e] border border-[#27272a] text-[#e5e7eb]"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#121212] border border-[#27272a] text-[#e5e7eb]">
                      {FLASHCARD_CARD_SORT_BYS.map((item) => (
                        <SelectItem key={item} value={item}>{FLASHCARD_LABELS[item]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#9ca3af] mb-1">排序方向</label>
                  <Select value={queryForm.sortOrder} onValueChange={(value) => setQueryForm((prev) => ({ ...prev, sortOrder: value as FlashcardCardSortOrder }))}>
                    <SelectTrigger className="h-9 bg-[#1e1e1e] border border-[#27272a] text-[#e5e7eb]"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#121212] border border-[#27272a] text-[#e5e7eb]">
                      {FLASHCARD_CARD_SORT_ORDERS.map((item) => (
                        <SelectItem key={item} value={item}>{item}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2 border-t border-[#27272a]">
                <Button
                  type="submit"
                  className="w-16 h-8 font-medium text-sm bg-[#00c2b2]/20 text-[#00c2b2] border border-[#00c2b2]/30 hover:bg-[#00c2b2]/30"
                  size="sm"
                >
                  查询
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-16 h-8 text-sm border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb] hover:bg-[#27272a]"
                  size="sm"
                  onClick={handleQueryReset}
                >
                  重置
                </Button>
              </div>
            </form>
          </div>
        </div>

        <div className="flex-1 min-h-0">
          <DataTable<FlashcardCard, unknown>
            columns={columns as ColumnDef<FlashcardCard, unknown>[]}
            data={items}
            sorting={sorting}
            rowSelection={rowSelection}
            loading={loading}
            page={page}
            pageSize={pageSize}
            totalItems={totalItems}
            totalPages={totalPages}
            onPageChange={(nextPage) => {
              void fetchPage(nextPage, activeQuery);
            }}
            onPageSizeChange={(_, nextPageSize) => {
              setPageSize(nextPageSize);
              cursorStackRef.current = [undefined];
            }}
            onSortingChange={(nextSorting) => setSorting(nextSorting as SortingState)}
            onRowSelectionChange={(nextSelection) =>
              setRowSelection(nextSelection as RowSelectionState)
            }
            initialColumnPinning={{
              right: ["actions"],
            }}
          />
        </div>
      </div>

      <ImagePreviewDialog previewUrl={previewUrl} onClose={() => setPreviewUrl(null)} />

      <Dialog open={Boolean(viewingCard)} onOpenChange={(open) => !open && setViewingCard(null)}>
        <DialogContent className="w-[min(98vw,1440px)] max-w-none sm:max-w-none border-[#27272a] bg-[#121212] text-[#e5e7eb]">
          <DialogHeader>
            <DialogTitle>闪卡详情</DialogTitle>
          </DialogHeader>
          {viewingCard ? (
            <div className="max-h-[80vh] overflow-y-auto pr-1">
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2 rounded-lg border border-[#27272a] bg-[#18181b] p-3">
                    <div className="text-xs font-medium text-[#9ca3af]">入场前截图</div>
                    <button type="button" className="block w-full" onClick={() => setPreviewUrl(viewingCard.questionImageUrl)}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={viewingCard.questionImageUrl}
                        alt="question"
                        className="max-h-[360px] w-full rounded border border-[#27272a] bg-black object-contain"
                      />
                    </button>
                  </div>
                  <div className="space-y-2 rounded-lg border border-[#27272a] bg-[#18181b] p-3">
                    <div className="text-xs font-medium text-[#9ca3af]">入场后截图</div>
                    <button type="button" className="block w-full" onClick={() => setPreviewUrl(viewingCard.answerImageUrl)}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={viewingCard.answerImageUrl}
                        alt="answer"
                        className="max-h-[360px] w-full rounded border border-[#27272a] bg-black object-contain"
                      />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <div className="rounded-lg border border-[#27272a] bg-[#18181b] p-3">
                    <div className="text-xs text-[#9ca3af]">标准动作</div>
                    <div className="mt-1 text-sm text-[#e5e7eb]">{FLASHCARD_LABELS[viewingCard.expectedAction || viewingCard.direction || "NO_TRADE"]}</div>
                  </div>
                  <div className="rounded-lg border border-[#27272a] bg-[#18181b] p-3">
                    <div className="text-xs text-[#9ca3af]">行为类型</div>
                    <div className="mt-1 text-sm text-[#e5e7eb]">{viewingCard.behaviorType ? FLASHCARD_LABELS[viewingCard.behaviorType] : "-"}</div>
                  </div>
                  <div className="rounded-lg border border-[#27272a] bg-[#18181b] p-3">
                    <div className="text-xs text-[#9ca3af]">失效类型</div>
                    <div className="mt-1 text-sm text-[#e5e7eb]">{viewingCard.invalidationType ? FLASHCARD_LABELS[viewingCard.invalidationType] : "-"}</div>
                  </div>
                  <div className="rounded-lg border border-[#27272a] bg-[#18181b] p-3">
                    <div className="text-xs text-[#9ca3af]">系统结果</div>
                    <div className="mt-1 text-sm text-[#e5e7eb]">{viewingCard.systemOutcomeType ? FLASHCARD_LABELS[viewingCard.systemOutcomeType] : FLASHCARD_LABELS.FLASHCARD_SYSTEM_OUTCOME_UNSET}</div>
                  </div>
                  <div className="rounded-lg border border-[#27272a] bg-[#18181b] p-3">
                    <div className="text-xs text-[#9ca3af]">订单标签</div>
                    <div className="mt-1 text-sm text-[#e5e7eb]">{viewingCard.earlyExitTag ? FLASHCARD_LABELS.FLASHCARD_EARLY_EXIT_TAG : "-"}</div>
                  </div>
                  <div className="rounded-lg border border-[#27272a] bg-[#18181b] p-3">
                    <div className="text-xs text-[#9ca3af]">币对信息</div>
                    <div className="mt-1 text-sm text-[#e5e7eb]">{viewingCard.symbolPairInfo?.trim() || "-"}</div>
                  </div>
                  <div className="rounded-lg border border-[#27272a] bg-[#18181b] p-3 md:col-span-2 xl:col-span-1">
                    <div className="text-xs text-[#9ca3af]">行情时间信息</div>
                    <div className="mt-1 text-sm text-[#e5e7eb]">{viewingCard.marketTimeInfo?.trim() || "-"}</div>
                  </div>
                  <div className="rounded-lg border border-[#27272a] bg-[#18181b] p-3 md:col-span-2 xl:col-span-2">
                    <div className="text-xs text-[#9ca3af]">提前离场原因</div>
                    <div className="mt-1 whitespace-pre-wrap text-sm text-[#e5e7eb]">{viewingCard.earlyExitReason?.trim() || "-"}</div>
                  </div>
                </div>

                <div className="space-y-2 rounded-lg border border-[#27272a] bg-[#18181b] p-3">
                  <div className="text-xs font-medium text-[#9ca3af]">题目备注</div>
                  <div className="min-h-20 whitespace-pre-wrap text-sm text-[#e5e7eb]">{viewingCard.notes?.trim() || "-"}</div>
                </div>

                {viewingCard.earlyExitImageUrls?.length ? (
                  <div className="space-y-2 rounded-lg border border-[#27272a] bg-[#18181b] p-3">
                    <div className="text-xs font-medium text-[#9ca3af]">提前离场截图</div>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
                      {viewingCard.earlyExitImageUrls.map((url, index) => (
                        <button
                          key={`${viewingCard.cardId}-detail-early-exit-${index}`}
                          type="button"
                          className="overflow-hidden rounded border border-[#27272a] bg-black"
                          onClick={() => setPreviewUrl(url)}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt={`early-exit-${index + 1}`} className="h-32 w-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6">
                  <div className="rounded-lg border border-[#27272a] bg-[#18181b] p-3"><div className="text-xs text-[#9ca3af]">simulation 总尝试</div><div className="mt-1 text-sm text-[#e5e7eb]">{viewingCard.simulationAttemptCount ?? 0}</div></div>
                  <div className="rounded-lg border border-[#27272a] bg-[#18181b] p-3"><div className="text-xs text-[#9ca3af]">simulation 已闭环</div><div className="mt-1 text-sm text-[#e5e7eb]">{viewingCard.simulationResolvedCount ?? 0}</div></div>
                  <div className="rounded-lg border border-[#27272a] bg-[#18181b] p-3"><div className="text-xs text-[#9ca3af]">simulation 成功率</div><div className="mt-1 text-sm text-[#e5e7eb]">{Math.round((viewingCard.simulationSuccessRate ?? 0) * 100)}%</div></div>
                  <div className="rounded-lg border border-[#27272a] bg-[#18181b] p-3"><div className="text-xs text-[#9ca3af]">simulation 平均RR</div><div className="mt-1 text-sm text-[#e5e7eb]">{(viewingCard.simulationAvgRr ?? 0).toFixed(2)}</div></div>
                  <div className="rounded-lg border border-[#27272a] bg-[#18181b] p-3"><div className="text-xs text-[#9ca3af]">最近 simulation</div><div className="mt-1 text-sm text-[#e5e7eb]">{formatDateTime(viewingCard.lastSimulationAt)}</div></div>
                  <div className="rounded-lg border border-[#27272a] bg-[#18181b] p-3"><div className="text-xs text-[#9ca3af]">卡片 ID</div><div className="mt-1 break-all text-sm text-[#e5e7eb]">{viewingCard.cardId}</div></div>
                </div>

                <div className="grid grid-cols-1 gap-3 text-xs text-[#9ca3af] md:grid-cols-2">
                  <div className="rounded-lg border border-[#27272a] bg-[#18181b] p-3">创建时间：{formatDateTime(viewingCard.createdAt)}</div>
                  <div className="rounded-lg border border-[#27272a] bg-[#18181b] p-3">更新时间：{formatDateTime(viewingCard.updatedAt)}</div>
                </div>
              </div>
            </div>
          ) : null}
          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              className="border-[#27272a] bg-transparent text-[#e5e7eb] hover:bg-[#1e1e1e]"
              onClick={() => setViewingCard(null)}
            >
              关闭
            </Button>
            <Button
              type="button"
              className="bg-[#00c2b2] text-black hover:bg-[#009e91]"
              onClick={() => {
                if (!viewingCard) return;
                openNoteDialog(viewingCard);
                setViewingCard(null);
              }}
            >
              去编辑
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(editingCard)}
        onOpenChange={(open) => {
          if (!open && !savingNote) {
            setEditingCard(null);
          }
        }}
      >
        <DialogContent className="w-[min(98vw,1440px)] max-w-none sm:max-w-none border-[#27272a] bg-[#121212] p-0 text-[#e5e7eb]">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>编辑闪卡信息</DialogTitle>
          </DialogHeader>
          <div className="max-h-[calc(90vh-140px)] overflow-y-auto px-6 pb-4">
            <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-1 rounded-lg border border-[#27272a] bg-[#1a1a1a] p-3">
                <div className="text-xs text-[#9ca3af]">入场前截图（必填）</div>
                <ImageUploader
                  value={editingQuestionImages}
                  onChange={setEditingQuestionImages}
                  max={1}
                  disabled={savingNote}
                />
              </div>
              <div className="space-y-1 rounded-lg border border-[#27272a] bg-[#1a1a1a] p-3">
                <div className="text-xs text-[#9ca3af]">入场后截图（必填）</div>
                <ImageUploader
                  value={editingAnswerImages}
                  onChange={setEditingAnswerImages}
                  max={1}
                  disabled={savingNote}
                />
              </div>
            </div>

            <div className="grid gap-4 rounded-xl border border-[#27272a] bg-[#121212] p-4 md:grid-cols-2 shadow-sm">
              <div className="space-y-2">
                <div className="text-xs font-medium text-[#9ca3af]">标准动作（必填）</div>
                <div className="grid grid-cols-3 gap-2">
                  {FLASHCARD_DIRECTIONS.map((item) => {
                    const isActive = editingExpectedAction === item;
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setEditingExpectedAction(item as FlashcardAction)}
                        disabled={savingNote}
                        className={`h-10 rounded-md border text-sm font-medium transition-colors ${
                          isActive
                            ? "border-[#00c2b2] bg-[#00c2b2]/20 text-[#00c2b2]"
                            : "border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb] hover:bg-[#242424]"
                        } disabled:opacity-60`}
                      >
                        {FLASHCARD_LABELS[item]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-medium text-[#9ca3af]">行情时间信息（选填）</div>
                <DateCalendarPicker
                  analysisTime={editingMarketTimeInfo}
                  updateForm={(patch) => setEditingMarketTimeInfo(patch.analysisTime)}
                  showSeconds={false}
                  placeholder="选择行情时间"
                />
              </div>

              <div className="space-y-2">
                <div className="text-xs font-medium text-[#9ca3af]">行为类型（选填）</div>
                <Select
                  value={editingBehaviorType || EMPTY_SELECT_VALUE}
                  onValueChange={(value) =>
                    setEditingBehaviorType(
                      value === EMPTY_SELECT_VALUE
                        ? ""
                        : (value as FlashcardBehaviorType),
                    )
                  }
                >
                  <SelectTrigger className="h-9 border border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb]">
                    <SelectValue placeholder="选择价格行为依据" />
                  </SelectTrigger>
                  <SelectContent className="border border-[#27272a] bg-[#121212] text-[#e5e7eb]">
                    <SelectItem value={EMPTY_SELECT_VALUE}>未设置</SelectItem>
                    {isLegacyFlashcardBehaviorType(editingBehaviorType) ? (
                      <>
                        <SelectSeparator />
                        <SelectGroup>
                          <SelectLabel>当前旧值（仅展示）</SelectLabel>
                          <SelectItem value={editingBehaviorType}>
                            {FLASHCARD_LABELS[editingBehaviorType]}
                          </SelectItem>
                        </SelectGroup>
                      </>
                    ) : null}
                    {FLASHCARD_BEHAVIOR_SELECT_OPTION_GROUPS.map((group) => (
                      <React.Fragment key={group.label}>
                        <SelectSeparator />
                        <SelectGroup>
                          <SelectLabel>{group.label}</SelectLabel>
                          {group.items.map((item) => (
                            <SelectItem key={item} value={item}>
                              {FLASHCARD_LABELS[item]}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </React.Fragment>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-medium text-[#9ca3af]">失效类型（选填）</div>
                <Select
                  value={editingInvalidationType || EMPTY_SELECT_VALUE}
                  onValueChange={(value) =>
                    setEditingInvalidationType(
                      value === EMPTY_SELECT_VALUE
                        ? ""
                        : (value as FlashcardInvalidationType),
                    )
                  }
                >
                  <SelectTrigger className="h-9 border border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb]">
                    <SelectValue placeholder="选择止损/失效逻辑" />
                  </SelectTrigger>
                  <SelectContent className="border border-[#27272a] bg-[#121212] text-[#e5e7eb]">
                    <SelectItem value={EMPTY_SELECT_VALUE}>未设置</SelectItem>
                    {isLegacyFlashcardInvalidationType(editingInvalidationType) ? (
                      <>
                        <SelectSeparator />
                        <SelectGroup>
                          <SelectLabel>当前旧值（仅展示）</SelectLabel>
                          <SelectItem value={editingInvalidationType}>
                            {FLASHCARD_LABELS[editingInvalidationType]}
                          </SelectItem>
                        </SelectGroup>
                      </>
                    ) : null}
                    {FLASHCARD_INVALIDATION_SELECT_OPTION_GROUPS.map((group) => (
                      <React.Fragment key={group.label}>
                        <SelectSeparator />
                        <SelectGroup>
                          <SelectLabel>{group.label}</SelectLabel>
                          {group.items.map((item) => (
                            <SelectItem key={item} value={item}>
                              {FLASHCARD_LABELS[item]}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </React.Fragment>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-medium text-[#9ca3af]">币对信息（选填）</div>
                <Input
                  value={editingSymbolPairInfo}
                  onChange={(event) => setEditingSymbolPairInfo(event.target.value)}
                  onBlur={(event) => rememberSymbolPair(event.target.value)}
                  list="flashcard-symbol-pair-presets-manage"
                  placeholder="例：BTC/USDT"
                  className="h-9 border border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb]"
                  disabled={savingNote}
                />
                <datalist id="flashcard-symbol-pair-presets-manage">
                  {symbolPairOptions.map((item) => (
                    <option key={item} value={item} />
                  ))}
                </datalist>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-medium text-[#9ca3af]">系统结果分类（选填）</div>
                <Select
                  value={editingSystemOutcomeType || EMPTY_SELECT_VALUE}
                  onValueChange={(value) =>
                    setEditingSystemOutcomeType(
                      value === EMPTY_SELECT_VALUE
                        ? ""
                        : (value as FlashcardSystemOutcomeType),
                    )
                  }
                >
                  <SelectTrigger className="h-9 border border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb]">
                    <SelectValue placeholder="未分类" />
                  </SelectTrigger>
                  <SelectContent className="border border-[#27272a] bg-[#121212] text-[#e5e7eb]">
                    <SelectItem value={EMPTY_SELECT_VALUE}>未分类</SelectItem>
                    {FLASHCARD_SYSTEM_OUTCOME_TYPES.map((item) => (
                      <SelectItem key={item} value={item}>
                        {FLASHCARD_LABELS[item]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3 rounded-lg border border-[#27272a] bg-[#18181b] p-3 md:col-span-2">
                <label className="flex items-center gap-3 text-sm text-[#e5e7eb]">
                  <input
                    type="checkbox"
                    checked={editingEarlyExitTag}
                    onChange={(event) => {
                      const checked = event.target.checked;
                      setEditingEarlyExitTag(checked);
                      if (!checked) {
                        setEditingEarlyExitReason("");
                        setEditingEarlyExitImages([]);
                      }
                    }}
                    disabled={savingNote}
                    className="h-4 w-4 rounded border-[#3f3f46] bg-[#111827]"
                  />
                  <span>标记为提前离场题</span>
                </label>
                <div className="text-xs text-[#9ca3af]">
                  用来记录“本来符合系统信号，但后续走势发展不如意，需要提前手动离场”的题。
                </div>
                {editingEarlyExitTag ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-[#9ca3af]">提前离场原因（必填）</div>
                      <Textarea
                        value={editingEarlyExitReason}
                        onChange={(event) => setEditingEarlyExitReason(event.target.value)}
                        placeholder="例如：触发后没有扩张，回踩承接减弱，所以手动先离场"
                        className="min-h-20 border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb]"
                        disabled={savingNote}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-[#9ca3af]">提前离场截图（选填，最多 5 张）</div>
                      <ImageUploader
                        value={editingEarlyExitImages}
                        onChange={setEditingEarlyExitImages}
                        max={5}
                        disabled={savingNote}
                      />
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="md:col-span-2">
                <FlashcardFieldGuide
                  behaviorType={editingBehaviorType}
                  invalidationType={editingInvalidationType}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <div className="text-xs font-medium text-[#9ca3af]">题目备注（选填）</div>
                <Textarea
                  value={editingNote}
                  onChange={(event) => setEditingNote(event.target.value)}
                  placeholder="记录触发信号、执行偏差、后续改进"
                  className="min-h-24 border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb]"
                  disabled={savingNote}
                />
              </div>
            </div>
            <div className="text-xs text-[#9ca3af]">卡片 ID：{editingCard?.cardId || "-"}</div>
            </div>
          </div>
          <DialogFooter className="border-t border-[#27272a] px-6 py-4">
            <Button
              type="button"
              variant="outline"
              className="border-[#27272a] bg-transparent text-[#e5e7eb] hover:bg-[#1e1e1e]"
              onClick={() => setEditingCard(null)}
              disabled={savingNote}
            >
              取消
            </Button>
            <Button
              type="button"
              className="bg-[#00c2b2] text-black hover:bg-[#009e91]"
              onClick={() => void handleSaveNote()}
              disabled={savingNote}
            >
              {savingNote ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TradePageShell>
  );
}
