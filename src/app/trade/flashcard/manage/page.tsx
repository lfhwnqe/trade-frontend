"use client";

import * as React from "react";
import { ColumnDef, RowSelectionState, SortingState } from "@tanstack/react-table";
import TradePageShell from "../../components/trade-page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable } from "@/components/common/DataTable";
import { useAlert } from "@/components/common/alert";
import {
  deleteFlashcardCard,
  listFlashcardCards,
  updateFlashcardNote,
} from "../request";
import { FLASHCARD_LABELS, type FlashcardCard } from "../types";
import { ImagePreviewDialog } from "../components/ImagePreviewDialog";

type FlashcardQuery = {
  symbolPairInfo: string;
  marketTimeInfo: string;
};

export default function FlashcardManagePage() {
  const [successAlert, errorAlert] = useAlert();

  const [items, setItems] = React.useState<FlashcardCard[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [editingCard, setEditingCard] = React.useState<FlashcardCard | null>(null);
  const [editingNote, setEditingNote] = React.useState("");
  const [savingNote, setSavingNote] = React.useState(false);

  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);
  const [totalItems, setTotalItems] = React.useState(1);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  const [queryForm, setQueryForm] = React.useState<FlashcardQuery>({
    symbolPairInfo: "",
    marketTimeInfo: "",
  });
  const [activeQuery, setActiveQuery] = React.useState<FlashcardQuery>({
    symbolPairInfo: "",
    marketTimeInfo: "",
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
        });

        setItems(res.items);
        setPage(targetPage);

        const estimateTotal = res.nextCursor
          ? targetPage * pageSize + 1
          : (targetPage - 1) * pageSize + res.items.length;
        setTotalItems(Math.max(estimateTotal, 1));

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
    const emptyQuery = { symbolPairInfo: "", marketTimeInfo: "" };
    setQueryForm(emptyQuery);
    setActiveQuery(emptyQuery);
    cursorStackRef.current = [undefined];
    setRowSelection({});
    setSorting([]);
  }, []);

  const openNoteDialog = React.useCallback((card: FlashcardCard) => {
    setEditingCard(card);
    setEditingNote(card.notes || "");
  }, []);

  const handleSaveNote = React.useCallback(async () => {
    if (!editingCard) return;

    setSavingNote(true);
    try {
      const updated = await updateFlashcardNote(editingCard.cardId, editingNote);
      setItems((prev) =>
        prev.map((item) => (item.cardId === updated.cardId ? { ...item, ...updated } : item)),
      );
      setEditingCard(null);
      successAlert("备注已保存");
    } catch (error) {
      errorAlert(error instanceof Error ? error.message : "保存备注失败");
    } finally {
      setSavingNote(false);
    }
  }, [editingCard, editingNote, errorAlert, successAlert]);

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
        accessorKey: "direction",
        header: "后续方向",
        cell: ({ row }) => (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/5 text-[#e5e7eb] border border-white/10">
            {FLASHCARD_LABELS[row.original.expectedAction || row.original.direction]}
          </span>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "symbolPairInfo",
        header: "币对信息",
        cell: ({ row }) => (
          <div className="min-w-[120px] text-[#e5e7eb]">
            {row.original.symbolPairInfo?.trim() || "-"}
          </div>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "marketTimeInfo",
        header: "行情时间信息",
        cell: ({ row }) => (
          <div className="min-w-[170px] text-[#9ca3af]">
            {row.original.marketTimeInfo?.trim() || "-"}
          </div>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "notes",
        header: "闪卡备注",
        cell: ({ row }) => (
          <div className="min-w-[220px] max-w-[300px] truncate text-[#9ca3af]" title={row.original.notes || ""}>
            {row.original.notes?.trim() || "-"}
          </div>
        ),
        enableSorting: false,
      },
      {
        id: "actions",
        header: () => <div className="text-center">操作</div>,
        cell: ({ row }) => (
          <div className="flex space-x-2 justify-center min-w-[180px]">
            <Button
              variant="outline"
              size="sm"
              onClick={() => openNoteDialog(row.original)}
            >
              编辑备注
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
        size: 180,
        enablePinning: true,
        meta: {
          pinned: "right",
        },
      },
    ],
    [handleDeleteCard, openNoteDialog],
  );

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  return (
    <TradePageShell title="闪卡管理" subtitle="列表、查询与操作风格对齐交易记录页" showAddButton={false}>
      <div className="flex flex-col h-full space-y-6">
        <div className="flex-shrink-0">
          <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4 mb-4 shadow-sm">
            <form onSubmit={handleQuerySubmit} className="space-y-3">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
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

      <Dialog
        open={Boolean(editingCard)}
        onOpenChange={(open) => {
          if (!open && !savingNote) {
            setEditingCard(null);
          }
        }}
      >
        <DialogContent className="border-[#27272a] bg-[#121212] text-[#e5e7eb]">
          <DialogHeader>
            <DialogTitle>编辑闪卡备注</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <div className="text-xs text-[#9ca3af]">卡片 ID：{editingCard?.cardId}</div>
            <Textarea
              value={editingNote}
              onChange={(event) => setEditingNote(event.target.value)}
              placeholder="输入备注内容（留空表示清空）"
              className="min-h-28 border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb]"
              disabled={savingNote}
            />
          </div>
          <DialogFooter>
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
              {savingNote ? "保存中..." : "保存备注"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TradePageShell>
  );
}
