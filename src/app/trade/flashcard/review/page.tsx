"use client";

import React from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import TradePageShell from "../../components/trade-page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  listFlashcardFavorites,
  listFlashcardWrongBook,
  startFlashcardDrillSession,
} from "../request";
import { ImagePreviewDialog } from "../components/ImagePreviewDialog";
import { saveFlashcardSession } from "@/store/flashcard-session";
import { FLASHCARD_LABELS, type FlashcardCard, type FlashcardSource } from "../types";

type SortType = "updated_desc" | "updated_asc";
type SourceView = "WRONG_BOOK" | "FAVORITES";

const PAGE_SIZE = 10;

function matchesKeyword(card: FlashcardCard, keyword: string) {
  if (!keyword.trim()) return true;
  const text = [
    card.cardId,
    card.notes || "",
    FLASHCARD_LABELS[card.direction],
    FLASHCARD_LABELS[card.context],
    FLASHCARD_LABELS[card.orderFlowFeature],
    FLASHCARD_LABELS[card.result],
  ]
    .join(" ")
    .toLowerCase();
  return text.includes(keyword.trim().toLowerCase());
}

function sortCards(cards: FlashcardCard[], sort: SortType) {
  const next = [...cards];
  next.sort((a, b) => {
    const left = new Date(a.updatedAt || a.createdAt).getTime();
    const right = new Date(b.updatedAt || b.createdAt).getTime();
    return sort === "updated_desc" ? right - left : left - right;
  });
  return next;
}

