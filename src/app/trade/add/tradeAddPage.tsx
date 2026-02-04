"use client";

import * as React from "react";
import { useCallback, useEffect, Suspense, useRef, useState } from "react";
import { useAtomImmer } from "@/hooks/useAtomImmer";
import {
  formAtom,
  loadingAtom,
  detailLoadingAtom,
  formInitialState,
} from "./atom";
import { useRouter, useSearchParams } from "next/navigation";
import {
  createTrade,
  toDto,
  fetchTradeDetail,
  fetchSharedTradeDetail,
  shareTrade,
  updateTradeShareable,
  updateTrade,
} from "../list/request";
import { Trade, TradeStatus, tradeStatusOptions } from "../config";
import type { ImageResource } from "../config";
import {
  TradeFormDialog,
  TradeFormRef,
} from "../list/components/TradeFormDialog";
import { useAlert } from "@/components/common/alert";
import { LoadingButton } from "../components/LoadingButton";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type EntryPlan = {
  entryReason?: string;
  entrySignal?: string;
  exitSignal?: string;
};

const checklistSections = [
  {
    title: "第一阶段：结构识别",
    items: [
      {
        title: "1. 识别市场状态（Identify Market State）",
        bullets: [
          "判断当前是上涨趋势（HH/HL）、下跌趋势（LH/LL）、区间震荡（Range）还是混乱状态（Choppy）。",
          "特别注意：避开“混乱（Choppy）”的市场，因为其结构不可预测，容易触发止损。",
        ],
      },
      {
        title: "2. 标记主要波段高低点（Mark Major Swings）",
        bullets: ["找出图表上最明显的波段顶点和谷底。"],
      },
      {
        title: "3. 记录结构信号（BOS 与 CHoCH）",
        bullets: [
          "标记 BOS（结构突破）以确认趋势延续。",
          "记录 CHoCH（性质改变）作为趋势可能反转的早期警示。",
        ],
      },
      {
        title: "4. 识别强弱水平（Strong vs. Weak Levels）",
        bullets: [
          "强水平：导致了成功 BOS 的点位，回测时更有可能提供支撑/阻力。",
          "弱水平：未能创出新高或导致 CHoCH 的点位，通常会被价格突破。",
        ],
      },
    ],
  },
  {
    title: "第二阶段：质量评估与模型筛选",
    items: [
      {
        title: "5. 评估回调质量（Evaluate Pullback Quality）",
        bullets: [
          "观察脉冲移动（Impulse）是否强劲（大实体、同色 K 线多）。",
          "观察回调（Pullback）是否虚弱（混合颜色、小实体、多影线、低波动性）。",
        ],
      },
      {
        title: "6. 选择入场模型（Choose an Entry Model）",
        bullets: [
          "模型 A（回调/突破）：在支撑位寻找反弹或等待回调结构突破。",
          "模型 B（失效测试/2B 形态）：寻找价格短暂突破水平后迅速收回的“陷阱”信号。",
        ],
      },
    ],
  },
  {
    title: "第三阶段：微观确认（寻找“何时”入场）",
    items: [
      {
        title: "7. 低周期精炼（Refine with Lower Time Frames）",
        bullets: [
          "切换到更小的时间周期（如从日线切到 1 小时），观察大级别关键区内部的小级别趋势变化。",
        ],
      },
      {
        title: "8. 价格行为确认（Price Action Detail）",
        bullets: [
          "在关键位置寻找动量 K 线（实体是前一根的 2 倍以上）。",
          "识别特定 K 线形态，如锤子线、吞没形态或长影线反应。",
        ],
      },
      {
        title: "9. 订单流确认（Order Flow Confirmation）",
        bullets: [
          "成交量（Volume）：确认突破时伴随高成交量，证明有大量资金支持。",
          "足迹图（Footprint）：寻找吸收（Absorption）（反转信号）或启动（Initiation）（延续信号）。",
          "CVD 背离：观察价格与累计成交量 Delta 是否存在背离，以发现潜在的动竭或隐藏吸收。",
        ],
      },
    ],
  },
  {
    title: "第四阶段：执行与风险管理（Survival 技能）",
    items: [
      {
        title: "10. 设置止损（Set Stop-Loss）",
        bullets: ["通常设置在波段低点/高点之外，或者失败测试形态的影线末端。"],
      },
      {
        title: "11. 设定目标位（Set Targets）",
        bullets: [
          "使用测算移动（Measured Move，即下一次脉冲长度等于前一次）。",
          "或使用固定风险回报比（建议 2:1 或 3:1）。",
        ],
      },
    ],
  },
] as const;

