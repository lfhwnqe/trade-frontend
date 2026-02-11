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
import { Input } from "@/components/ui/input";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
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

const STATUS_RANK: Record<TradeStatus, number> = {
  [TradeStatus.ANALYZED]: 1,
  [TradeStatus.WAITING]: 2,
  [TradeStatus.ANALYZED_NOT_ENTERED]: 2,
  [TradeStatus.ENTERED]: 3,
  [TradeStatus.EXITED]: 4,
  [TradeStatus.EARLY_EXITED]: 4,
};

const checklistSections = [
  {
    id: "check-4h-context",
    title: "4h 周期：定义战场与规则",
    items: [
      {
        title: "市场状态识别",
        checks: [
          "趋势：HH/HL 或 LH/LL，动能未衰竭。",
          "震荡：价格在大区间内上下扫荡。",
          "突破：价格收盘有效站上/站下区间。",
          "混乱：结构反复、不可预测，避免交易。",
        ],
      },
      {
        title: "基调与交易规则",
        checks: [
          "趋势：只做顺势回调，不逆势。",
          "震荡：溢价区做空、折价区做多，EQ 禁止交易。",
          "混乱：只观察，等待结构稳定。",
          "标注大级别支撑/阻力，等待价格到关键位。",
        ],
      },
    ],
  },
  {
    id: "check-structure",
    title: "绘制波浪与关键结构",
    items: [
      {
        title: "结构标记",
        checks: [
          "标记 Swing High / Swing Low。",
          "震荡：标记 RH / RL 与中轴 EQ。",
          "记录 BOS / CHOCH 作为结构确认或预警。",
        ],
      },
    ],
  },
  {
    id: "check-entry-modes",
    title: "1h + 15min：选择作战模式",
    items: [
      {
        title: "模式 A：顺势（4h 趋势强）",
        checks: [
          "背景：4h 趋势清晰，未出现失效信号。",
          "位置：回撤进入关键结构/阻力支撑带。",
          "结构：1h/15min 出现 BOS / CHOCH / 趋势线突破。",
          "节奏：回撤速度变慢，出现拒绝影线。",
          "K 线：关键位出现 Pinbar / 吞没等触发信号。",
          "加分项：隐藏背离或动能回升。",
          "核心：Footprint 出现续航/主动性回归。",
        ],
      },
      {
        title: "模式 B：震荡（4h 区间）",
        checks: [
          "位置：仅在 RH/RL 边界交易，EQ 禁止。",
          "形态：SFP / Liquidity Sweep 假突破回收。",
          "K 线：Pinbar / 锤子线 / 吞没（长影拒绝）。",
          "回测确认：回到区间内后回踩不破。",
          "核心：Stopping Volume（努力大但结果弱）。",
          "核心：订单流吸收，Delta 很大但价格不动。",
          "加分项：RSI/MACD 或 Delta 背离。",
        ],
      },
      {
        title: "模式 B+：区间突破",
        checks: [
          "强力引发：1h/4h 实体饱满，收盘站稳区间外。",
          "价值接受：区间外盘整而非快速回归。",
          "阻力互换：回踩区间边缘缩量且形态干净。",
          "核心：Footprint 出现失衡链或激进引发。",
          "核心：回踩出现支撑/Delta 翻转。",
        ],
      },
    ],
  },
  {
    id: "check-order-flow",
    title: "订单流（Footprint）最终滤网",
    items: [
      {
        title: "顺势场景（宽容度高）",
        checks: [
          "确认持续失衡堆叠推动价格。",
          "没有明显的反向吸收即可考虑入场。",
        ],
      },
      {
        title: "震荡/突破场景（必须严苛）",
        checks: [
          "吸收：Buy/Sell Delta 很大但价格不推进。",
          "Delta 背离：价格创新高/低但 Delta 下降。",
          "失衡反转：先有失衡后被反向吞没。",
        ],
      },
    ],
  },
  {
    id: "check-execution",
    title: "执行与风控",
    items: [
      {
        title: "开仓与止损止盈",
        checks: [
          "总分 ≥ 3 且至少包含 1 个核心项。",
          "止损：放在结构失效点或针尖外侧。",
          "止盈：前高/前低或结构位，趋势延续分批。",
          "震荡突破失败：跌回区间即止损。",
        ],
      },
      {
        title: "记录与复盘",
        checks: ["用计分卡记录入场理由与证据。"],
      },
    ],
  },
  {
    id: "check-scoring",
    title: "打分细节（计分卡）",
    items: [
      {
        title: "通用开仓评分规则",
        checks: [
          "总分 ≥ 3 分。",
          "必须包含至少 1 个核心项（2 分）。",
          "顺势/震荡/突破三种模式均适用评分规则。",
        ],
      },
      {
        title: "顺势模式评分明细",
        checks: [
          "必须：背景（4h 趋势清晰）。",
          "必须：位置（回撤进入关键位）。",
          "1 分：结构（BOS/CHOCH/趋势线突破）。",
          "1 分：节奏（回撤速度变慢/拒绝影线）。",
          "1 分：K 线触发（Pinbar/吞没/破底翻）。",
          "1 分：背离（隐藏背离/动能回升）。",
          "2 分：订单流续航（Imbalance/主动性回归）。",
        ],
      },
      {
        title: "震荡模式评分明细",
        checks: [
          "必须：位置（RH/RL 边界，EQ 禁止）。",
          "1 分：形态（SFP/Liquidity Sweep）。",
          "1 分：K 线（Pinbar/锤子线/吞没）。",
          "1 分：回测确认（回踩不破）。",
          "2 分：量价（Stopping Volume）。",
          "2 分：订单流吸收（Delta 很大但价格不动）。",
          "1 分：背离（RSI/MACD 或 Delta 背离）。",
        ],
      },
      {
        title: "突破模式评分明细",
        checks: [
          "必须：强力引发（实体饱满收盘站稳区间外）。",
          "1 分：价值接受（区间外盘整）。",
          "1 分：阻力互换（回踩缩量且形态干净）。",
          "2 分：订单流失衡链/激进引发。",
          "2 分：回踩支撑/Delta 翻转。",
        ],
      },
    ],
  },
] as const;