export default function FlashcardReviewPage() {
  const router = useRouter();
  const [successAlert, errorAlert] = useAlert();

  const [wrongItems, setWrongItems] = React.useState<FlashcardCard[]>([]);
  const [favoriteItems, setFavoriteItems] = React.useState<FlashcardCard[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [starting, setStarting] = React.useState<FlashcardSource | null>(null);

  const [activeTab, setActiveTab] = React.useState<SourceView>("WRONG_BOOK");
  const [keyword, setKeyword] = React.useState("");
  const [sortType, setSortType] = React.useState<SortType>("updated_desc");
  const [page, setPage] = React.useState(1);

  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [wrongBook, favorites] = await Promise.all([
        listFlashcardWrongBook(),
        listFlashcardFavorites(),
      ]);
      setWrongItems(wrongBook);
      setFavoriteItems(favorites);
    } catch (error) {
      errorAlert(error instanceof Error ? error.message : "加载复盘数据失败");
    } finally {
      setLoading(false);
    }
  }, [errorAlert]);

  React.useEffect(() => {
    void loadData();
  }, [loadData]);

  React.useEffect(() => {
    setPage(1);
  }, [activeTab, keyword, sortType]);

  const sourceItems = activeTab === "WRONG_BOOK" ? wrongItems : favoriteItems;
  const filteredItems = React.useMemo(() => {
    return sortCards(sourceItems.filter((card) => matchesKeyword(card, keyword)), sortType);
  }, [keyword, sortType, sourceItems]);
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedItems = filteredItems.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const handleStartReview = React.useCallback(
    async (source: FlashcardSource) => {
      setStarting(source);
      try {
        const result = await startFlashcardDrillSession({
          source,
          count: Math.min(
            Math.max(
              source === "WRONG_BOOK" ? wrongItems.length || 20 : favoriteItems.length || 20,
              1,
            ),
            200,
          ),
        });

        if (!result.cards.length) {
          errorAlert("没有可复盘题目", "请先完成训练或收藏题目");
          return;
        }

        saveFlashcardSession({
          sessionId: result.sessionId,
          source: result.source,
          cards: result.cards,
          count: result.count,
          startedAt: new Date().toISOString(),
        });
        successAlert(`已生成 ${result.cards.length} 张复盘卡片`);
        router.push("/trade/flashcard/drill/play");
      } catch (error) {
        errorAlert(error instanceof Error ? error.message : "开始复盘失败");
      } finally {
        setStarting(null);
      }
    },
    [errorAlert, favoriteItems.length, router, successAlert, wrongItems.length],
  );

  const wrongCount = wrongItems.length;
  const favoriteCount = favoriteItems.length;

  return (
    <TradePageShell title="复盘中心" subtitle="错题集/收藏库列表与一键开始复盘" showAddButton={false}>
      <div className="w-full space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-[#27272a] bg-[#121212] p-4 shadow-sm">
            <div className="text-sm text-[#9ca3af]">错题集</div>
            <div className="mt-1 text-2xl font-semibold text-white">{wrongCount}</div>
            <div className="mt-3">
              <Button
                type="button"
                className="bg-[#00c2b2] text-black hover:bg-[#009e91]"
                disabled={starting === "WRONG_BOOK" || wrongCount === 0}
                onClick={() => void handleStartReview("WRONG_BOOK")}
              >
                {starting === "WRONG_BOOK" ? "启动中..." : "一键开始错题复盘"}
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-[#27272a] bg-[#121212] p-4 shadow-sm">
            <div className="text-sm text-[#9ca3af]">收藏库</div>
            <div className="mt-1 text-2xl font-semibold text-white">{favoriteCount}</div>
            <div className="mt-3">
              <Button
                type="button"
                className="bg-[#00c2b2] text-black hover:bg-[#009e91]"
                disabled={starting === "FAVORITES" || favoriteCount === 0}
                onClick={() => void handleStartReview("FAVORITES")}
              >
                {starting === "FAVORITES" ? "启动中..." : "一键开始收藏复盘"}
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#27272a] bg-[#121212] p-4 shadow-sm space-y-3">
          <div className="grid gap-3 md:grid-cols-[160px_1fr_160px]">
            <Select value={activeTab} onValueChange={(v) => setActiveTab(v as SourceView)}>
              <SelectTrigger className="h-9 bg-[#1e1e1e] border border-[#27272a] text-[#e5e7eb]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#121212] border border-[#27272a] text-[#e5e7eb]">
                <SelectItem value="WRONG_BOOK">错题集列表</SelectItem>
                <SelectItem value="FAVORITES">收藏库列表</SelectItem>
              </SelectContent>
            </Select>

            <Input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="检索 cardId / 标签 / 备注"
              className="h-9 border border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb]"
            />

            <Select value={sortType} onValueChange={(v) => setSortType(v as SortType)}>
              <SelectTrigger className="h-9 bg-[#1e1e1e] border border-[#27272a] text-[#e5e7eb]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#121212] border border-[#27272a] text-[#e5e7eb]">
                <SelectItem value="updated_desc">更新时间：新到旧</SelectItem>
                <SelectItem value="updated_asc">更新时间：旧到新</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto border border-[#27272a] rounded-lg">
            <Table className="min-w-[980px]">
              <TableHeader>
                <TableRow className="border-b border-[#27272a] bg-black/20">
                  <TableHead className="text-[#9ca3af] text-xs uppercase">更新时间</TableHead>
                  <TableHead className="text-[#9ca3af] text-xs uppercase">题目图</TableHead>
                  <TableHead className="text-[#9ca3af] text-xs uppercase">答案图</TableHead>
                  <TableHead className="text-[#9ca3af] text-xs uppercase">方向</TableHead>
                  <TableHead className="text-[#9ca3af] text-xs uppercase">结构</TableHead>
                  <TableHead className="text-[#9ca3af] text-xs uppercase">订单流</TableHead>
                  <TableHead className="text-[#9ca3af] text-xs uppercase">结果</TableHead>
                  <TableHead className="text-[#9ca3af] text-xs uppercase">状态</TableHead>
                  <TableHead className="text-[#9ca3af] text-xs uppercase">备注</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center text-[#9ca3af]">加载中...</TableCell>
                  </TableRow>
                ) : pagedItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center text-[#9ca3af]">暂无匹配题目</TableCell>
                  </TableRow>
                ) : (
                  pagedItems.map((card) => {
                    const hasNote = Boolean(card.notes?.trim());
                    return (
                      <TableRow key={`${activeTab}-${card.cardId}`} className="border-b border-[#27272a] hover:bg-[#1e1e1e]">
                        <TableCell className="min-w-[140px] text-sm text-[#e5e7eb]">
                          {format(new Date(card.updatedAt || card.createdAt), "yyyy-MM-dd HH:mm")}
                        </TableCell>
                        <TableCell>
                          <button type="button" onClick={() => setPreviewUrl(card.questionImageUrl)}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={card.questionImageUrl} alt="question" className="h-14 w-20 rounded object-cover border border-[#27272a]" />
                          </button>
                        </TableCell>
                        <TableCell>
                          <button type="button" onClick={() => setPreviewUrl(card.answerImageUrl)}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={card.answerImageUrl} alt="answer" className="h-14 w-20 rounded object-cover border border-[#27272a]" />
                          </button>
                        </TableCell>
                        <TableCell className="text-sm text-[#e5e7eb]">{FLASHCARD_LABELS[card.direction]}</TableCell>
                        <TableCell className="text-sm text-[#e5e7eb]">{FLASHCARD_LABELS[card.context]}</TableCell>
                        <TableCell className="max-w-[180px] truncate text-sm text-[#e5e7eb]" title={FLASHCARD_LABELS[card.orderFlowFeature]}>
                          {FLASHCARD_LABELS[card.orderFlowFeature]}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center rounded-full border border-[#00c2b2]/30 bg-[#00c2b2]/15 px-2 py-0.5 text-xs font-medium text-[#00c2b2]">
                            {FLASHCARD_LABELS[card.result]}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
                              hasNote
                                ? "border-emerald-400/30 bg-emerald-400/15 text-emerald-300"
                                : "border-amber-400/30 bg-amber-400/15 text-amber-300"
                            }`}
                          >
                            {hasNote ? "已备注" : "待备注"}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-[220px] truncate text-sm text-[#9ca3af]" title={card.notes || ""}>
                          {card.notes || "-"}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between border border-[#27272a] rounded-lg bg-[#101010] px-3 py-2">
            <div className="text-sm text-[#9ca3af]">
              共 {filteredItems.length} 条 · 第 {currentPage}/{totalPages} 页
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="border-[#27272a] bg-transparent text-[#e5e7eb] hover:bg-[#1e1e1e]"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                上一页
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="border-[#27272a] bg-transparent text-[#e5e7eb] hover:bg-[#1e1e1e]"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                下一页
              </Button>
            </div>
          </div>
        </div>
      </div>

      <ImagePreviewDialog previewUrl={previewUrl} onClose={() => setPreviewUrl(null)} />
    </TradePageShell>
  );
}
