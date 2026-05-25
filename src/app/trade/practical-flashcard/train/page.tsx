"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ClipboardList, Play, RotateCcw } from "lucide-react";
import TradePageShell from "../../components/trade-page-shell";
import { Button } from "@/components/ui/button";
import { useAlert } from "@/components/common/alert";
import { startRandomPracticalFlashcardTraining } from "../request";
import { usePracticalFlashcardAdminAccess } from "../use-practical-flashcard-admin-access";

export default function PracticalFlashcardRandomTrainingPage() {
  const router = useRouter();
  const [, errorAlert] = useAlert();
  const { isAdmin } = usePracticalFlashcardAdminAccess();
  const [loading, setLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState("");
  const startedRef = React.useRef(false);

  const startTraining = React.useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const result = await startRandomPracticalFlashcardTraining({ excludeRecentlyResolved: true });
      router.replace(`/trade/practical-flashcard/${result.card.cardId}/play?attemptId=${result.attemptId}&mode=random`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "开始随机实操训练失败";
      setErrorMessage(message);
      errorAlert(message);
      setLoading(false);
    }
  }, [errorAlert, router]);

  React.useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void startTraining();
  }, [startTraining]);

  return (
    <TradePageShell title="实操闪卡训练" subtitle="随机抽取一张可训练的实操闪卡" showAddButton={false}>
      <div className="rounded-xl border border-[#27272a] bg-[#121212] p-6">
        {loading ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm font-medium text-[#e5e7eb]">
              <Play className="size-4 text-[#00c2b2]" />
              正在创建本次随机训练...
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#27272a]">
              <div className="h-full w-1/2 animate-pulse rounded-full bg-[#00c2b2]" />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <div className="text-sm font-semibold text-white">暂时无法开始随机训练</div>
              <div className="mt-2 text-sm text-[#a1a1aa]">{errorMessage || "请确认已经创建并启用实操闪卡。"}</div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={startTraining}
                className="gap-2 bg-[#00c2b2] text-[#031313] hover:bg-[#14d6c5]"
              >
                <RotateCcw className="size-4" />
                重新抽取
              </Button>
              <Button asChild variant="outline" className="gap-2 border-[#27272a] bg-[#1e1e1e] text-[#e5e7eb] hover:bg-[#242424]">
                <Link href={isAdmin ? "/trade/practical-flashcard/manage" : "/trade/practical-flashcard/dashboard"} prefetch={false}>
                  <ClipboardList className="size-4" />
                  {isAdmin ? "查看实操闪卡" : "返回训练统计"}
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </TradePageShell>
  );
}