const LOCAL_DRAFT_STORAGE_KEY = "trade-add-draft";
const CHECKLIST_STATE_KEY = "trade-checklist-state";
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
  const [checklistOpen, setChecklistOpen] = useState(false);
  const checklistScrollRef = useRef<HTMLDivElement | null>(null);
  const checklistScrollTopRef = useRef(0);
  const [activeChecklistId, setActiveChecklistId] = useState<string | null>(null);
  const [checklistState, setChecklistState] = useState<Record<string, boolean>>(
    {},
  );

  // Trade webhook (TradingView -> Telegram)
  const [webhookLoading, setWebhookLoading] = useState(false);
  const [webhookExists, setWebhookExists] = useState(false);
  const [webhookTriggerUrl, setWebhookTriggerUrl] = useState<string>("");
  const [webhookHookId, setWebhookHookId] = useState<string>("");
  const [webhookChatTitle, setWebhookChatTitle] = useState<string>("");
  const [webhookBindCode, setWebhookBindCode] = useState<string>("");
  // legacy secret removed (TradingView-friendly triggerUrl does not require header secrets)
  const [webhookTestSending, setWebhookTestSending] = useState(false);
  const [webhookTestMessage, setWebhookTestMessage] = useState(
    "hello from MMCTradeJournal",
  );
  const [webhookOpen, setWebhookOpen] = useState(false);
  // 主体渲染，非弹窗模式而是全宽居中大表单
  const transactionId = searchParams.get("id");
  const detailId = detailIdProp ?? transactionId;
  const isCreateMode = !detailId && !readOnly;

  const origin =
    typeof window !== "undefined" ? window.location.origin : "";

  const webhookTriggerToken = React.useMemo(() => {
    if (!webhookTriggerUrl) return "";
    // backend trigger url: .../webhook/trade-alert/<token>/<tradeShortId>
    const parts = webhookTriggerUrl.split("/webhook/trade-alert/");
    if (parts.length < 2) return "";
    const tail = parts[1];
    const seg = tail.split("/").filter(Boolean);
    return seg[0] || "";
  }, [webhookTriggerUrl]);

  const webhookTestUrl = React.useMemo(() => {
    if (!origin || !webhookTriggerToken) return "";
    const qs = new URLSearchParams();
    qs.set("token", webhookTriggerToken);
    // tradeShortId is already embedded in triggerUrl path; proxy accepts optional tradeShortId
    // but including it makes intent explicit.
    const tradeShortId = webhookTriggerUrl
      .split("/webhook/trade-alert/")[1]
      ?.split("/")[1];
    if (tradeShortId) qs.set("tradeShortId", tradeShortId);
    return `${origin}/api/webhook?${qs.toString()}`;
  }, [origin, webhookTriggerToken, webhookTriggerUrl]);

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

      const resolveImageUrls = async (data: Trade): Promise<Trade> => {
        const collectRefs = (items?: Array<{ image?: { key?: string; url?: string } }>) =>
          (items || [])
            .map((item) => item?.image?.key || item?.image?.url || "")
            .map((ref) => ref.trim())
            .filter(Boolean);

        const refs = Array.from(
          new Set([
            ...collectRefs(data.volumeProfileImages),
            ...collectRefs(data.marketStructureAnalysisImages),
            ...collectRefs(data.trendAnalysisImages),
          ]),
        );

        if (refs.length === 0) return data;

        try {
          const resp = await fetchWithAuth("/api/proxy-post", {
            method: "POST",
            credentials: "include",
            proxyParams: {
              targetPath: "trade/image/resolve",
              actualMethod: "POST",
            },
            actualBody: {
              refs,
              ...(data.transactionId ? { transactionId: data.transactionId } : {}),
            },
          });

          if (!resp.ok) {
            return data;
          }

          const json = (await resp.json()) as {
            data?: {
              items?: Array<{ ref?: string; url?: string }>;
            };
          };
          const items = json?.data?.items || [];
          const urlMap = new Map<string, string>();
          items.forEach((it) => {
            const ref = String(it?.ref || "").trim();
            const url = String(it?.url || "").trim();
            if (ref && url) urlMap.set(ref, url);
          });

          const patchImages = (
            items?: Array<{ image?: { key?: string; url?: string } }> ,
          ) =>
            (items || []).map((item) => {
              const key = item?.image?.key?.trim();
              const rawUrl = item?.image?.url?.trim();
              const resolvedUrl =
                (key && urlMap.get(key)) ||
                (rawUrl && urlMap.get(rawUrl)) ||
                item?.image?.url ||
                "";

              return {
                ...item,
                image: {
                  ...(item?.image || {}),
                  url: resolvedUrl,
                },
              };
            });

          return {
            ...data,
            volumeProfileImages: patchImages(data.volumeProfileImages) as ImageResource[],
            marketStructureAnalysisImages: patchImages(
              data.marketStructureAnalysisImages,
            ) as Trade["marketStructureAnalysisImages"],
            trendAnalysisImages: patchImages(data.trendAnalysisImages) as Trade["trendAnalysisImages"],
          };
        } catch {
          return data;
        }
      };

      fetchDetail(detailId)
        .then(async (data) => {
          const resolvedData = await resolveImageUrls(data);
          // 合并已有字段，防止丢失自定义初值
          setForm((draft) => {
            Object.assign(draft, resolvedData);
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

  // Load trade webhook status
  useEffect(() => {
    if (!transactionId) {
      return;
    }

    let cancelled = false;
    const run = async () => {
      setWebhookLoading(true);
      setWebhookBindCode("");      try {
        const resp = await fetchWithAuth("/api/proxy-post", {
          method: "POST",
          credentials: "include",
          proxyParams: {
            targetPath: `trade/${encodeURIComponent(transactionId)}/webhook`,
            actualMethod: "GET",
          },
          actualBody: {},
        });

        const json = (await resp.json()) as {
          data?: {
            exists?: boolean;
            hook?: {
              hookId?: string;
              triggerUrl?: string;
              chatTitle?: string;
            };
          };
        };
        const exists = !!json?.data?.exists;
        if (cancelled) return;

        setWebhookExists(exists);
        if (!exists) {
          setWebhookTriggerUrl("");
          setWebhookHookId("");
          setWebhookChatTitle("");
          return;
        }

        const hook = json?.data?.hook;
        setWebhookTriggerUrl(String(hook?.triggerUrl || ""));
        setWebhookHookId(String(hook?.hookId || ""));
        setWebhookChatTitle(String(hook?.chatTitle || ""));
      } catch (e) {
        // ignore; do not block detail
        console.warn("Failed to load webhook status", e);
      } finally {
        if (!cancelled) setWebhookLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [transactionId]);

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

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem(CHECKLIST_STATE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, boolean>;
        setChecklistState(parsed);
      }
    } catch (err) {
      console.error("Failed to restore checklist state", err);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        CHECKLIST_STATE_KEY,
        JSON.stringify(checklistState),
      );
    } catch (err) {
      console.error("Failed to persist checklist state", err);
    }
  }, [checklistState]);

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

  const getChecklistKey = useCallback(
    (sectionId: string, itemTitle: string, checkText: string) =>
      `${sectionId}::${itemTitle}::${checkText}`,
    [],
  );

  const handleChecklistToggle = useCallback((key: string) => {
    setChecklistState((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }, []);

  const handleChecklistOpenChange = useCallback((open: boolean) => {
    setChecklistOpen(open);
    if (!open) {
      if (checklistScrollRef.current) {
        checklistScrollTopRef.current = checklistScrollRef.current.scrollTop;
      }
      return;
    }
    window.requestAnimationFrame(() => {
      if (checklistScrollRef.current) {
        checklistScrollRef.current.scrollTop = checklistScrollTopRef.current;
      }
    });
  }, []);

  const handleChecklistJump = useCallback((id: string) => {
    const container = checklistScrollRef.current;
    const target = document.getElementById(id);
    if (!container || !target) return;
    const containerRect = container.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const offset = 12;
    container.scrollTo({
      top: container.scrollTop + (targetRect.top - containerRect.top) - offset,
      behavior: "smooth",
    });
  }, []);

  const currentRank = form.status ? STATUS_RANK[form.status] : 0;
  const shouldShowSection = useCallback(
    (target: TradeStatus) => currentRank >= STATUS_RANK[target],
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
      const orderedTargets = readOnly
        ? targets
        : [...targets].sort((a, b) => getTargetTop(a) - getTargetTop(b));
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
  }, [tocSections, readOnly]);

  useEffect(() => {
    if (!checklistOpen) {
      setActiveChecklistId(null);
      return;
    }
    const container = checklistScrollRef.current;
    if (!container) return;

    const targets = checklistSections
      .map((section) => document.getElementById(section.id))
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
      let currentId = targets[0].id;
      for (const target of targets) {
        if (getTargetTop(target) <= scrollTop + offset) {
          currentId = target.id;
        } else {
          break;
        }
      }
      setActiveChecklistId(currentId);
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
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [checklistOpen]);

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
                        ? "bg-[#00c2b2] text-black shadow-[0_0_15px_rgba(0,194,178,0.45)]"
                        : "text-[#a1a1aa] hover:text-[#00c2b2]")
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
                  className="bg-[#00c2b2] text-black shadow-[0_0_20px_rgba(0,194,178,0.35)] transition-all hover:-translate-y-0.5 hover:bg-[#009e91] hover:shadow-[0_0_25px_rgba(0,194,178,0.5)]"
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
            <div className="min-w-0 h-full min-h-0 flex flex-col">
              <div className="space-y-6 pr-2">
                

                        
<div className="md:hidden">
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-[#a1a1aa]">
                    Trade Status
                  </label>
                  <div className="relative">
                    <select
                      className="w-full appearance-none rounded-lg border border-white/10 bg-[#0f0f10] px-4 py-3 text-sm text-white focus:border-[#00c2b2] focus:ring-[#00c2b2]"
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

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[rgba(15,15,16,0.7)] px-6 py-4 shadow-[0_4px_30px_rgba(0,0,0,0.5)] backdrop-blur-2xl mb-2">
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
                  <Sheet open={checklistOpen} onOpenChange={handleChecklistOpenChange}>
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
                      className="w-[90vw] max-w-[980px] sm:max-w-[980px] border-white/10 bg-[#0b0b0c] text-[#ededed]"
                    >
                      <div className="flex h-full flex-col">
                        <SheetHeader className="border-b border-white/10 px-6 py-5">
                          <SheetTitle className="text-base text-white">
                            交易执行 Checklist
                          </SheetTitle>
                        </SheetHeader>
                        <div className="flex min-h-0 flex-1">
                          <div
                            ref={checklistScrollRef}
                            className="flex-1 space-y-6 overflow-y-auto emerald-scrollbar px-6 pb-8 pt-4 text-sm"
                          >
                            {checklistSections.map((section) => (
                              <div
                                key={section.id}
                                id={section.id}
                                className="space-y-3 scroll-mt-6"
                              >
                                <h3 className="text-xs font-semibold uppercase tracking-[0.2em] ">
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
                                        {item.checks.map((check) => {
                                          const key = getChecklistKey(
                                            section.id,
                                            item.title,
                                            check,
                                          );
                                          const checked = !!checklistState[key];
                                          return (
                                            <li key={check}>
                                              <label className="flex cursor-pointer items-start gap-2">
                                                <input
                                                  type="checkbox"
                                                  checked={checked}
                                                  onChange={() =>
                                                    handleChecklistToggle(key)
                                                  }
                                                  className="mt-0.5 h-3 w-3 rounded border border-white/30 bg-transparent text-emerald-400"
                                                />
                                                <span>{check}</span>
                                              </label>
                                            </li>
                                          );
                                        })}
                                      </ul>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="w-48 shrink-0 border-l border-white/10 px-4 py-4">
                            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9ca3af]">
                              Anchor
                            </div>
                            <div className="mt-4 space-y-2">
                              {checklistSections.map((section) => {
                                const isActive =
                                  activeChecklistId === section.id;
                                return (
                                  <button
                                    key={section.id}
                                    type="button"
                                    onClick={() => handleChecklistJump(section.id)}
                                    className={
                                      "w-full rounded-lg border px-3 py-2 text-left text-xs transition-colors " +
                                      (isActive
                                        ? "border-emerald-400/60 bg-emerald-400/10 text-emerald-200"
                                        : "border-white/10 text-[#cbd5f5] hover:border-white/30 hover:text-white")
                                    }
                                  >
                                    {section.title}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>

                  <Sheet open={webhookOpen} onOpenChange={setWebhookOpen}>
                    <SheetTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={!transactionId}
                        className="border-white/20 bg-white/5 text-[#a1a1aa] transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
                      >
                        Webhook
                      </Button>
                    </SheetTrigger>
                    <SheetContent
                      side="right"
                      className="w-[90vw] max-w-[980px] sm:max-w-[980px] border-white/10 bg-[#0b0b0c] text-[#ededed]"
                    >
                      <div className="flex h-full flex-col">
                        <SheetHeader className="border-b border-white/10 px-6 py-5">
                          <SheetTitle className="text-base text-white">
                            TradingView Webhook（此交易）
                          </SheetTitle>
                          <div className="mt-2 text-xs text-white/50">
                            为这笔交易创建 webhook，并绑定到 Telegram 群。
                          </div>
                        </SheetHeader>

                        <div className="flex-1 min-h-0 overflow-y-auto emerald-scrollbar px-6 py-6 space-y-4">
                          {!transactionId ? (
                            <div className="text-sm text-white/60">
                              请先保存该交易后再创建 webhook。
                            </div>
                          ) : (
                            <>
                              <div className="flex flex-wrap items-center gap-2">
                                {!webhookExists ? (
                                  <Button
                                    type="button"
                                    disabled={webhookLoading}
                                    className="bg-[#00c2b2] text-black hover:bg-[#009e91]"
                                    onClick={async () => {
                                      if (!transactionId) return;
                                      setWebhookLoading(true);
                                      setWebhookBindCode("");                                      try {
                                        const resp = await fetchWithAuth(
                                          "/api/proxy-post",
                                          {
                                            method: "POST",
                                            credentials: "include",
                                            proxyParams: {
                                              targetPath: `trade/${encodeURIComponent(transactionId)}/webhook`,
                                              actualMethod: "POST",
                                            },
                                            actualBody: {},
                                          },
                                        );

                                        const json = (await resp.json()) as {
                                          success?: boolean;
                                          message?: string;
                                          data?: {
                                            hook?: {
                                              hookId?: string;
                                              chatTitle?: string;
                                            };
                                            hookId?: string;
                                            triggerUrl?: string;
                                            bindCode?: string;
                                            secret?: string;
                                          };
                                        };
                                        if (!resp.ok || !json?.success) {
                                          throw new Error(
                                            json?.message || "创建 webhook 失败",
                                          );
                                        }

                                        const data = json?.data;
                                        setWebhookExists(true);
                                        setWebhookTriggerUrl(
                                          String(data?.triggerUrl || ""),
                                        );
                                        setWebhookHookId(
                                          String(
                                            data?.hook?.hookId ||
                                              data?.hookId ||
                                              "",
                                          ),
                                        );
                                        setWebhookBindCode(
                                          String(data?.bindCode || ""),
                                        );
                                        setWebhookChatTitle(
                                          String(data?.hook?.chatTitle || ""),
                                        );
                                        success(
                                          "Webhook 创建成功：bindCode 仅展示一次，请及时复制",
                                        );
                                      } catch (e) {
                                        const msg =
                                          e instanceof Error
                                            ? e.message
                                            : "创建 webhook 失败";
                                        errorAlert(msg);
                                      } finally {
                                        setWebhookLoading(false);
                                      }
                                    }}
                                  >
                                    {webhookLoading
                                      ? "创建中..."
                                      : "创建 webhook"}
                                  </Button>
                                ) : (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    disabled={webhookLoading}
                                    className="border-white/20 bg-white/5 text-white hover:bg-white/10"
                                    onClick={async () => {
                                      const ok = confirm(
                                        "确认删除该交易的 webhook？删除后 TradingView 触发将失效。",
                                      );
                                      if (!ok) return;
                                      setWebhookLoading(true);
                                      try {
                                        const resp = await fetchWithAuth(
                                          "/api/proxy-post",
                                          {
                                            method: "POST",
                                            credentials: "include",
                                            proxyParams: {
                                              targetPath: `trade/${encodeURIComponent(transactionId)}/webhook`,
                                              actualMethod: "DELETE",
                                            },
                                            actualBody: {},
                                          },
                                        );
                                        const json = (await resp.json()) as {
                                          success?: boolean;
                                          message?: string;
                                          data?: unknown;
                                        };
                                        if (!resp.ok || !json?.success) {
                                          throw new Error(
                                            json?.message || "删除 webhook 失败",
                                          );
                                        }
                                        setWebhookExists(false);
                                        setWebhookTriggerUrl("");
                                        setWebhookHookId("");
                                        setWebhookBindCode("");                                        setWebhookChatTitle("");
                                        success("Webhook 已删除");
                                      } catch (e) {
                                        const msg =
                                          e instanceof Error
                                            ? e.message
                                            : "删除 webhook 失败";
                                        errorAlert(msg);
                                      } finally {
                                        setWebhookLoading(false);
                                      }
                                    }}
                                  >
                                    {webhookLoading
                                      ? "删除中..."
                                      : "删除 webhook"}
                                  </Button>
                                )}
                              </div>

                              {webhookExists ? (
                                <div className="space-y-3">
                                  <div>
                                    <div className="text-xs text-white/50 mb-1">
                                      TradingView Webhook URL
                                    </div>
                                    <div className="flex gap-2">
                                      <input
                                        value={webhookTriggerUrl}
                                        readOnly
                                        className="h-10 w-full rounded-md border border-white/10 bg-black/40 px-3 text-xs text-white/80 outline-none"
                                      />
                                      <Button
                                        type="button"
                                        variant="outline"
                                        className="border-white/20 bg-white/5 text-white hover:bg-white/10"
                                        onClick={async () => {
                                          if (!webhookTriggerUrl) return;
                                          try {
                                            await navigator.clipboard.writeText(
                                              webhookTriggerUrl,
                                            );
                                            success("已复制 webhook URL");
                                          } catch {
                                            errorAlert("复制失败，请手动复制");
                                          }
                                        }}
                                      >
                                        复制
                                      </Button>
                                    </div>
                                  </div>

                                  <div className="text-xs text-white/50">
                                    绑定状态：
                                    {webhookChatTitle
                                      ? `已绑定到群「${webhookChatTitle}」`
                                      : "未绑定（把 bot 拉进群后 /bind）"}
                                  </div>

                                  {webhookBindCode ? (
                                    <div className="rounded-lg border border-white/10 bg-black/30 p-3">
                                      <div className="flex items-center justify-between gap-3">
                                        <div className="text-xs text-white/60">
                                          群内绑定命令
                                        </div>
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="outline"
                                          className="border-white/20 bg-white/5 text-white hover:bg-white/10"
                                          onClick={async () => {
                                            const cmd = `/bind ${webhookBindCode}`;
                                            try {
                                              await navigator.clipboard.writeText(cmd);
                                              success("已复制 /bind 命令");
                                            } catch {
                                              errorAlert("复制失败，请手动复制");
                                            }
                                          }}
                                        >
                                          复制
                                        </Button>
                                      </div>
                                      <input
                                        readOnly
                                        value={`/bind ${webhookBindCode}`}
                                        className="mt-2 h-10 w-full rounded-md border border-white/10 bg-black/40 px-3 text-xs font-mono text-white/80 outline-none"
                                      />
                                      <div className="mt-2 text-xs text-white/40">
                                        提示：bindCode 很长是正常的，建议直接复制粘贴。
                                      </div>
                                    </div>
                                  ) : null}

                                  {webhookHookId ? (
                                    <div>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        className="border-white/20 bg-white/5 text-white hover:bg-white/10"
                                        onClick={async () => {
                                          if (!webhookHookId) return;
                                          setWebhookLoading(true);
                                          try {
                                            const resp = await fetchWithAuth(
                                              "/api/proxy-post",
                                              {
                                                method: "POST",
                                                credentials: "include",
                                                proxyParams: {
                                                  targetPath: `user/webhooks/${encodeURIComponent(webhookHookId)}/bind-code`,
                                                  actualMethod: "POST",
                                                },
                                                actualBody: {},
                                              },
                                            );
                                            const json = (await resp.json()) as {
                                              success?: boolean;
                                              message?: string;
                                              data?: { bindCode?: string };
                                            };
                                            if (!resp.ok || !json?.success) {
                                              throw new Error(
                                                json?.message ||
                                                  "生成 bindCode 失败",
                                              );
                                            }
                                            setWebhookBindCode(
                                              String(json?.data?.bindCode || ""),
                                            );
                                            success("已生成新的 bindCode");
                                          } catch (e) {
                                            const msg =
                                              e instanceof Error
                                                ? e.message
                                                : "生成 bindCode 失败";
                                            errorAlert(msg);
                                          } finally {
                                            setWebhookLoading(false);
                                          }
                                        }}
                                      >
                                        生成绑定码（bindCode）
                                      </Button>
                                    </div>
                                  ) : null}

                                  {webhookTestUrl ? (
                                    <div className="rounded-lg border border-white/10 bg-black/30 p-3">
                                      <div className="text-xs text-white/60">
                                        测试
                                      </div>
                                      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                                        <Input
                                          value={webhookTestMessage}
                                          onChange={(e) =>
                                            setWebhookTestMessage(e.target.value)
                                          }
                                          placeholder="自定义 message（测试用）"
                                          className="h-10 border-white/10 bg-black/40 text-white placeholder:text-white/30"
                                        />
                                        <Button
                                          type="button"
                                          disabled={webhookTestSending}
                                          className="bg-[#00c2b2] text-black hover:bg-[#009e91]"
                                          onClick={async () => {
                                            if (!webhookTestUrl) return;
                                            setWebhookTestSending(true);
                                            try {
                                              const resp = await fetch(
                                                webhookTestUrl,
                                                {
                                                  method: "POST",
                                                  headers: {
                                                    "Content-Type": "application/json",
                                                  },
                                                  body: JSON.stringify({
                                                    message: webhookTestMessage,
                                                  }),
                                                },
                                              );
                                              const text = await resp.text();
                                              if (!resp.ok) {
                                                throw new Error(
                                                  text || `HTTP ${resp.status}`,
                                                );
                                              }
                                              success(
                                                "已触发：请到 Telegram 群查看消息",
                                              );
                                            } catch (e) {
                                              const msg =
                                                e instanceof Error
                                                  ? e.message
                                                  : "触发失败";
                                              errorAlert(msg);
                                            } finally {
                                              setWebhookTestSending(false);
                                            }
                                          }}
                                        >
                                          {webhookTestSending
                                            ? "触发中..."
                                            : "测试触发"}
                                        </Button>
                                      </div>
                                      <div className="mt-2 text-xs text-white/40">
                                        注意：同一个 webhook 1 分钟只能触发 1 次。
                                      </div>
                                    </div>
                                  ) : null}
                                </div>
                              ) : (
                                <div className="text-sm text-white/60">
                                  尚未创建 webhook。
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              </div>
              </div>

              <div
                ref={contentScrollRef}
                className="flex-1 min-h-0 overflow-y-auto pr-2 space-y-6 emerald-scrollbar rounded-xs"
              >

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
                                  ? "text-[#00c2b2]"
                                  : "text-[#a1a1aa] hover:text-[#00c2b2]")
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
                                    ? "bg-[#00c2b2] shadow-[0_0_8px_rgba(0,194,178,0.8)]"
                                    : "bg-white/20 group-hover:bg-[#00c2b2]")
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