const LOCAL_DRAFT_STORAGE_KEY = "trade-add-draft";
type SaveMode = "redirect" | "stay";

function extractTransactionId(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const root = payload as Record<string, unknown>;
  const rootId = root.transactionId ?? root.id;
  if (typeof rootId === "string" || typeof rootId === "number") {
    return String(rootId);
  }
  const data = root.data;
  if (data && typeof data === "object") {
    const dataObj = data as Record<string, unknown>;
    const dataId = dataObj.transactionId ?? dataObj.id;
    if (typeof dataId === "string" || typeof dataId === "number") {
      return String(dataId);
    }
  }
  return null;
}
/**
 * 新增交易页面
 * 复用 TradeFormDialog，独立页逻辑
 */
export default function TradeAddPage({
  className,
  readOnly = false,
  enableChecklist = true,
  detailMode = "transaction",
  detailId: detailIdProp,
  disableStatusChange = false,
}: {
  className?: string;
  readOnly?: boolean;
  enableChecklist?: boolean;
  detailMode?: "transaction" | "share";
  detailId?: string | null;
  disableStatusChange?: boolean;
}) {
  const [success, errorAlert] = useAlert();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm, resetForm] = useAtomImmer(formAtom);
  const [loading, setLoading] = useAtomImmer(loadingAtom);
  const [detailLoading, setDetailLoading] = useAtomImmer(detailLoadingAtom);
  const [shareLoading, setShareLoading] = useState(false);
  const mainScrollRef = useRef<HTMLDivElement | null>(null);
  const contentScrollRef = useRef<HTMLDivElement | null>(null);
  const [activeTocId, setActiveTocId] = useState<string | null>(null);
  // 主体渲染，非弹窗模式而是全宽居中大表单
  const transactionId = searchParams.get("id");
  const detailId = detailIdProp ?? transactionId;
  const isCreateMode = !detailId && !readOnly;

  // 新增时固定为已分析状态，避免跨状态填写
  useEffect(() => {
    if (!isCreateMode) {
      return;
    }
    setForm((draft) => {
      if (!draft.status) {
        draft.status = TradeStatus.ANALYZED;
      }
    });
  }, [isCreateMode, setForm]);

  // 详情回填逻辑
  useEffect(() => {
    if (detailId) {
      setDetailLoading(true);
      const fetchDetail =
        detailMode === "share" ? fetchSharedTradeDetail : fetchTradeDetail;
      fetchDetail(detailId)
        .then((data) => {
          // 合并已有字段，防止丢失自定义初值
          setForm((draft) => {
            Object.assign(draft, data);
          });
        })
        .catch((e) => {
          errorAlert("加载详情失败：" + (e && e.message ? e.message : e));
        })
        .finally(() => {
          setDetailLoading(false);
        });
    }
  }, [detailId, detailMode, errorAlert, setDetailLoading, setForm]);
  // }, [searchParams, errorAlert, setDetailLoading, setForm]);

  // 离开页面时自动重置表单，避免脏数据
  useEffect(() => {
    return () => {
      resetForm(formInitialState);
    };
  }, [resetForm]);

  // 本地暂存恢复
  useEffect(() => {
    if (transactionId || readOnly || typeof window === "undefined") {
      return;
    }
    try {
      const draft = window.localStorage.getItem(LOCAL_DRAFT_STORAGE_KEY);
      if (draft) {
        const parsed = JSON.parse(draft) as Partial<Trade>;
        setForm((draftState) => {
          Object.assign(draftState, parsed);
        });
      }
    } catch (err) {
      console.error("Failed to restore local draft", err);
    }
  }, [transactionId, readOnly, setForm]);

  // 提交函数 - 添加节流控制避免重复提交
  const submittingRef = useRef(false);
  const saveModeRef = useRef<SaveMode>("redirect");
  // 创建对表单组件的引用
  const formRef = useRef<TradeFormRef>(null);
  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      // 如果已经在提交中，则直接返回
      if (submittingRef.current || loading) {
        return;
      }

      // 设置提交状态
      submittingRef.current = true;
      setLoading(true);

      const id = transactionId;
      const saveMode = saveModeRef.current;
      try {
        if (id) {
          await updateTrade(id, toDto(form));
          success("更新成功");
        } else {
          const response = await createTrade(toDto(form));
          const createdId = extractTransactionId(response);
          success(saveMode === "stay" ? "保存成功" : "新建成功");
          if (saveMode === "stay" && createdId) {
            router.replace(`/trade/add?id=${createdId}`);
          }
        }
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(LOCAL_DRAFT_STORAGE_KEY);
        }
        if (saveMode === "redirect") {
          router.push("/trade/list");
        }
      } catch (error: unknown) {
        if (typeof error === "object" && error && "message" in error) {
          errorAlert(
            (error as { message?: string }).message ||
              (id ? "更新失败" : "创建失败"),
          );
        } else {
          errorAlert(id ? "更新失败" : "创建失败");
        }
      } finally {
        setLoading(false);
        // 重置提交状态
        submittingRef.current = false;
        saveModeRef.current = "redirect";
      }
    },
    [form, router, transactionId, success, errorAlert, loading, setLoading],
  );

  // 字段变化处理
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setForm((draft) => {
      draft[name] =
        type === "number" ? (value === "" ? "" : Number(value)) : value;
    });
  }, [setForm]);

  // Select 类型变化
  const handleSelectChange = useCallback(
    (key: keyof Trade, value: string) => {
      if (disableStatusChange && key === "status") {
        return;
      }
      setForm((draft) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        draft[key] = value as any;
      });
    },
    [setForm, disableStatusChange],
  );

  // 时间区间/日期变化
  const handleDateRangeChange = useCallback(
    (dateRange: import("react-day-picker").DateRange | undefined) => {
      setForm((draft) => {
        draft["entryTime"] = dateRange?.from
          ? dateRange.from.toISOString()
          : undefined;
        draft["exitTime"] = dateRange?.to
          ? dateRange.to.toISOString()
          : undefined;
      });
    },
    [setForm],
  );

  // 图片
  const handleImageChange = useCallback(
    (key: string, value: ImageResource[]) => {
      setForm((draft) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        draft[key] = value as any;
      });
    },
    [setForm],
  );

  // 计划字段
  const handlePlanChange = useCallback((key: string, value: EntryPlan) => {
    setForm((draft) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      draft[key] = value as any;
    });
  }, [setForm]);

  // 支持底层 updateForm 合并对象
  const updateForm = useCallback((patch: Partial<Trade>) => {
    console.log("updateForm", patch);
    setForm((draft) => {
      Object.assign(draft, patch);
    });
  }, [setForm]);

  const handleSaveStay = useCallback(() => {
    if (loading) return;
    saveModeRef.current = "stay";
    formRef.current?.submit();
  }, [loading]);

  const statusRank: Record<TradeStatus, number> = {
    [TradeStatus.ANALYZED]: 1,
    [TradeStatus.WAITING]: 2,
    [TradeStatus.ANALYZED_NOT_ENTERED]: 2,
    [TradeStatus.ENTERED]: 3,
    [TradeStatus.EXITED]: 4,
    [TradeStatus.EARLY_EXITED]: 4,
  };
  const currentRank = form.status ? statusRank[form.status] : 0;
  const shouldShowSection = useCallback(
    (target: TradeStatus) => currentRank >= statusRank[target],
    [currentRank],
  );
  const tocSections = [
    {
      id: "section-pre-entry-analysis",
      label: "入场前分析",
      visible: shouldShowSection(TradeStatus.ANALYZED),
    },
    {
      id: "section-entry-plan",
      label: "入场计划",
      visible: shouldShowSection(TradeStatus.WAITING),
    },
    {
      id: "section-pre-entry-checklist",
      label: "入场前检查",
      visible: enableChecklist && shouldShowSection(TradeStatus.WAITING),
    },
    {
      id: "section-not-entered",
      label: "未入场",
      visible: form.status === TradeStatus.ANALYZED_NOT_ENTERED,
    },
    {
      id: "section-entry-record",
      label: "入场记录",
      visible: shouldShowSection(TradeStatus.ENTERED),
    },
    {
      id: "section-post-exit-analysis",
      label: "离场后分析",
      visible: shouldShowSection(TradeStatus.EXITED),
    },
  ].filter((section) => section.visible);

  useEffect(() => {
    if (tocSections.length === 0) {
      setActiveTocId(null);
      return;
    }

    const container = contentScrollRef.current;
    if (!container) return;

    const targets = tocSections
      .map((item) => document.getElementById(item.id))
      .filter(Boolean) as HTMLElement[];

    if (targets.length === 0) return;

    const getTargetTop = (target: HTMLElement) => {
      const containerRect = container.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      return targetRect.top - containerRect.top + container.scrollTop;
    };

    let rafId = 0;
    const updateActive = () => {
      const scrollTop = container.scrollTop;
      const offset = 120;
      const orderedTargets = [...targets].sort(
        (a, b) => getTargetTop(a) - getTargetTop(b),
      );
      let currentId = orderedTargets[0].id;
      for (const target of orderedTargets) {
        if (getTargetTop(target) <= scrollTop + offset) {
          currentId = target.id;
        } else {
          break;
        }
      }
      setActiveTocId(currentId);
      rafId = 0;
    };

    const onScroll = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(updateActive);
    };

    updateActive();
    container.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      container.removeEventListener("scroll", onScroll);
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [tocSections]);

  const pageTitle = readOnly ? "交易详情" : "新增/编辑交易记录";
  const displayId = form.transactionId ?? detailId;
  const shareId = form.shareId;
  const isShareable = !!form.isShareable;
  const showShareControls =
    readOnly && !!transactionId && detailMode === "transaction";
  const shareUrl =
    shareId && typeof window !== "undefined"
      ? `${window.location.origin}/trade/shared/${shareId}`
      : "";

  const handleShare = useCallback(async () => {
    if (!transactionId || shareLoading) return;
    setShareLoading(true);
    try {
      const data = await shareTrade(transactionId);
      setForm((draft) => {
        draft.isShareable = !!data.isShareable;
        draft.shareId = data.shareId;
      });
      success("分享已开启");
    } catch (error: unknown) {
      if (typeof error === "object" && error && "message" in error) {
        errorAlert((error as { message?: string }).message || "分享失败");
      } else {
        errorAlert("分享失败");
      }
    } finally {
      setShareLoading(false);
    }
  }, [transactionId, shareLoading, setForm, success, errorAlert]);

  const handleCloseShare = useCallback(async () => {
    if (!transactionId || shareLoading) return;
    setShareLoading(true);
    try {
      const data = await updateTradeShareable(transactionId, false);
      setForm((draft) => {
        draft.isShareable = !!data.isShareable;
        draft.shareId = data.shareId;
      });
      success("已关闭分享");
    } catch (error: unknown) {
      if (typeof error === "object" && error && "message" in error) {
        errorAlert((error as { message?: string }).message || "关闭分享失败");
      } else {
        errorAlert("关闭分享失败");
      }
    } finally {
      setShareLoading(false);
    }
  }, [transactionId, shareLoading, setForm, success, errorAlert]);

  const handleCopyShareUrl = useCallback(async () => {
    if (!shareUrl || typeof navigator === "undefined") return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      success("分享链接已复制");
    } catch (error) {
      console.log("error:", error);

      errorAlert("复制失败，请手动复制链接");
    }
  }, [shareUrl, success, errorAlert]);

  const handleTocClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>, id: string) => {
      event.preventDefault();
      const container = contentScrollRef.current;
      const target = document.getElementById(id);
      if (!container || !target) return;
      const containerRect = container.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const offsetTop = targetRect.top - containerRect.top + container.scrollTop;
      container.scrollTo({ top: Math.max(offsetTop - 16, 0), behavior: "smooth" });
    },
    [],
  );

  return (
    <Suspense fallback={<div>加载中...</div>}>
      <div
        className={
          "relative min-h-screen h-screen flex flex-col overflow-hidden bg-[#000000] text-[#ededed] antialiased " +
          (className ?? "")
        }
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 left-1/4 h-72 w-2/3 rounded-full bg-emerald-400/10 blur-[140px]" />
          <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-sky-500/10 blur-[150px]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.04),transparent_45%)]" />
        </div>

        <header className="shrink-0 border-b border-white/10 bg-black/80 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-full items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="hidden items-center rounded-full border border-white/10 bg-black/40 p-1 md:flex">
              {tradeStatusOptions.map((option) => {
                const isActive = form.status === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelectChange("status", option.value)}
                    className={
                      "rounded-full px-4 py-1.5 text-xs font-medium transition-all cursor-pointer " +
                      (isActive
                        ? "bg-emerald-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]"
                        : "text-[#a1a1aa] hover:text-white")
                      // (isActive
                      //   ? "bg-emerald-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]"
                      //   : "text-[#a1a1aa] hover:text-white")
                    }
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
            {!readOnly && (
              <div className="flex items-center justify-end gap-4 rounded-2xl  bg-black/30 px-6 py-4 shadow-[0_4px_30px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
                <Button
                  type="button"
                  variant="outline"
                  disabled={loading}
                  onClick={handleSaveStay}
                  className="border-white/20 bg-white/5 text-[#a1a1aa] transition-colors hover:bg-white/10 hover:text-white"
                >
                  保存并留在此页
                </Button>
                <LoadingButton
                  loading={loading}
                  editTrade={form}
                  errors={{}}
                  className="bg-emerald-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all hover:-translate-y-0.5 hover:bg-[#4f46e5] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)]"
                  label="保存并返回列表"
                  onSubmit={() => {
                    // 直接调用表单组件的 submit 方法
                    saveModeRef.current = "redirect";
                    formRef.current?.submit();
                  }}
                />
              </div>
            )}
          </div>
        </header>

        <main
          ref={mainScrollRef}
          className="relative z-10 mx-auto w-full max-w-full flex-1 min-h-0 overflow-hidden px-4 py-10 sm:px-6 lg:px-8"
        >
          <div className="relative h-full min-h-0 xl:grid xl:grid-cols-[minmax(0,1fr)_16rem] xl:gap-6">
            <div className="min-w-0 h-full min-h-0">
              <div
                ref={contentScrollRef}
                className="h-full min-h-0 overflow-y-auto pr-2 space-y-6 emerald-scrollbar"
              >
              <div className="md:hidden">
                <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-[#a1a1aa]">
                  Trade Status
                </label>
                <div className="relative">
                  <select
                    className="w-full appearance-none rounded-lg border border-white/10 bg-[#0f0f10] px-4 py-3 text-sm text-white focus:border-[#6366f1] focus:ring-[#6366f1]"
                    value={(form.status as string) ?? ""}
                    onChange={(event) =>
                      handleSelectChange("status", event.target.value)
                    }
                  >
                    {tradeStatusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#a1a1aa]">
                    <span className="text-sm">▾</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/30 px-6 py-4 shadow-[0_4px_30px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
                {/* <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/30 px-6 py-4 shadow-[0_4px_30px_rgba(0,0,0,0.5)] backdrop-blur-2xl"> */}
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    {pageTitle}
                  </h2>
                  <p className="mt-1 text-xs font-mono text-[#a1a1aa]">
                    交易 ID: {displayId ? `#${displayId}` : "新交易"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {showShareControls && (
                    <div className="flex flex-wrap items-center gap-2 rounded-2xl  bg-black/40 px-3 py-2">
                      {isShareable && shareId ? (
                        <>
                          <Button
                            type="button"
                            variant="outline"
                            disabled={shareLoading}
                            onClick={handleCloseShare}
                            className="border-white/20 bg-white/5 text-[#a1a1aa] transition-colors hover:bg-white/10 hover:text-white"
                          >
                            关闭分享
                          </Button>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-[#a1a1aa]">
                              分享链接
                            </span>
                            <input
                              readOnly
                              value={shareUrl}
                              className="w-[220px] truncate rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-xs text-white"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              disabled={!shareUrl}
                              onClick={handleCopyShareUrl}
                              className="border-white/20 bg-white/5 text-[#a1a1aa] transition-colors hover:bg-white/10 hover:text-white"
                            >
                              复制
                            </Button>
                          </div>
                        </>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          disabled={shareLoading}
                          onClick={handleShare}
                          className="border-white/20 bg-white/5 text-[#a1a1aa] transition-colors hover:bg-white/10 hover:text-white"
                        >
                          生成分享链接
                        </Button>
                      )}
                    </div>
                  )}
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="border-white/20 bg-white/5 text-[#a1a1aa] transition-colors hover:bg-white/10 hover:text-white"
                      >
                        查看 Checklist
                      </Button>
                    </SheetTrigger>
                    <SheetContent
                      side="right"
                      className="border-white/10 bg-[#0b0b0c] text-[#ededed]"
                    >
                      <SheetHeader className="border-b border-white/10 px-6 py-5">
                        <SheetTitle className="text-base text-white">
                          交易执行 Checklist
                        </SheetTitle>
                      </SheetHeader>
                      <div className="space-y-6 overflow-y-auto px-6 pb-8 pt-4 text-sm">
                        {checklistSections.map((section) => (
                          <div key={section.title} className="space-y-3">
                            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300/80">
                              {section.title}
                            </h3>
                            <div className="space-y-3">
                              {section.items.map((item) => (
                                <div
                                  key={item.title}
                                  className="rounded-xl border border-white/10 bg-white/5 p-3"
                                >
                                  <div className="text-sm font-semibold text-white">
                                    {item.title}
                                  </div>
                                  <ul className="mt-2 space-y-1 text-xs text-[#cbd5f5]">
                                    {item.bullets.map((bullet) => (
                                      <li key={bullet} className="flex gap-2">
                                        <span className="mt-0.5 text-emerald-400">
                                          ▸
                                        </span>
                                        <span>{bullet}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              </div>

              <TradeFormDialog
                ref={formRef}
                editTrade={transactionId ? form : null}
                form={form}
                handleChange={handleChange}
                handleSelectChange={handleSelectChange}
                handleDateRangeChange={handleDateRangeChange}
                handleImageChange={handleImageChange}
                handlePlanChange={handlePlanChange}
                handleSubmit={handleSubmit}
                updateForm={updateForm}
                loading={loading}
                readOnly={readOnly}
                showChecklist={enableChecklist}
                formMode="distributed"
              />
              {(loading || detailLoading) && (
                <div className="text-center text-sm text-[#a1a1aa]">
                  {loading ? "保存中..." : "加载详情中..."}
                </div>
              )}
              </div>
            </div>

            {tocSections.length > 0 && (
              <aside
                className="hidden xl:block w-64 shrink-0 relative"
                data-purpose="table-of-contents"
              >
                <div className="sticky top-6 h-[calc(100vh-8rem)]">
                  <div className="bg-black/40 backdrop-blur-sm border-l border-white/10 pl-6 py-2 h-full overflow-y-auto">
                    <h4 className="text-xs font-bold text-[#a1a1aa] uppercase tracking-widest mb-4">
                      Table of Contents
                    </h4>
                    <ul className="space-y-4">
                      {tocSections.map((section, index) => {
                        const isActive = activeTocId
                          ? activeTocId === section.id
                          : index === 0;
                        return (
                          <li key={section.id}>
                            <a
                              className={
                                "flex items-center gap-3 text-xs font-medium uppercase tracking-widest group transition-colors " +
                                (isActive
                                  ? "text-emerald-300"
                                  : "text-[#a1a1aa] hover:text-white")
                              }
                              href={`#${section.id}`}
                              onClick={(event) =>
                                handleTocClick(event, section.id)
                              }
                            >
                              <span
                                className={
                                  "w-1.5 h-1.5 rounded-full transition-colors " +
                                  (isActive
                                    ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                                    : "bg-white/20 group-hover:bg-emerald-300")
                                }
                              />
                              <span className="group-hover:translate-x-1 transition-transform">
                                {section.label}
                              </span>
                            </a>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              </aside>
            )}
          </div>

          {/* {!readOnly && (
            <div className="flex items-center justify-end gap-4 rounded-2xl border border-white/10 bg-black/30 px-6 py-4 shadow-[0_4px_30px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
              <Button
                type="button"
                variant="outline"
                disabled={loading}
                onClick={handleSaveDraft}
                className="border-white/20 bg-white/5 text-[#a1a1aa] transition-colors hover:bg-white/10 hover:text-white"
              >
                暂存本地
              </Button>
              <LoadingButton
                loading={loading}
                editTrade={form}
                errors={{}}
                className="bg-emerald-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all hover:-translate-y-0.5 hover:bg-[#4f46e5] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)]"
                onSubmit={() => {
                  // 直接调用表单组件的 submit 方法
                  formRef.current?.submit();
                }}
              />
            </div>
          )} */}
        </main>
      </div>
    </Suspense>
  );
}
